from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class NotificationType(str, Enum):
    LIKE = "like"
    COMMENT = "comment"
    FOLLOW = "follow"
    MESSAGE = "message"
    MENTION = "mention"

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    type: NotificationType
    actor_id: Optional[str]
    actor: Optional[dict] = None
    post_id: Optional[str] = None
    post: Optional[dict] = None
    message: Optional[dict] = None
    is_read: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    unread_count: int
    has_more: bool
