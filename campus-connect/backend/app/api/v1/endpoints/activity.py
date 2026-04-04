from fastapi import APIRouter, Depends, Query
from typing import Optional
from app.schemas.activity import ActivityLogResponse, ActivityLogItem, CreateActivityRequest
from app.api.deps import get_current_user_id

router = APIRouter()


def get_service_client():
    from app.core import get_service_client as get_client
    return get_client()


@router.get("", response_model=ActivityLogResponse)
async def get_activity_log(
    action_type: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    query = service.table("activity_log").select("*", count="exact").eq("user_id", current_user_id).order("created_at", desc=True).limit(limit).offset(offset)
    
    if action_type:
        query = query.eq("action_type", action_type)
    
    result = query.execute()
    
    activities = [
        ActivityLogItem(
            id=r["id"],
            user_id=r["user_id"],
            action_type=r["action_type"],
            entity_type=r.get("entity_type"),
            entity_id=r.get("entity_id"),
            metadata=r.get("metadata", {}),
            created_at=r["created_at"]
        )
        for r in result.data
    ]
    
    return ActivityLogResponse(
        activities=activities,
        total=result.count or 0,
        has_more=offset + len(activities) < (result.count or 0)
    )


@router.post("")
async def log_activity(
    request: CreateActivityRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    import secrets
    ip_address = None
    user_agent = None
    
    try:
        from fastapi import Request
    except:
        pass
    
    insert_data = {
        "user_id": current_user_id,
        "action_type": request.action_type,
        "entity_type": request.entity_type,
        "entity_id": request.entity_id,
        "metadata": request.metadata
    }
    
    if ip_address:
        insert_data["ip_address"] = ip_address
    if user_agent:
        insert_data["user_agent"] = user_agent
    
    result = service.table("activity_log").insert(insert_data).execute()
    
    return {"success": True, "id": result.data[0]["id"] if result.data else None}


@router.get("/stats")
async def get_activity_stats(
    days: int = Query(30, le=365),
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    from datetime import datetime, timedelta
    
    start_date = (datetime.now() - timedelta(days=days)).isoformat()
    
    stats = {}
    action_types = ["post_created", "post_liked", "post_commented", "follow", "unfollow", "login"]
    
    for action_type in action_types:
        result = service.table("activity_log").select("id", count="exact").eq("user_id", current_user_id).eq("action_type", action_type).gte("created_at", start_date).execute()
        stats[action_type] = result.count or 0
    
    return {
        "stats": stats,
        "period_days": days
    }


@router.delete("/clear")
async def clear_old_activity(
    days_old: int = Query(90, le=365),
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    from datetime import datetime, timedelta
    
    cutoff_date = (datetime.now() - timedelta(days=days_old)).isoformat()
    
    service.table("activity_log").delete().eq("user_id", current_user_id).lt("created_at", cutoff_date).execute()
    
    return {"success": True, "message": f"Activity older than {days_old} days cleared"}
