from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class DraftCreate(BaseModel):
    content: str = ""
    media_urls: List[str] = []
    category: Optional[str] = None
    poll_data: Optional[dict] = None
    is_anonymous: bool = False

class DraftResponse(BaseModel):
    id: str
    user_id: str
    content: str
    media_urls: List[str] = []
    category: Optional[str] = None
    poll_data: Optional[dict] = None
    is_anonymous: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DraftDeleteResponse(BaseModel):
    success: bool
