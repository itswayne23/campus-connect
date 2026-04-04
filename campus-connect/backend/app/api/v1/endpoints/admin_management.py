from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.api.deps import get_current_user_id

router = APIRouter()


def get_service_client():
    from app.core import get_service_client as get_client
    return get_client()


class UserManagementItem(BaseModel):
    id: str
    username: str
    email: str
    avatar_url: Optional[str]
    is_verified: bool
    is_active: bool
    role: str
    posts_count: int
    followers_count: int
    following_count: int
    created_at: str


class ContentReportItem(BaseModel):
    id: str
    reporter_id: str
    reporter_username: str
    reported_user_id: Optional[str]
    reported_user_username: Optional[str]
    reported_post_id: Optional[str]
    reported_post_content: Optional[str]
    reason: str
    details: Optional[str]
    status: str
    reviewed_by: Optional[str]
    reviewed_at: Optional[str]
    resolution_notes: Optional[str]
    created_at: str


class SuspendUserRequest(BaseModel):
    user_id: str
    suspend: bool = True


class UpdateReportRequest(BaseModel):
    report_id: str
    status: str
    resolution_notes: Optional[str] = None


@router.get("/users", response_model=List[UserManagementItem])
async def get_all_users(
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    user_check = service.table("profiles").select("role").eq("id", current_user_id).execute()
    if not user_check.data or user_check.data[0].get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = service.table("profiles").select("*").order("created_at", desc=True).limit(limit).offset(offset)
    
    if search:
        query = query.ilike("username", f"%{search}%")
    if role:
        query = query.eq("role", role)
    
    users = query.execute()
    
    return [
        UserManagementItem(
            id=u["id"],
            username=u["username"],
            email=u["email"] or "",
            avatar_url=u.get("avatar_url"),
            is_verified=u.get("is_verified", False),
            is_active=u.get("is_active", True),
            role=u.get("role", "user"),
            posts_count=u.get("posts_count", 0),
            followers_count=u.get("followers_count", 0),
            following_count=u.get("following_count", 0),
            created_at=u["created_at"]
        )
        for u in users.data
    ]


@router.put("/users/{user_id}/suspend")
async def suspend_user(
    user_id: str,
    suspend: bool = True,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    user_check = service.table("profiles").select("role").eq("id", current_user_id).execute()
    if not user_check.data or user_check.data[0].get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if user_id == current_user_id:
        raise HTTPException(status_code=400, detail="Cannot suspend yourself")
    
    service.table("profiles").update({"is_active": not suspend}).eq("id", user_id).execute()
    
    return {"success": True, "message": f"User {'suspended' if suspend else 'unsuspended'} successfully"}


@router.put("/users/{user_id}/role")
async def update_user_role(
    user_id: str,
    role: str,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    user_check = service.table("profiles").select("role").eq("id", current_user_id).execute()
    if not user_check.data or user_check.data[0].get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if user_id == current_user_id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    
    if role not in ["user", "moderator", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    service.table("profiles").update({"role": role}).eq("id", user_id).execute()
    
    return {"success": True, "message": f"User role updated to {role}"}


@router.get("/reports", response_model=List[ContentReportItem])
async def get_content_reports(
    status: Optional[str] = Query(None),
    limit: int = Query(50, le=100),
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    user_check = service.table("profiles").select("role").eq("id", current_user_id).execute()
    if not user_check.data or user_check.data[0].get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = service.table("content_reports").select("*").order("created_at", desc=True).limit(limit)
    
    if status:
        query = query.eq("status", status)
    
    reports = query.execute()
    
    result = []
    for r in reports.data:
        reporter = service.table("profiles").select("username").eq("id", r["reporter_id"]).execute()
        reporter_username = reporter.data[0]["username"] if reporter.data else "Unknown"
        
        reported_user_username = None
        reported_post_content = None
        
        if r.get("reported_user_id"):
            reported_user = service.table("profiles").select("username").eq("id", r["reported_user_id"]).execute()
            reported_user_username = reported_user.data[0]["username"] if reported_user.data else "Unknown"
        
        if r.get("reported_post_id"):
            reported_post = service.table("posts").select("content").eq("id", r["reported_post_id"]).execute()
            reported_post_content = reported_post.data[0]["content"][:100] if reported_post.data else "Unknown"
        
        result.append(ContentReportItem(
            id=r["id"],
            reporter_id=r["reporter_id"],
            reporter_username=reporter_username,
            reported_user_id=r.get("reported_user_id"),
            reported_user_username=reported_user_username,
            reported_post_id=r.get("reported_post_id"),
            reported_post_content=reported_post_content,
            reason=r["reason"],
            details=r.get("details"),
            status=r["status"],
            reviewed_by=r.get("reviewed_by"),
            reviewed_at=r.get("reviewed_at"),
            resolution_notes=r.get("resolution_notes"),
            created_at=r["created_at"]
        ))
    
    return result


@router.put("/reports/{report_id}")
async def update_report(
    report_id: str,
    status: str,
    resolution_notes: Optional[str] = None,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    user_check = service.table("profiles").select("role").eq("id", current_user_id).execute()
    if not user_check.data or user_check.data[0].get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if status not in ["reviewing", "resolved", "dismissed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    update_data = {
        "status": status,
        "reviewed_by": current_user_id,
        "reviewed_at": "now()"
    }
    if resolution_notes:
        update_data["resolution_notes"] = resolution_notes
    
    service.table("content_reports").update(update_data).eq("id", report_id).execute()
    
    return {"success": True, "message": f"Report marked as {status}"}


@router.get("/stats")
async def get_admin_stats(
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    user_check = service.table("profiles").select("role").eq("id", current_user_id).execute()
    if not user_check.data or user_check.data[0].get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_users = service.table("profiles").select("id", count="exact").execute()
    total_posts = service.table("posts").select("id", count="exact").execute()
    pending_reports = service.table("content_reports").select("id", count="exact").eq("status", "pending").execute()
    pending_delete_requests = service.table("delete_requests").select("id", count="exact").eq("status", "pending").execute()
    
    return {
        "total_users": total_users.count or 0,
        "total_posts": total_posts.count or 0,
        "pending_reports": pending_reports.count or 0,
        "pending_delete_requests": pending_delete_requests.count or 0
    }
