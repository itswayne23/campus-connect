from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class StudyPartnerRequestBase(BaseModel):
    course: str = Field(..., max_length=255)
    topic: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = Field(None, max_length=1000)
    preferred_method: Optional[str] = Field(None, description="online, in-person, both")
    availability: Optional[str] = Field(None, max_length=255)
    is_active: bool = True


class StudyPartnerRequestCreate(StudyPartnerRequestBase):
    pass


class StudyPartnerRequestUpdate(BaseModel):
    course: Optional[str] = Field(None, max_length=255)
    topic: Optional[str] = Field(None, max_length=500)
    description: Optional[str] = Field(None, max_length=1000)
    preferred_method: Optional[str] = None
    availability: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None


class StudyPartnerRequestResponse(StudyPartnerRequestBase):
    id: str
    user_id: str
    user_username: str
    user_avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class StudyMatchResponse(BaseModel):
    id: str
    request_id: str
    matched_user_id: str
    matched_username: str
    matched_avatar_url: Optional[str] = None
    matched_course: str
    matched_topic: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class StudyMatchCreate(BaseModel):
    request_id: str


class StudyPartnerSearchParams(BaseModel):
    course: Optional[str] = None
    topic: Optional[str] = None
    preferred_method: Optional[str] = None
