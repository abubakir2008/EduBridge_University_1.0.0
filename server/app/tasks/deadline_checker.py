from datetime import date
from app.db.session import SessionLocal
from app.models.student_progress import StudentProgress, ProgressStatus
from app.models.stage import Stage
from app.models.user import User
from app.services import notification_service


def check_deadlines() -> None:
    db = SessionLocal()
    try:
        today = date.today()
        progresses = db.query(StudentProgress).filter(
            StudentProgress.status == ProgressStatus.in_progress,
            StudentProgress.current_stage_id.isnot(None),
        ).all()

        for progress in progresses:
            stage = db.get(Stage, progress.current_stage_id)
            if not stage or not stage.deadline:
                continue

            user = db.get(User, progress.user_id)
            if not user:
                continue

            delta = (stage.deadline - today).days

            if delta < 0:
                notification_service.notify_deadline_overdue(db, user, stage.name)
            elif delta <= 7:
                notification_service.notify_deadline_at_risk(db, user, stage.name, delta)
    finally:
        db.close()
