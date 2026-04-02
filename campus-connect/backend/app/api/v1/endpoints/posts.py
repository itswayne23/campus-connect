from fastapi import APIRouter, HTTPException, status, Depends, Query, UploadFile, File
from typing import List, Optional
from app.schemas.post import (
    PostCreate, PostUpdate, PostResponse, PostFeedResponse, LikeResponse, PostStatus
)
from app.services.post_service import post_service
from app.api.deps import get_current_user_id, get_optional_user_id

router = APIRouter()

@router.post("", response_model=PostResponse)
async def create_post(
    post_data: PostCreate,
    current_user_id: str = Depends(get_current_user_id)
):
    post = await post_service.create_post(current_user_id, post_data)
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create post"
        )
    
    return post

@router.get("/feed", response_model=PostFeedResponse)
async def get_feed(
    cursor: Optional[str] = Query(None),
    limit: int = Query(20, le=50),
    current_user_id: str = Depends(get_current_user_id)
):
    feed = await post_service.get_feed(current_user_id, cursor, limit)
    return feed

@router.get("/explore", response_model=PostFeedResponse)
async def get_explore_feed(
    cursor: Optional[str] = Query(None),
    limit: int = Query(20, le=50),
    current_user_id: str = Depends(get_current_user_id)
):
    feed = await post_service.get_explore_feed(current_user_id, cursor, limit)
    return feed

@router.get("/pending", response_model=List[PostResponse])
async def get_pending_posts(
    current_user_id: str = Depends(get_current_user_id)
):
    pending = post_service.supabase.table("posts").select("*").eq("author_id", current_user_id).eq("status", "pending").order("created_at", desc=True).execute()
    
    posts = []
    for post in pending.data:
        posts.append(await post_service._build_post_response(post, current_user_id))
    
    return posts

@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: str,
    current_user_id: Optional[str] = Depends(get_optional_user_id)
):
    post = await post_service.get_post_by_id(post_id, current_user_id)
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    return post

@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: str,
    post_data: PostUpdate,
    current_user_id: str = Depends(get_current_user_id)
):
    post = await post_service.update_post(post_id, current_user_id, post_data)
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found or not authorized"
        )
    
    return post

