from fastapi import APIRouter, Query, Depends, HTTPException
from typing import Optional, List
from app.schemas.post import PostCreate, PostResponse, PostFeedResponse, PostCategory
from app.services.post_service import post_service
from app.api.deps import get_current_user_id

router = APIRouter()

@router.post("/posts", response_model=PostResponse)
async def create_anonymous_post(
    post_data: PostCreate,
    current_user_id: str = Depends(get_current_user_id)
):
    post_data.is_anonymous = True
    
    post = await post_service.create_post(current_user_id, post_data)
    
    if not post:
        raise HTTPException(status_code=500, detail="Failed to create anonymous post")
    
    return post

@router.get("/feed", response_model=PostFeedResponse)
async def get_anonymous_feed(
    category: Optional[str] = Query(None),
    cursor: Optional[str] = Query(None),
    limit: int = Query(20, le=50)
):
    feed = await post_service.get_anonymous_feed(category, cursor, limit)
    return feed

@router.get("/categories", response_model=List[str])
async def get_anonymous_categories():
    return [cat.value for cat in PostCategory]
