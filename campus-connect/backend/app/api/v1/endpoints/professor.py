from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from app.api.deps import get_current_user, get_supabase
from app.schemas.professor import ProfessorRatingCreate, ProfessorRatingResponse, ProfessorStatsResponse
from app.services.professor_service import ProfessorRatingService

router = APIRouter()


@router.post("/", response_model=ProfessorRatingResponse)
async def create_professor_rating(
    rating: ProfessorRatingCreate,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    service = ProfessorRatingService(supabase)
    result = await service.create_rating(current_user["id"], rating)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create rating")
    return result


@router.get("/search")
async def search_professors(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, le=50),
    supabase = Depends(get_supabase)
):
    service = ProfessorRatingService(supabase)
    return await service.search_professors(q, limit)


@router.get("/{professor_name}", response_model=list[ProfessorRatingResponse])
async def get_professor_ratings(
    professor_name: str,
    course_code: Optional[str] = Query(None),
    limit: int = Query(20, le=50),
    supabase = Depends(get_supabase)
):
    service = ProfessorRatingService(supabase)
    return await service.get_professor_ratings(professor_name, course_code, limit)


@router.get("/{professor_name}/stats", response_model=ProfessorStatsResponse)
async def get_professor_stats(
    professor_name: str,
    course_code: Optional[str] = Query(None),
    supabase = Depends(get_supabase)
):
    service = ProfessorRatingService(supabase)
    result = await service.get_professor_stats(professor_name, course_code)
    if not result:
        raise HTTPException(status_code=404, detail="No ratings found")
    return result


@router.put("/{rating_id}", response_model=ProfessorRatingResponse)
async def update_rating(
    rating_id: str,
    rating: ProfessorRatingCreate,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    service = ProfessorRatingService(supabase)
    result = await service.update_rating(current_user["id"], rating_id, rating.model_dump(exclude_unset=True))
    if not result:
        raise HTTPException(status_code=404, detail="Rating not found")
    return result


@router.post("/{rating_id}/upvote")
async def upvote_rating(
    rating_id: str,
    supabase = Depends(get_supabase)
):
    service = ProfessorRatingService(supabase)
    success = await service.upvote_rating(rating_id)
    if not success:
        raise HTTPException(status_code=404, detail="Rating not found")
    return {"success": True}
