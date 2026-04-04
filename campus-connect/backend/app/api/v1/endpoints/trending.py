from fastapi import APIRouter, Query
from app.schemas.trending import TrendingResponse
from app.services.trending_service import get_trending, search_hashtag
from app.api.deps import get_current_user_id

router = APIRouter()

@router.get("/topics", response_model=TrendingResponse)
async def get_trending_topics(
    limit: int = Query(default=10, ge=1, le=50),
    current_user_id: str = None
):
    return await get_trending(limit)

@router.get("/hashtag/{hashtag}")
async def search_by_hashtag(
    hashtag: str,
    limit: int = Query(default=20, ge=1, le=50)
):
    return await search_hashtag(hashtag, limit)
