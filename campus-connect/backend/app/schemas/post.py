from pydantic import BaseModel, Field, field_validator
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

class PollOption(BaseModel):
    id: Optional[str] = None
    text: str = Field(..., min_length=1, max_length=200)
    votes: int = 0

class Poll(BaseModel):
    question: str = Field(..., min_length=1, max_length=500)
    options: List[PollOption] = Field(..., min_length=2, max_length=6)
    expires_at: Optional[datetime] = None
    total_votes: int = 0
    is_multiple_choice: bool = False
    voted_option_id: Optional[str] = None

    @field_validator('options')
    @classmethod
    def validate_options(cls, v):
        if len(v) < 2:
            raise ValueError("Poll must have at least 2 options")
        if len(v) > 6:
            raise ValueError("Poll cannot have more than 6 options")
        return v

class PostBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    is_anonymous: bool = False
    category: Optional[PostCategory] = None

class PostCreate(PostBase):
    media_urls: Optional[List[str]] = []
    poll: Optional[Poll] = None

class PostUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1, max_length=5000)
    media_urls: Optional[List[str]] = None
    poll: Optional[Poll] = None

class PollVote(BaseModel):
    option_id: str

class PollVoteResponse(BaseModel):
    success: bool
    poll: Poll

class PostResponse(BaseModel):
    id: str
    author_id: Optional[str]
    author: Optional[dict] = None
    content: str
    media_urls: List[str] = []
    is_anonymous: bool = False
    anonymous_name: Optional[str] = None
    category: Optional[str] = None
    poll: Optional[Poll] = None
    likes_count: int = 0
    comments_count: int = 0
    is_liked: bool = False
    is_bookmarked: bool = False
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

class RepostCreate(BaseModel):
    content: Optional[str] = Field(None, max_length=500)

class RepostResponse(BaseModel):
    id: str
    user_id: str
    post_id: str
    content: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
