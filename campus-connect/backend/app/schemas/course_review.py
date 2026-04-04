from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class CourseReviewBase(BaseModel):
    course_code: str = Field(..., max_length=50)
    course_name: str = Field(..., max_length=255)
    department: Optional[str] = Field(None, max_length=255)
    semester: Optional[str] = Field(None, max_length=50)
    overall_rating: int = Field(..., ge=1, le=5)
    difficulty: int = Field(..., ge=1, le=5)
    workload: int = Field(..., ge=1, le=5)
    lecture_quality: int = Field(..., ge=1, le=5)
    materials_quality: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=2000)
    pros: Optional[List[str]] = None
    cons: Optional[List[str]] = None


class CourseReviewCreate(CourseReviewBase):
    pass


class CourseReviewResponse(CourseReviewBase):
    id: str
    user_id: str
    user_username: str
    created_at: datetime
    upvotes: int = 0
    is_helpful: bool = False

    class Config:
        from_attributes = True


class CourseReviewUpdate(BaseModel):
    overall_rating: Optional[int] = Field(None, ge=1, le=5)
    difficulty: Optional[int] = Field(None, ge=1, le=5)
    workload: Optional[int] = Field(None, ge=1, le=5)
    lecture_quality: Optional[int] = Field(None, ge=1, le=5)
    materials_quality: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=2000)
    pros: Optional[List[str]] = None
    cons: Optional[List[str]] = None


class CourseStats(BaseModel):
    course_code: str
    course_name: str
    department: Optional[str] = None
    average_overall: float
    average_difficulty: float
    average_workload: float
    average_lecture_quality: float
    average_materials_quality: float
    total_reviews: int


class CourseStatsResponse(BaseModel):
    stats: CourseStats
    recent_reviews: List[CourseReviewResponse]
