from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class AchievementBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: str = Field(..., max_length=500)
    icon: Optional[str] = None
    category: str = Field(..., description="posts, engagement, social, academic, streak")
    points_required: int = Field(..., ge=0)
    badge_type: str = Field(..., description="bronze, silver, gold, platinum")


class AchievementCreate(AchievementBase):
    pass


class AchievementResponse(AchievementBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserAchievementBase(BaseModel):
    achievement_id: str


class UserAchievementResponse(BaseModel):
    id: str
    user_id: str
    achievement_id: str
    achievement: AchievementResponse
    earned_at: datetime

    class Config:
        from_attributes = True


class PointsTransactionBase(BaseModel):
    points: int
    reason: str = Field(..., max_length=255)


class PointsTransactionResponse(PointsTransactionBase):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserStatsResponse(BaseModel):
    user_id: str
    username: str
    avatar_url: Optional[str] = None
    total_points: int
    current_streak: int
    longest_streak: int
    posts_count: int
    likes_received: int
    comments_count: int
    followers_count: int
    achievements_count: int
    rank: int
    level: int


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    username: str
    avatar_url: Optional[str] = None
    total_points: int
    current_streak: int


class LeaderboardResponse(BaseModel):
    entries: List[LeaderboardEntry]
    user_rank: Optional[int] = None
    time_period: str = "all_time"


class GamificationStatsResponse(BaseModel):
    user_stats: UserStatsResponse
    recent_achievements: List[UserAchievementResponse]
    recent_transactions: List[PointsTransactionResponse]
