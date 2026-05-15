from datetime import date
from app.db.session import SessionLocal
from app.models.student_progress import StudentProgress, ProgressStatus
from app.models.stage import Stage
from app.models.user import User
from app.models.student_stage_deadline import StudentStageDeadline
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
            if not stage:
                continue

            # Берём индивидуальный дедлайн студента
            student_dl = db.query(StudentStageDeadline).filter(
                StudentStageDeadline.student_progress_id == progress.id,
                StudentStageDeadline.stage_id == progress.current_stage_id,
            ).first()

            if not student_dl:
                continue  # нет индивидуального дедлайна — пропускаем

            user = db.get(User, progress.user_id)
            if not user:
                continue

            delta = (student_dl.deadline - today).days

            if delta < 0:
                notification_service.notify_deadline_overdue(db, user, stage.name)
            elif delta <= 7:
                notification_service.notify_deadline_at_risk(db, user, stage.name, delta)
    finally:
        db.close()
