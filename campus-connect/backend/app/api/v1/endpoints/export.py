from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from app.schemas.export import DataExportStatus, DataExportRequest, ExportDataResponse
from app.api.deps import get_current_user_id

router = APIRouter()


def get_service_client():
    from app.core import get_service_client as get_client
    return get_client()


@router.post("/request", response_model=DataExportStatus)
async def request_data_export(
    request: DataExportRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    existing = service.table("data_export_requests").select("*").eq("user_id", current_user_id).eq("status", "pending").execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Export request already pending")
    
    processing = service.table("data_export_requests").select("*").eq("user_id", current_user_id).eq("status", "processing").execute()
    if processing.data:
        raise HTTPException(status_code=400, detail="Export already in progress")
    
    from datetime import timedelta
    expires_at = (datetime.now() + timedelta(days=7)).isoformat()
    
    result = service.table("data_export_requests").insert({
        "user_id": current_user_id,
        "status": "pending",
        "expires_at": expires_at
    }).execute()
    
    return DataExportStatus(
        id=result.data[0]["id"],
        status="pending",
        file_url=None,
        requested_at=result.data[0]["requested_at"],
        completed_at=None,
        expires_at=result.data[0]["expires_at"]
    )


@router.get("/status", response_model=DataExportStatus)
async def get_export_status(
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    result = service.table("data_export_requests").select("*").eq("user_id", current_user_id).order("requested_at", desc=True).limit(1).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="No export requests found")
    
    export = result.data[0]
    
    return DataExportStatus(
        id=export["id"],
        status=export["status"],
        file_url=export.get("file_url"),
        requested_at=export["requested_at"],
        completed_at=export.get("completed_at"),
        expires_at=export.get("expires_at")
    )


@router.get("/download")
async def download_export(
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    result = service.table("data_export_requests").select("*").eq("user_id", current_user_id).eq("status", "completed").order("completed_at", desc=True).limit(1).execute()
    
    if not result.data or not result.data[0].get("file_url"):
        raise HTTPException(status_code=404, detail="No completed export found")
    
    return {"download_url": result.data[0]["file_url"]}


@router.get("/data", response_model=ExportDataResponse)
async def get_export_data(
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    profile = service.table("profiles").select("*").eq("id", current_user_id).execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    user_data = {
        "id": profile.data[0]["id"],
        "email": profile.data[0].get("email"),
        "username": profile.data[0]["username"],
        "bio": profile.data[0].get("bio"),
        "university": profile.data[0].get("university"),
        "created_at": profile.data[0]["created_at"]
    }
    
    posts = service.table("posts").select("*").eq("author_id", current_user_id).order("created_at", desc=True).execute()
    posts_data = [
        {
            "id": p["id"],
            "content": p["content"],
            "category": p.get("category"),
            "is_anonymous": p.get("is_anonymous"),
            "likes_count": p.get("likes_count", 0),
            "comments_count": p.get("comments_count", 0),
            "created_at": p["created_at"]
        }
        for p in posts.data
    ]
    
    comments = service.table("comments").select("*").eq("author_id", current_user_id).order("created_at", desc=True).execute()
    comments_data = [
        {
            "id": c["id"],
            "post_id": c["post_id"],
            "content": c["content"],
            "is_anonymous": c.get("is_anonymous"),
            "created_at": c["created_at"]
        }
        for c in comments.data
    ]
    
    likes = service.table("likes").select("*").eq("user_id", current_user_id).order("created_at", desc=True).execute()
    likes_data = [
        {
            "post_id": l["post_id"],
            "created_at": l["created_at"]
        }
        for l in likes.data
    ]
    
    following = service.table("follows").select("following_id, created_at").eq("follower_id", current_user_id).execute()
    follows_data = [
        {
            "following_id": f["following_id"],
            "created_at": f["created_at"]
        }
        for f in following.data
    ]
    
    messages_sent = service.table("messages").select("*").eq("sender_id", current_user_id).order("created_at", desc=True).execute()
    messages_data = [
        {
            "receiver_id": m["receiver_id"],
            "content": m["content"],
            "is_read": m.get("is_read", False),
            "created_at": m["created_at"]
        }
        for m in messages_sent.data
    ]
    
    notifications = service.table("notifications").select("*").eq("user_id", current_user_id).order("created_at", desc=True).execute()
    notifications_data = [
        {
            "type": n["type"],
            "actor_id": n.get("actor_id"),
            "post_id": n.get("post_id"),
            "is_read": n.get("is_read", False),
            "created_at": n["created_at"]
        }
        for n in notifications.data
    ]
    
    return ExportDataResponse(
        user=user_data,
        posts=posts_data,
        comments=comments_data,
        likes=likes_data,
        follows=follows_data,
        messages=messages_data,
        notifications=notifications_data,
        exported_at=datetime.now()
    )
