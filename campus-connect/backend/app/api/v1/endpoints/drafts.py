from fastapi import APIRouter, Depends
from typing import Optional
from app.schemas.draft import DraftCreate, DraftResponse, DraftDeleteResponse
from app.services.draft_service import draft_service
from app.api.deps import get_current_user_id

router = APIRouter()

@router.post("", response_model=DraftResponse)
async def save_draft(
    draft_data: DraftCreate,
    current_user_id: str = Depends(get_current_user_id)
):
    draft = await draft_service.save_draft(
        current_user_id,
        draft_data.content,
        draft_data.media_urls,
        draft_data.category,
        draft_data.poll_data,
        draft_data.is_anonymous
    )
    
    if not draft:
        return {"id": "", "user_id": current_user_id, "content": "", "media_urls": [], "is_anonymous": False}
    
    return draft

@router.get("", response_model=Optional[DraftResponse])
async def get_draft(
    current_user_id: str = Depends(get_current_user_id)
):
    draft = await draft_service.get_draft(current_user_id)
    return draft

@router.delete("/{draft_id}", response_model=DraftDeleteResponse)
async def delete_draft(
    draft_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    await draft_service.delete_draft(draft_id, current_user_id)
    return {"success": True}

@router.delete("", response_model=DraftDeleteResponse)
async def clear_draft(
    current_user_id: str = Depends(get_current_user_id)
):
    await draft_service.clear_draft(current_user_id)
    return {"success": True}
