from fastapi import APIRouter, HTTPException, Depends
from app.schemas.notification import NotificationListResponse
from app.services.notification_service import notification_service
from app.api.deps import get_current_user_id

router = APIRouter()

@router.get("", response_model=NotificationListResponse)
async def get_notifications(
    current_user_id: str = Depends(get_current_user_id)
):
    notifications = await notification_service.get_notifications(current_user_id)
    return notifications

@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    success = notification_service.mark_as_read(notification_id, current_user_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Notification marked as read"}

@router.put("/read-all")
async def mark_all_read(
    current_user_id: str = Depends(get_current_user_id)
):
    success = notification_service.mark_all_as_read(current_user_id)
    return {"message": "All notifications marked as read"}
