from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from app.schemas.engagement import (
    ThreadPostCreate, ThreadPostResponse, EventCreate, EventUpdate, EventResponse,
    RSVPUpdate, EventReminderCreate, ReputationResponse, HighlightCreate, HighlightUpdate, HighlightResponse
)
from app.api.deps import get_current_user_id

router = APIRouter()


def get_service_client():
    from app.core import get_service_client as get_client
    return get_client()


# Thread endpoints
@router.post("/threads/{post_id}/reply", response_model=ThreadPostResponse)
async def create_thread_reply(
    post_id: str,
    data: ThreadPostCreate,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    original_post = service.table("posts").select("*").eq("id", post_id).execute()
    if not original_post.data:
        raise HTTPException(status_code=404, detail="Post not found")
    
    thread_id = original_post.data[0].get("thread_id") or post_id
    
    result = service.table("posts").insert({
        "author_id": current_user_id,
        "content": data.content,
        "media_urls": data.media_urls or [],
        "is_anonymous": data.is_anonymous,
        "category": data.category,
        "is_thread_reply": True,
        "thread_id": thread_id,
        "status": "approved"
    }).execute()
    
    service.table("posts").update({
        "reply_count": (original_post.data[0].get("reply_count", 0) or 0) + 1
    }).eq("id", post_id).execute()
    
    if thread_id != post_id:
        service.table("posts").update({
            "reply_count": (original_post.data[0].get("reply_count", 0) or 0) + 1
        }).eq("id", thread_id).execute()
    
    p = result.data[0]
    return ThreadPostResponse(
        id=p["id"],
        author_id=p["author_id"],
        content=p["content"],
        media_urls=p.get("media_urls", []),
        is_anonymous=p.get("is_anonymous", False),
        is_thread_reply=p.get("is_thread_reply", False),
        reply_count=0,
        thread_id=p.get("thread_id"),
        created_at=p["created_at"]
    )


@router.get("/threads/{post_id}", response_model=List[ThreadPostResponse])
async def get_thread(
    post_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    original_post = service.table("posts").select("*").eq("id", post_id).execute()
    if not original_post.data:
        raise HTTPException(status_code=404, detail="Post not found")
    
    thread_id = original_post.data[0].get("thread_id") or post_id
    
    if thread_id == post_id:
        replies = service.table("posts").select("*").eq("thread_id", post_id).order("created_at", asc=True).execute()
    else:
        parent = service.table("posts").select("*").eq("id", thread_id).execute()
        replies = []
        if parent.data:
            replies = [parent.data[0]] + service.table("posts").select("*").eq("thread_id", thread_id).order("created_at", asc=True).execute().data
    
    return [
        ThreadPostResponse(
            id=p["id"],
            author_id=p["author_id"],
            content=p["content"],
            media_urls=p.get("media_urls", []),
            is_anonymous=p.get("is_anonymous", False),
            is_thread_reply=p.get("is_thread_reply", False),
            reply_count=p.get("reply_count", 0),
            thread_id=p.get("thread_id"),
            created_at=p["created_at"]
        )
        for p in replies
    ]


# Event endpoints
@router.get("/events", response_model=List[EventResponse])
async def get_events(
    event_type: Optional[str] = Query(None),
    upcoming: bool = Query(False),
    limit: int = Query(20, le=50),
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    query = service.table("events").select("*").eq("is_public", True).order("start_date", asc=True).limit(limit)
    
    if event_type:
        query = query.eq("event_type", event_type)
    if upcoming:
        query = query.gte("start_date", "now()")
    
    events = query.execute()
    
    result = []
    for e in events.data:
        rsvps = service.table("event_rsvps").select("id", count="exact").eq("event_id", e["id"]).eq("status", "going").execute()
        user_rsvp = None
        if current_user_id:
            user_rsvp_data = service.table("event_rsvps").select("status").eq("event_id", e["id"]).eq("user_id", current_user_id).execute()
            if user_rsvp_data.data:
                user_rsvp = user_rsvp_data.data[0]["status"]
        
        result.append(EventResponse(
            id=e["id"],
            user_id=e["user_id"],
            title=e["title"],
            description=e.get("description"),
            location=e.get("location"),
            event_type=e.get("event_type", "general"),
            start_date=e["start_date"],
            end_date=e.get("end_date"),
            is_recurring=e.get("is_recurring", False),
            recurring_pattern=e.get("recurring_pattern"),
            max_attendees=e.get("max_attendees"),
            cover_image_url=e.get("cover_image_url"),
            is_public=e.get("is_public", True),
            attendees_count=rsvps.count or 0,
            user_rsvp=user_rsvp,
            created_at=e["created_at"]
        ))
    
    return result


@router.post("/events", response_model=EventResponse)
async def create_event(
    data: EventCreate,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    result = service.table("events").insert({
        "user_id": current_user_id,
        "title": data.title,
        "description": data.description,
        "location": data.location,
        "event_type": data.event_type,
        "start_date": data.start_date.isoformat(),
        "end_date": data.end_date.isoformat() if data.end_date else None,
        "is_recurring": data.is_recurring,
        "recurring_pattern": data.recurring_pattern,
        "max_attendees": data.max_attendees,
        "cover_image_url": data.cover_image_url,
        "is_public": data.is_public
    }).execute()
    
    e = result.data[0]
    return EventResponse(
        id=e["id"],
        user_id=e["user_id"],
        title=e["title"],
        description=e.get("description"),
        location=e.get("location"),
        event_type=e.get("event_type", "general"),
        start_date=e["start_date"],
        end_date=e.get("end_date"),
        is_recurring=e.get("is_recurring", False),
        recurring_pattern=e.get("recurring_pattern"),
        max_attendees=e.get("max_attendees"),
        cover_image_url=e.get("cover_image_url"),
        is_public=e.get("is_public", True),
        attendees_count=0,
        user_rsvp=None,
        created_at=e["created_at"]
    )


@router.put("/events/{event_id}/rsvp")
async def update_rsvp(
    event_id: str,
    data: RSVPUpdate,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    existing = service.table("event_rsvps").select("*").eq("event_id", event_id).eq("user_id", current_user_id).execute()
    
    if existing.data:
        if data.status == "not_going":
            service.table("event_rsvps").delete().eq("event_id", event_id).eq("user_id", current_user_id).execute()
        else:
            service.table("event_rsvps").update({"status": data.status}).eq("event_id", event_id).eq("user_id", current_user_id).execute()
    else:
        if data.status != "not_going":
            service.table("event_rsvps").insert({
                "event_id": event_id,
                "user_id": current_user_id,
                "status": data.status
            }).execute()
    
    return {"success": True}


# Reputation endpoints
@router.get("/reputation/{user_id}", response_model=ReputationResponse)
async def get_reputation(
    user_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    rep = service.table("user_reputation").select("*").eq("user_id", user_id).execute()
    
    if not rep.data:
        return ReputationResponse(
            user_id=user_id,
            karma_score=0,
            total_posts_score=0,
            total_comments_score=0,
            total_likes_score=0,
            quality_posts=0,
            helpful_answers=0,
            community_help=0
        )
    
    r = rep.data[0]
    
    rank_result = service.table("user_reputation").select("id", count="exact").gt("karma_score", r.get("karma_score", 0)).execute()
    
    return ReputationResponse(
        user_id=r["user_id"],
        karma_score=r.get("karma_score", 0),
        total_posts_score=r.get("total_posts_score", 0),
        total_comments_score=r.get("total_comments_score", 0),
        total_likes_score=r.get("total_likes_score", 0),
        quality_posts=r.get("quality_posts", 0),
        helpful_answers=r.get("helpful_answers", 0),
        community_help=r.get("community_help", 0),
        rank=(rank_result.count or 0) + 1
    )


# Story highlights endpoints
@router.get("/highlights", response_model=List[HighlightResponse])
async def get_my_highlights(
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    highlights = service.table("story_highlights").select("*").eq("user_id", current_user_id).eq("is_active", True).order("updated_at", desc=True).execute()
    
    result = []
    for h in highlights.data:
        items = service.table("story_highlight_items").select("id", count="exact").eq("highlight_id", h["id"]).execute()
        result.append(HighlightResponse(
            id=h["id"],
            user_id=h["user_id"],
            title=h["title"],
            cover_story_id=h.get("cover_story_id"),
            is_active=h.get("is_active", True),
            stories_count=items.count or 0,
            created_at=h["created_at"]
        ))
    
    return result


@router.post("/highlights", response_model=HighlightResponse)
async def create_highlight(
    data: HighlightCreate,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    result = service.table("story_highlights").insert({
        "user_id": current_user_id,
        "title": data.title
    }).execute()
    
    h = result.data[0]
    return HighlightResponse(
        id=h["id"],
        user_id=h["user_id"],
        title=h["title"],
        cover_story_id=None,
        is_active=True,
        stories_count=0,
        created_at=h["created_at"]
    )


@router.post("/highlights/{highlight_id}/stories/{story_id}")
async def add_story_to_highlight(
    highlight_id: str,
    story_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    highlight = service.table("story_highlights").select("*").eq("id", highlight_id).execute()
    if not highlight.data or highlight.data[0]["user_id"] != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    existing = service.table("story_highlight_items").select("*").eq("highlight_id", highlight_id).eq("story_id", story_id).execute()
    if existing.data:
        return {"success": True, "message": "Already in highlight"}
    
    service.table("story_highlight_items").insert({
        "highlight_id": highlight_id,
        "story_id": story_id
    }).execute()
    
    service.table("story_highlights").update({"updated_at": "now()"}).eq("id", highlight_id).execute()
    
    return {"success": True}


@router.delete("/highlights/{highlight_id}")
async def delete_highlight(
    highlight_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    highlight = service.table("story_highlights").select("*").eq("id", highlight_id).execute()
    if not highlight.data or highlight.data[0]["user_id"] != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    service.table("story_highlight_items").delete().eq("highlight_id", highlight_id).execute()
    service.table("story_highlights").delete().eq("id", highlight_id).execute()
    
    return {"success": True}
