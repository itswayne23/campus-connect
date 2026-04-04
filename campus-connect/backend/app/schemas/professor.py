from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ProfessorRatingBase(BaseModel):
    professor_name: str = Field(..., max_length=255)
    course_code: str = Field(..., max_length=50)
    department: Optional[str] = Field(None, max_length=255)
    overall_rating: int = Field(..., ge=1, le=5)
    difficulty: int = Field(..., ge=1, le=5)
    would_take_again: bool
    attendance_mandatory: bool = False
    grade_type: Optional[str] = Field(None, description="A-F, Pass/Fail, Curves, etc.")
    comment: Optional[str] = Field(None, max_length=2000)


class ProfessorRatingCreate(ProfessorRatingBase):
    pass


class ProfessorRatingResponse(ProfessorRatingBase):
    id: str
    user_id: str
    user_username: str
    created_at: datetime
    upvotes: int = 0
    is_helpful: bool = False

    class Config:
        from_attributes = True


class ProfessorRatingUpdate(BaseModel):
    overall_rating: Optional[int] = Field(None, ge=1, le=5)
    difficulty: Optional[int] = Field(None, ge=1, le=5)
    would_take_again: Optional[bool] = None
    attendance_mandatory: Optional[bool] = None
    grade_type: Optional[str] = None
    comment: Optional[str] = Field(None, max_length=2000)


class ProfessorStats(BaseModel):
    professor_name: str
    course_code: str
    department: Optional[str] = None
    average_rating: float
    average_difficulty: float
    total_ratings: int
    would_take_again_percentage: float
    attendance_mandatory_percentage: float


class ProfessorStatsResponse(BaseModel):
    stats: ProfessorStats
    recent_ratings: List[ProfessorRatingResponse]
