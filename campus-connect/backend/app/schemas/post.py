from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class PostCategory(str, Enum):
    COMPLAINT = "complaint"
    SUGGESTION = "suggestion"
    EXPERIENCE = "experience"
    QNA = "qna"
    GENERAL = "general"

class PostStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class PostBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    is_anonymous: bool = False
    category: Optional[PostCategory] = None

class PostCreate(PostBase):
    media_urls: Optional[List[str]] = []

class PostUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1, max_length=5000)
    media_urls: Optional[List[str]] = None

class PostResponse(BaseModel):
    id: str
    author_id: Optional[str]
    author: Optional[dict] = None
    content: str
    media_urls: List[str] = []
    is_anonymous: bool = False
    anonymous_name: Optional[str] = None
    category: Optional[str] = None
    likes_count: int = 0
    comments_count: int = 0
    is_liked: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PostFeedResponse(BaseModel):
    posts: List[PostResponse]
    has_more: bool
    next_cursor: Optional[str] = None

class LikeResponse(BaseModel):
    success: bool
    likes_count: int
    is_liked: bool

class CommentBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)
    is_anonymous: bool = False

class CommentCreate(CommentBase):
    parent_id: Optional[str] = None

class CommentResponse(BaseModel):
    id: str
    post_id: str
    author_id: Optional[str]
    author: Optional[dict] = None
    content: str
    is_anonymous: bool = False
    anonymous_name: Optional[str] = None
    parent_id: Optional[str] = None
    replies: List["CommentResponse"] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

CommentResponse.model_rebuild()
