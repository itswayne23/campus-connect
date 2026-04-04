from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class AIChatMessageBase(BaseModel):
    message: str = Field(..., max_length=2000)
    role: str = Field(..., description="user or assistant")


class AIChatMessageCreate(BaseModel):
    message: str = Field(..., max_length=2000)


class AIChatMessageResponse(AIChatMessageBase):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class AIChatSessionResponse(BaseModel):
    id: str
    user_id: str
    title: str
    messages: List[AIChatMessageResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AIChatSessionListResponse(BaseModel):
    id: str
    user_id: str
    title: str
    preview: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AIChatRequest(BaseModel):
    message: str = Field(..., max_length=2000)
    session_id: Optional[str] = None


class AIChatResponse(BaseModel):
    session_id: str
    user_message: AIChatMessageResponse
    assistant_message: AIChatMessageResponse
