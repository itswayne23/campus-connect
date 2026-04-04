from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False


class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None


class CollectionResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str]
    is_public: bool
    posts_count: int
    created_at: datetime
    updated_at: datetime


class CollectionDetailResponse(CollectionResponse):
    posts: List[dict] = []


class CollectionPostAdd(BaseModel):
    post_id: str


class ThemePreferencesResponse(BaseModel):
    theme: str
    accent_color: str
    custom_dark_bg: Optional[str]
    custom_light_bg: Optional[str]
    font_size: str
    reduced_motion: bool
    high_contrast: bool


class ThemePreferencesUpdate(BaseModel):
    theme: Optional[str] = None
    accent_color: Optional[str] = None
    custom_dark_bg: Optional[str] = None
    custom_light_bg: Optional[str] = None
    font_size: Optional[str] = None
    reduced_motion: Optional[bool] = None
    high_contrast: Optional[bool] = None


class QuoteRepostCreate(BaseModel):
    post_id: str
    quote_text: str
    quote_media_urls: List[str] = []


class ScheduledStoryCreate(BaseModel):
    media_url: str
    media_type: str = 'image'
    caption: Optional[str] = None
    scheduled_at: datetime


class ScheduledStoryResponse(BaseModel):
    id: str
    user_id: str
    media_url: str
    media_type: str
    caption: Optional[str]
    scheduled_at: datetime
    status: str
    created_at: datetime
