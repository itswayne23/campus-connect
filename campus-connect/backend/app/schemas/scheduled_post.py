from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class ScheduledPostStatus(str, Enum):
    PENDING = "pending"
    PUBLISHED = "published"
    CANCELLED = "cancelled"

class ScheduledPostCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    media_urls: List[str] = []
    category: Optional[str] = None
    poll_data: Optional[dict] = None
    is_anonymous: bool = False
    scheduled_at: datetime

class ScheduledPostUpdate(BaseModel):
    content: Optional[str] = None
    media_urls: Optional[List[str]] = None
    category: Optional[str] = None
    poll_data: Optional[dict] = None
    is_anonymous: Optional[bool] = None
    scheduled_at: Optional[datetime] = None
    status: Optional[str] = None

class ScheduledPostResponse(BaseModel):
    id: str
    user_id: str
    content: str
    media_urls: List[str] = []
    category: Optional[str] = None
    poll_data: Optional[dict] = None
    is_anonymous: bool = False
    scheduled_at: datetime
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ScheduledPostListResponse(BaseModel):
    posts: List[ScheduledPostResponse]
    total: int
