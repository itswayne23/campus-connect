from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ThreadPostCreate(BaseModel):
    content: str
    media_urls: Optional[List[str]] = None
    poll: Optional[dict] = None
    is_anonymous: bool = False
    category: Optional[str] = None


class ThreadPostResponse(BaseModel):
    id: str
    author_id: str
    content: str
    media_urls: List[str]
    is_anonymous: bool
    is_thread_reply: bool
    reply_count: int
    thread_id: Optional[str]
    created_at: datetime


class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    event_type: str = 'general'
    start_date: datetime
    end_date: Optional[datetime] = None
    is_recurring: bool = False
    recurring_pattern: Optional[str] = None
    max_attendees: Optional[int] = None
    cover_image_url: Optional[str] = None
    is_public: bool = True


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    event_type: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    max_attendees: Optional[int] = None
    cover_image_url: Optional[str] = None
    is_public: Optional[bool] = None


class EventResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str]
    location: Optional[str]
    event_type: str
    start_date: datetime
    end_date: Optional[datetime]
    is_recurring: bool
    recurring_pattern: Optional[str]
    max_attendees: Optional[int]
    cover_image_url: Optional[str]
    is_public: bool
    attendees_count: int
    user_rsvp: Optional[str]
    created_at: datetime


class RSVPUpdate(BaseModel):
    status: str


class EventReminderCreate(BaseModel):
    remind_at: datetime


class ReputationResponse(BaseModel):
    user_id: str
    karma_score: int
    total_posts_score: int
    total_comments_score: int
    total_likes_score: int
    quality_posts: int
    helpful_answers: int
    community_help: int
    rank: Optional[int] = None


class HighlightCreate(BaseModel):
    title: str


class HighlightUpdate(BaseModel):
    title: Optional[str] = None


class HighlightResponse(BaseModel):
    id: str
    user_id: str
    title: str
    cover_story_id: Optional[str]
    is_active: bool
    stories_count: int
    created_at: datetime
