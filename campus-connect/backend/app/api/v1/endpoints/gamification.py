from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from app.api.deps import get_current_user, get_supabase
from app.schemas.gamification import (
    UserStatsResponse, LeaderboardResponse, GamificationStatsResponse,
    UserAchievementResponse, PointsTransactionResponse
)
from app.services.gamification_service import GamificationService

router = APIRouter()


@router.get("/stats", response_model=UserStatsResponse)
async def get_user_stats(
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    service = GamificationService(supabase)
    stats = await service.get_user_stats(current_user["id"])
    if not stats:
        raise HTTPException(status_code=404, detail="User stats not found")
    return stats


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    time_period: str = Query("all_time"),
    limit: int = Query(20, le=100),
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    service = GamificationService(supabase)
    return await service.get_leaderboard(time_period, limit)


@router.get("/achievements", response_model=list[UserAchievementResponse])
async def get_user_achievements(
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    service = GamificationService(supabase)
    return await service.get_user_achievements(current_user["id"])


@router.get("/achievements/all")
async def get_all_achievements(
    supabase = Depends(get_supabase)
):
    service = GamificationService(supabase)
    return await service.get_all_achievements()


@router.get("/full", response_model=GamificationStatsResponse)
async def get_gamification_full(
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    service = GamificationService(supabase)
    
    user_stats = await service.get_user_stats(current_user["id"])
    recent_achievements = await service.get_user_achievements(current_user["id"])
    
    transactions_response = supabase.table("points_transactions").select("*").eq("user_id", current_user["id"]).order("created_at", desc=True).limit(10).execute()
    recent_transactions = [PointsTransactionResponse(**t) for t in transactions_response.data]
    
    return GamificationStatsResponse(
        user_stats=user_stats,
        recent_achievements=[UserAchievementResponse(**a) for a in recent_achievements],
        recent_transactions=recent_transactions
    )


@router.post("/add-points")
async def add_points(
    points: int,
    reason: str,
    current_user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    service = GamificationService(supabase)
    result = await service.add_points(current_user["id"], points, reason)
    return {"success": True, "result": result}