@router.delete("/{post_id}")
async def delete_post(
    post_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    success = await post_service.delete_post(post_id, current_user_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found or not authorized"
        )
    
    return {"message": "Post deleted successfully"}

@router.post("/{post_id}/like", response_model=LikeResponse)
async def like_post(
    post_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    result = await post_service.like_post(post_id, current_user_id)
    return result

@router.delete("/{post_id}/like", response_model=LikeResponse)
async def unlike_post(
    post_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    result = await post_service.like_post(post_id, current_user_id)
    return result

@router.post("/{post_id}/bookmark")
async def bookmark_post(
    post_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    from app.core import get_service_client
    service = get_service_client()
    
    existing = service.table("bookmarks").select("*").eq("user_id", current_user_id).eq("post_id", post_id).execute()
    
    if existing.data:
        return {"is_bookmarked": True}
    
    service.table("bookmarks").insert({
        "user_id": current_user_id,
        "post_id": post_id
    }).execute()
    
    return {"is_bookmarked": True}

@router.delete("/{post_id}/bookmark")
async def remove_bookmark(
    post_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    from app.core import get_service_client
    service = get_service_client()
    
    service.table("bookmarks").delete().eq("user_id", current_user_id).eq("post_id", post_id).execute()
    
    return {"is_bookmarked": False}

@router.get("/bookmarks", response_model=PostFeedResponse)
async def get_bookmarked_posts(
    cursor: Optional[str] = Query(None),
    limit: int = Query(20, le=50),
    current_user_id: str = Depends(get_current_user_id)
):
    query = post_service.supabase.table("bookmarks").select("post_id, created_at").eq("user_id", current_user_id).order("created_at", desc=True).limit(limit + 1)
    
    if cursor:
        query = query.lt("created_at", cursor)
    
    bookmark_response = query.execute()
    
    has_more = len(bookmark_response.data) > limit
    bookmark_data = bookmark_response.data[:limit]
    
    if not bookmark_data:
        return {"posts": [], "has_more": False, "next_cursor": None}
    
    post_ids = [b["post_id"] for b in bookmark_data]
    posts_response = post_service.supabase.table("posts").select("*").in_("id", post_ids).execute()
    
    posts = []
    for post in posts_response.data:
        posts.append(await post_service._build_post_response(post, current_user_id))
    
    next_cursor = bookmark_data[-1]["created_at"] if has_more else None
    
    return {
        "posts": posts,
        "has_more": has_more,
        "next_cursor": next_cursor
    }

@router.post("/media/upload")
async def upload_media(
    file: UploadFile = File(...),
    current_user_id: str = Depends(get_current_user_id)
):
    from app.core import get_service_client
    import uuid
    import os
    
    service = get_service_client()
    
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")
    
    file_ext = os.path.splitext(file.filename)[1].lower()
    allowed_images = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    allowed_videos = ['.mp4', '.mov', '.webm']
    
    is_video = file_ext in allowed_videos
    is_image = file_ext in allowed_images
    
    if not (is_image or is_video):
        raise HTTPException(status_code=400, detail="File type not allowed. Images: jpg, png, gif, webp. Videos: mp4, mov, webm")
    
    bucket_name = "posts"
    file_name = f"{uuid.uuid4()}{file_ext}"
    
    file_content = await file.read()
    
    try:
        response = service.storage.from_(bucket_name).upload(
            file_name,
            file_content,
            {"content-type": file.content_type}
        )
        
        public_url = service.storage.from_(bucket_name).get_public_url(file_name)
        
        return {
            "url": public_url,
            "type": "video" if is_video else "image"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/{post_id}/request-delete")
async def request_delete_post(
    post_id: str,
    reason: str = "",
    current_user_id: str = Depends(get_current_user_id)
):
    from app.core import get_service_client
    import datetime
    
    service = get_service_client()
    
    post_response = service.table("posts").select("*").eq("id", post_id).execute()
    if not post_response.data:
        raise HTTPException(status_code=404, detail="Post not found")
    
    post = post_response.data[0]
    
    if post["author_id"] != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to request delete for this post")
    
    post_created = datetime.fromisoformat(post["created_at"].replace("Z", "+00:00"))
    now = datetime.now(post_created.tzinfo)
    minutes_since = (now - post_created).total_seconds() / 60
    
    if minutes_since <= 30:
        raise HTTPException(status_code=400, detail="You can delete this post directly. No need to request deletion.")
    
    existing_request = service.table("delete_requests").select("*").eq("post_id", post_id).eq("user_id", current_user_id).eq("status", "pending").execute()
    if existing_request.data:
        raise HTTPException(status_code=400, detail="Delete request already pending for this post")
    
    request = service.table("delete_requests").insert({
        "post_id": post_id,
        "user_id": current_user_id,
        "reason": reason,
        "status": "pending"
    }).execute()
    
    return {"message": "Delete request submitted successfully", "request_id": request.data[0]["id"] if request.data else None}

@router.get("/delete-requests")
async def get_delete_requests(
    current_user_id: str = Depends(get_current_user_id)
):
    from app.core import get_service_client
    
    service = get_service_client()
    
    user_response = service.table("profiles").select("role").eq("id", current_user_id).execute()
    if not user_response.data or user_response.data[0].get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    requests_response = service.table("delete_requests").select("*").order("created_at", desc=True).execute()
    
    result = []
    for req in requests_response.data:
        post_response = service.table("posts").select("content, author_id").eq("id", req["post_id"]).execute()
        user_response = service.table("profiles").select("username, avatar_url").eq("id", req["user_id"]).execute()
        
        result.append({
            "id": req["id"],
            "post_id": req["post_id"],
            "post_content": post_response.data[0]["content"][:100] if post_response.data else "",
            "user_id": req["user_id"],
            "username": user_response.data[0]["username"] if user_response.data else "",
            "reason": req.get("reason", ""),
            "status": req["status"],
            "created_at": req["created_at"]
        })
    
    return result

@router.put("/delete-requests/{request_id}")
async def update_delete_request(
    request_id: str,
    action: str,
    current_user_id: str = Depends(get_current_user_id)
):
    from app.core import get_service_client
    
    service = get_service_client()
    
    user_response = service.table("profiles").select("role").eq("id", current_user_id).execute()
    if not user_response.data or user_response.data[0].get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if action not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'approved' or 'rejected'")
    
    delete_req_response = service.table("delete_requests").select("*").eq("id", request_id).execute()
    if not delete_req_response.data:
        raise HTTPException(status_code=404, detail="Delete request not found")
    
    delete_req = delete_req_response.data[0]
    
    service.table("delete_requests").update({"status": action}).eq("id", request_id).execute()
    
    if action == "approved":
        service.table("posts").delete().eq("id", delete_req["post_id"]).execute()
    
    notification = service.table("notifications").insert({
        "user_id": delete_req["user_id"],
        "type": "delete_request",
        "actor_id": current_user_id,
        "message": f"Your delete request has been {action}"
    }).execute()
    
    return {"message": f"Delete request {action} successfully"}
