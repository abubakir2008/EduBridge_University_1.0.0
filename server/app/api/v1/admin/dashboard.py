from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import require_admin
from app.models.student_progress import StudentProgress, ProgressStatus
from app.models.stage import Stage
from app.models.user import User, AccountStatus

router = APIRouter(prefix="/admin/dashboard", tags=["admin"])


@router.get("")
def dashboard(db: Session = Depends(get_db), _=Depends(require_admin)):
    total_students = db.query(User).filter(User.role == "student").count()
    enrolled = db.query(User).filter(User.account_status == AccountStatus.enrolled).count()
    in_progress = db.query(StudentProgress).filter(StudentProgress.status == ProgressStatus.in_progress).count()
    completed = db.query(StudentProgress).filter(StudentProgress.status == ProgressStatus.completed).count()
    overdue_count = _count_overdue(db)

    return {
        "total_students": total_students,
        "enrolled": enrolled,
        "in_progress": in_progress,
        "completed": completed,
        "overdue_count": overdue_count,
    }


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
        if stage and stage.deadline and stage.deadline < today:
            results.append({
                "user_id": str(progress.user_id),
                "university_id": str(progress.university_id),
                "stage_name": stage.name,
                "deadline": str(stage.deadline),
                "days_overdue": (today - stage.deadline).days,
            })
    return results


@router.get("/students")
def all_students(db: Session = Depends(get_db), _=Depends(require_admin)):
    progresses = db.query(StudentProgress).all()
    result = []
    for p in progresses:
        stage = db.get(Stage, p.current_stage_id) if p.current_stage_id else None
        result.append({
            "user_id": str(p.user_id),
            "university_id": str(p.university_id),
            "status": p.status.value,
            "current_stage": stage.name if stage else None,
            "started_at": p.started_at.isoformat(),
        })
    return result


def _count_overdue(db: Session) -> int:
    today = date.today()
    count = 0
    progresses = db.query(StudentProgress).filter(
        StudentProgress.status == ProgressStatus.in_progress,
        StudentProgress.current_stage_id.isnot(None),
    ).all()
    for p in progresses:
        stage = db.get(Stage, p.current_stage_id)
        if stage and stage.deadline and stage.deadline < today:
            count += 1
    return count
