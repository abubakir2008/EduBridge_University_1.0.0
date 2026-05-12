from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import require_admin
from app.schemas.notification import SendNotificationRequest, NotificationResponse
from app.services.notification_service import send_manual_notification
from app.services.user_service import get_user_or_404

router = APIRouter(prefix="/admin/notifications", tags=["admin"])


@router.post("/send", response_model=NotificationResponse, status_code=201)
def send_notification(
    body: SendNotificationRequest,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    user = get_user_or_404(db, body.user_id)
    notif = send_manual_notification(db, user, body.message, body.type, body.channel)
    return notif
