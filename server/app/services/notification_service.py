from sqlalchemy.orm import Session
from app.models.notification import Notification, NotificationChannel
from app.models.user import User
from app.services.email_service import send_email


def _create_notification(
    db: Session,
    user: User,
    type: str,
    message: str,
    channel: NotificationChannel = NotificationChannel.email,
) -> Notification:
    notif = Notification(
        user_id=user.id,
        type=type,
        message=message,
        channel=channel,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    if channel == NotificationChannel.email and user.email:
        send_email(user.email, type.replace("_", " ").title(), message)
    return notif


def notify_account_created(db: Session, user: User, login: str, password: str) -> None:
    msg = (
        f"Ваш аккаунт создан.<br>"
        f"<b>Логин:</b> {login}<br>"
        f"<b>Пароль:</b> {password}<br>"
        f"После входа смените пароль."
    )
    _create_notification(db, user, "account_created", msg)


def notify_password_reset(db: Session, user: User, password: str) -> None:
    msg = f"Ваш пароль сброшен.<br><b>Новый пароль:</b> {password}"
    _create_notification(db, user, "password_reset", msg)


def notify_new_stage(db: Session, user: User, stage_name: str) -> None:
    msg = f"Вы перешли на новый этап: <b>{stage_name}</b>. Удачи!"
    _create_notification(db, user, "new_stage", msg)


def notify_deadline_at_risk(db: Session, user: User, stage_name: str, days_left: int) -> None:
    msg = f"До дедлайна этапа <b>{stage_name}</b> осталось {days_left} дн. Не забудьте выполнить требования!"
    _create_notification(db, user, "deadline_at_risk", msg)


def notify_deadline_overdue(db: Session, user: User, stage_name: str) -> None:
    msg = f"Дедлайн этапа <b>{stage_name}</b> истёк. Обратитесь к менеджеру."
    _create_notification(db, user, "deadline_overdue", msg)


def send_manual_notification(
    db: Session,
    user: User,
    message: str,
    type: str = "manual",
    channel: NotificationChannel = NotificationChannel.email,
) -> Notification:
    return _create_notification(db, user, type, message, channel)
