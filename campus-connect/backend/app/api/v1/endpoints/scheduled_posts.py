from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.schemas.scheduled_post import ScheduledPostCreate, ScheduledPostUpdate, ScheduledPostResponse
from app.services.scheduled_post_service import (
    create_scheduled_post,
    get_scheduled_posts,
    get_scheduled_post,
    update_scheduled_post,
    cancel_scheduled_post,
    delete_scheduled_post
)
from app.api.deps import get_current_user_id

router = APIRouter()

@router.post("", response_model=ScheduledPostResponse)
async def create_post(
    data: ScheduledPostCreate,
    current_user_id: str = Depends(get_current_user_id)
):
    return await create_scheduled_post(current_user_id, data)

@router.get("", response_model=List[ScheduledPostResponse])
async def list_posts(
    current_user_id: str = Depends(get_current_user_id)
):
    return await get_scheduled_posts(current_user_id)

@router.get("/{post_id}", response_model=ScheduledPostResponse)
async def get_post(
    post_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    try:
        return await get_scheduled_post(post_id, current_user_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Scheduled post not found")

@router.put("/{post_id}", response_model=ScheduledPostResponse)
async def update_post(
    post_id: str,
    data: ScheduledPostUpdate,
    current_user_id: str = Depends(get_current_user_id)
):
    try:
        return await update_scheduled_post(post_id, current_user_id, data)
    except Exception:
        raise HTTPException(status_code=404, detail="Scheduled post not found")

@router.post("/{post_id}/cancel")
async def cancel_post(
    post_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    try:
        return await cancel_scheduled_post(post_id, current_user_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Scheduled post not found")

@router.delete("/{post_id}")
async def delete_post(
    post_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    try:
        return await delete_scheduled_post(post_id, current_user_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Scheduled post not found")
