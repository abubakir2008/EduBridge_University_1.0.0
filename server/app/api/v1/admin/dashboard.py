from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import require_admin
from app.models.student_progress import StudentProgress, ProgressStatus
from app.models.stage import Stage
from app.models.student_stage_deadline import StudentStageDeadline
from app.models.user import User, AccountStatus
from app.models.lead import Lead, LeadStatus

router = APIRouter(prefix="/admin/dashboard", tags=["admin"])


@router.get("")
def dashboard(db: Session = Depends(get_db), _=Depends(require_admin)):
    total_students = db.query(User).filter(User.role == "student").count()
    active_students = db.query(User).filter(
        User.role == "student", User.account_status == AccountStatus.active
    ).count()
    enrolled = db.query(User).filter(User.account_status == AccountStatus.enrolled).count()
    archived = db.query(User).filter(User.account_status == AccountStatus.archived).count()
    new_leads = db.query(Lead).filter(Lead.status == LeadStatus.new).count()
    overdue_count = _count_overdue(db)

    # Funnel: leads → contacted → registered → students → enrolled
    leads_total = db.query(Lead).count()
    contacted = db.query(Lead).filter(Lead.status == LeadStatus.contacted).count()
    registered = db.query(Lead).filter(Lead.status == LeadStatus.registered).count()

    funnel = [
        {"label": "Всего заявок", "value": leads_total},
        {"label": "Связались", "value": contacted},
        {"label": "Зарегистрированы", "value": registered},
        {"label": "Активных студентов", "value": active_students},
        {"label": "Поступили", "value": enrolled},
    ]

    return {
        "total_students": total_students,
        "active_students": active_students,
        "enrolled_students": enrolled,
        "archived_students": archived,
        "new_leads": new_leads,
        "overdue_students": overdue_count,
        "funnel": funnel,
    }


@router.get("/monthly")
def monthly_stats(db: Session = Depends(get_db), _=Depends(require_admin)):
    today = date.today()
    result = []
    for i in range(5, -1, -1):
        month_start = (today.replace(day=1) - timedelta(days=i * 30)).replace(day=1)
        if i == 0:
            month_end = today
        else:
            next_month = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
            month_end = next_month - timedelta(days=1)

        month_start_dt = datetime(month_start.year, month_start.month, month_start.day)
        month_end_dt = datetime(month_end.year, month_end.month, month_end.day, 23, 59, 59)

        students = db.query(User).filter(
            User.role == "student",
            User.created_at >= month_start_dt,
            User.created_at <= month_end_dt,
        ).count()
        leads = db.query(Lead).filter(
            Lead.created_at >= month_start_dt,
            Lead.created_at <= month_end_dt,
        ).count()
        result.append({
            "month": month_start.strftime("%b %Y"),
            "students": students,
            "leads": leads,
        })
    return result


@router.get("/overdue")
def overdue_students(db: Session = Depends(get_db), _=Depends(require_admin)):
    today = date.today()
    results = []
    progresses = db.query(StudentProgress).filter(
        StudentProgress.status == ProgressStatus.in_progress,
        StudentProgress.current_stage_id.isnot(None),
    ).all()

    for progress in progresses:
        stage = db.get(Stage, progress.current_stage_id)
        if not stage:
            continue
        ssd = db.query(StudentStageDeadline).filter(
            StudentStageDeadline.student_progress_id == progress.id,
            StudentStageDeadline.stage_id == progress.current_stage_id,
        ).first()
        if ssd and ssd.deadline < today:
            user = db.get(User, progress.user_id)
            results.append({
                "id": str(progress.user_id),
                "full_name": user.full_name if user else "—",
                "login": user.login if user else "—",
                "account_status": user.account_status.value if user else "active",
                "current_stage": stage.name,
                "university": None,
                "created_at": user.created_at.isoformat() if user else "",
            })
    return results


@router.get("/students")
def all_students(db: Session = Depends(get_db), _=Depends(require_admin)):
    users = db.query(User).filter(User.role == "student").order_by(User.created_at.desc()).all()
    result = []
    for u in users:
        progress = db.query(StudentProgress).filter(
            StudentProgress.user_id == u.id,
            StudentProgress.status == ProgressStatus.in_progress,
        ).first()
        stage_name = None
        if progress and progress.current_stage_id:
            stage = db.get(Stage, progress.current_stage_id)
            stage_name = stage.name if stage else None
        result.append({
            "id": str(u.id),
            "full_name": u.full_name,
            "login": u.login,
            "account_status": u.account_status.value,
            "current_stage": stage_name,
            "university": None,
            "created_at": u.created_at.isoformat(),
        })
    return result


def _count_overdue(db: Session) -> int:
    today = date.today()
    progresses = db.query(StudentProgress).filter(
        StudentProgress.status == ProgressStatus.in_progress,
        StudentProgress.current_stage_id.isnot(None),
    ).all()
    count = 0
    for p in progresses:
        ssd = db.query(StudentStageDeadline).filter(
            StudentStageDeadline.student_progress_id == p.id,
            StudentStageDeadline.stage_id == p.current_stage_id,
        ).first()
        if ssd and ssd.deadline < today:
            count += 1
    return count
