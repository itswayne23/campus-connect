from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from app.api.deps import get_current_user, get_supabase
from app.schemas.course_review import CourseReviewCreate, CourseReviewResponse, CourseStatsResponse
from app.services.course_review_service import CourseReviewService

router = APIRouter()


@router.post("/", response_model=CourseReviewResponse)
async def create_course_review(
    review: CourseReviewCreate,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    service = CourseReviewService(supabase)
    result = await service.create_review(current_user["id"], review)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create review")
    return result


@router.get("/search")
async def search_courses(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, le=50),
    supabase = Depends(get_supabase)
):
    service = CourseReviewService(supabase)
    return await service.search_courses(q, limit)


@router.get("/{course_code}", response_model=list[CourseReviewResponse])
async def get_course_reviews(
    course_code: str,
    semester: Optional[str] = Query(None),
    limit: int = Query(20, le=50),
    supabase = Depends(get_supabase)
):
    service = CourseReviewService(supabase)
    return await service.get_course_reviews(course_code, semester, limit)


@router.get("/{course_code}/stats", response_model=CourseStatsResponse)
async def get_course_stats(
    course_code: str,
    supabase = Depends(get_supabase)
):
    service = CourseReviewService(supabase)
    result = await service.get_course_stats(course_code)
    if not result:
        raise HTTPException(status_code=404, detail="No reviews found")
    return result


@router.put("/{review_id}", response_model=CourseReviewResponse)
async def update_review(
    review_id: str,
    review: CourseReviewCreate,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    service = CourseReviewService(supabase)
    result = await service.update_review(current_user["id"], review_id, review.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(status_code=404, detail="Review not found")
    return result


@router.post("/{review_id}/upvote")
async def upvote_review(
    review_id: str,
    supabase = Depends(get_supabase)
):
    service = CourseReviewService(supabase)
    success = await service.upvote_review(review_id)
    if not success:
        raise HTTPException(status_code=404, detail="Review not found")
    return {"success": True}
