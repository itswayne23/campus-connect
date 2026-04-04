from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    bio: Optional[str] = Field(None, max_length=500)
    university: Optional[str] = Field(None, max_length=255)
    avatar_url: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    university: Optional[str] = None
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0
    created_at: Optional[datetime] = None
    is_following: bool = False
    is_blocked: bool = False
    is_muted: bool = False

    class Config:
        from_attributes = True

class UserProfileResponse(UserResponse):
    is_own_profile: bool = False

class BlockResponse(BaseModel):
    success: bool
    error: Optional[str] = None

class MuteResponse(BaseModel):
    success: bool
    error: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str
