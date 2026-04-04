from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class BadgeResponse(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    category: str
    earned_at: Optional[datetime] = None


class UserBadgesResponse(BaseModel):
    badges: List[BadgeResponse]
    total_badges: int


class VerifyUserRequest(BaseModel):
    user_id: str
    verify: bool = True


class VerifyUserResponse(BaseModel):
    user_id: str
    is_verified: bool
    message: str
