from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class MessageBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)

class MessageCreate(MessageBase):
    receiver_id: str
    media_url: Optional[str] = None

class MessageResponse(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    content: str
    media_url: Optional[str] = None
    is_read: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    user_id: str
    username: str
    avatar_url: Optional[str] = None
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0

class TypingIndicator(BaseModel):
    user_id: str
    username: str
    is_typing: bool

class WebSocketMessage(BaseModel):
    type: str
    payload: dict
