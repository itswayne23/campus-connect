from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class StoryCreate(BaseModel):
    media_url: str
    media_type: str = "image"
    caption: Optional[str] = Field(None, max_length=500)

class StoryResponse(BaseModel):
    id: str
    user_id: str
    user: Optional[dict] = None
    media_url: str
    media_type: str = "image"
    caption: Optional[str] = None
    view_count: int = 0
    has_viewed: bool = False
    created_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserStories(BaseModel):
    user: dict
    stories: List[StoryResponse]

class StoryViewResponse(BaseModel):
    success: bool

class StoryDeleteResponse(BaseModel):
    success: bool
