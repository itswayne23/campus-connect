from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class HashtagFollowResponse(BaseModel):
    id: str
    user_id: str
    hashtag: str
    created_at: datetime


class BookmarkWithNote(BaseModel):
    id: str
    post_id: str
    user_id: str
    note: Optional[str]
    folder: Optional[str]
    created_at: datetime


class BookmarkUpdateNote(BaseModel):
    note: Optional[str] = None
    folder: Optional[str] = None


class MentionResponse(BaseModel):
    id: str
    user_id: str
    mentioned_by: str
    mentioned_by_username: Optional[str]
    post_id: Optional[str]
    comment_id: Optional[str]
    is_read: bool
    created_at: datetime


class QuickReactionResponse(BaseModel):
    id: str
    user_id: str
    post_id: str
    reaction_type: str
    created_at: datetime


class LocationCreate(BaseModel):
    latitude: float
    longitude: float
    location_name: Optional[str] = None
