from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class MoodEntryBase(BaseModel):
    mood: str = Field(..., description="Mood emoji or text: happy, sad, anxious, excited, tired, neutral")
    note: Optional[str] = Field(None, max_length=500)
    activities: Optional[List[str]] = None


class MoodEntryCreate(MoodEntryBase):
    pass


class MoodEntryResponse(MoodEntryBase):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class MoodStats(BaseModel):
    total_entries: int
    mood_distribution: dict
    average_mood: Optional[str]
    streak_days: int
    weekly_data: List[dict]


class MoodStatsResponse(BaseModel):
    stats: MoodStats
    recent_entries: List[MoodEntryResponse]
