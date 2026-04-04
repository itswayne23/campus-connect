from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class MessageReactionCreate(BaseModel):
    message_id: str
    emoji: str


class MessageReactionResponse(BaseModel):
    id: str
    message_id: str
    user_id: str
    emoji: str
    created_at: datetime


class TypingStatusUpdate(BaseModel):
    conversation_with: str
    is_typing: bool


class TypingStatusResponse(BaseModel):
    user_id: str
    username: str
    is_typing: bool


class MessageResponse(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    content: str
    media_url: Optional[str]
    is_read: bool
    read_at: Optional[datetime]
    created_at: datetime
    reactions: List[MessageReactionResponse] = []
