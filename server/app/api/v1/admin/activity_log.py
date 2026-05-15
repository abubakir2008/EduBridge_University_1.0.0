from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import require_admin
from app.models.activity_log import ActivityLog
from app.models.user import User

router = APIRouter(prefix="/admin/activity", tags=["admin"])


@router.get("")
def list_activity(db: Session = Depends(get_db), _=Depends(require_admin)):
    logs = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(200).all()
    result = []
    for log in logs:
        admin = db.get(User, log.admin_id) if log.admin_id else None
        result.append({
            "id": str(log.id),
            "admin_name": admin.full_name if admin else "Система",
            "entity_type": log.entity_type,
            "entity_id": str(log.entity_id) if log.entity_id else None,
            "action": log.action,
            "detail": log.detail,
            "created_at": log.created_at.isoformat(),
        })
    return result
