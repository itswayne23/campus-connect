from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from app.api.deps import get_current_user, get_supabase
from app.schemas.mood import MoodEntryCreate, MoodEntryResponse, MoodStatsResponse
from app.services.mood_service import MoodService

router = APIRouter()


@router.post("/", response_model=MoodEntryResponse)
async def create_mood_entry(
    entry: MoodEntryCreate,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    service = MoodService(supabase)
    result = await service.create_mood_entry(current_user["id"], entry)
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create mood entry")
    return result


@router.get("/", response_model=list[MoodEntryResponse])
async def get_mood_entries(
    limit: int = Query(30, le=100),
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    service = MoodService(supabase)
    entries = await service.get_user_mood_entries(current_user["id"], limit)
    return entries


@router.get("/stats", response_model=MoodStatsResponse)
async def get_mood_stats(
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    service = MoodService(supabase)
    return await service.get_mood_stats(current_user["id"])


@router.delete("/{entry_id}")
async def delete_mood_entry(
    entry_id: str,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    service = MoodService(supabase)
    success = await service.delete_mood_entry(current_user["id"], entry_id)
    if not success:
        raise HTTPException(status_code=404, detail="Mood entry not found")
    return {"success": True}
