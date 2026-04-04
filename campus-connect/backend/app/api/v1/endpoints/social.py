from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from app.schemas.social import (
    HashtagFollowResponse, BookmarkWithNote, BookmarkUpdateNote,
    MentionResponse, QuickReactionResponse
)
from app.api.deps import get_current_user_id

router = APIRouter()


def get_service_client():
    from app.core import get_service_client as get_client
    return get_client()


# Hashtag following endpoints
@router.get("/hashtags/following", response_model=List[HashtagFollowResponse])
async def get_followed_hashtags(
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    follows = service.table("hashtag_follows").select("*").eq("user_id", current_user_id).order("created_at", desc=True).execute()
    
    return [
        HashtagFollowResponse(
            id=f["id"],
            user_id=f["user_id"],
            hashtag=f["hashtag"],
            created_at=f["created_at"]
        )
        for f in follows.data
    ]


@router.post("/hashtags/follow/{hashtag}")
async def follow_hashtag(
    hashtag: str,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    normalized_hashtag = hashtag.lower().strip().replace("#", "")
    
    existing = service.table("hashtag_follows").select("*").eq("user_id", current_user_id).eq("hashtag", normalized_hashtag).execute()
    if existing.data:
        service.table("hashtag_follows").delete().eq("id", existing.data[0]["id"]).execute()
        return {"success": True, "following": False, "hashtag": normalized_hashtag}
    
    result = service.table("hashtag_follows").insert({
        "user_id": current_user_id,
        "hashtag": normalized_hashtag
    }).execute()
    
    return {"success": True, "following": True, "hashtag": normalized_hashtag}


@router.get("/hashtags/{hashtag}/posts")
async def get_hashtag_posts(
    hashtag: str,
    limit: int = Query(20, le=50),
    offset: int = Query(0),
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    normalized_hashtag = hashtag.lower().strip().replace("#", "")
    
    posts = service.table("posts").select("*").ilike("content", f"%#{normalized_hashtag}%").eq("status", "approved").order("created_at", desc=True).limit(limit).offset(offset).execute()
    
    return posts.data


# Bookmarks with notes endpoints
@router.get("/bookmarks", response_model=List[BookmarkWithNote])
async def get_bookmarks(
    folder: Optional[str] = Query(None),
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    query = service.table("bookmarks").select("*").eq("user_id", current_user_id).order("created_at", desc=True)
    
    if folder:
        query = query.eq("folder", folder)
    
    bookmarks = query.execute()
    
    return [
        BookmarkWithNote(
            id=b["id"],
            post_id=b["post_id"],
            user_id=b["user_id"],
            note=b.get("note"),
            folder=b.get("folder"),
            created_at=b["created_at"]
        )
        for b in bookmarks.data
    ]


@router.get("/bookmarks/folders")
async def get_bookmark_folders(
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    bookmarks = service.table("bookmarks").select("folder").eq("user_id", current_user_id).not_.is_("folder", None).execute()
    
    folders = set()
    for b in bookmarks.data:
        if b.get("folder"):
            folders.add(b["folder"])
    
    return {"folders": list(folders)}


@router.put("/bookmarks/{post_id}/note")
async def update_bookmark_note(
    post_id: str,
    data: BookmarkUpdateNote,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    bookmark = service.table("bookmarks").select("*").eq("post_id", post_id).eq("user_id", current_user_id).execute()
    
    update_data = {}
    if data.note is not None:
        update_data["note"] = data.note
    if data.folder is not None:
        update_data["folder"] = data.folder
    
    if bookmark.data:
        service.table("bookmarks").update(update_data).eq("post_id", post_id).eq("user_id", current_user_id).execute()
    else:
        service.table("bookmarks").insert({
            "post_id": post_id,
            "user_id": current_user_id,
            "note": data.note,
            "folder": data.folder
        }).execute()
    
    return {"success": True}


# Mentions endpoints
@router.get("/mentions", response_model=List[MentionResponse])
async def get_mentions(
    unread_only: bool = Query(False),
    limit: int = Query(20, le=50),
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    query = service.table("mentions").select("*").eq("user_id", current_user_id).order("created_at", desc=True).limit(limit)
    
    if unread_only:
        query = query.eq("is_read", False)
    
    mentions = query.execute()
    
    result = []
    for m in mentions.data:
        mentioned_by_profile = service.table("profiles").select("username").eq("id", m["mentioned_by"]).execute()
        username = mentioned_by_profile.data[0]["username"] if mentioned_by_profile.data else None
        
        result.append(MentionResponse(
            id=m["id"],
            user_id=m["user_id"],
            mentioned_by=m["mentioned_by"],
            mentioned_by_username=username,
            post_id=m.get("post_id"),
            comment_id=m.get("comment_id"),
            is_read=m.get("is_read", False),
            created_at=m["created_at"]
        ))
    
    return result


@router.put("/mentions/{mention_id}/read")
async def mark_mention_read(
    mention_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    service.table("mentions").update({"is_read": True}).eq("id", mention_id).eq("user_id", current_user_id).execute()
    
    return {"success": True}


@router.put("/mentions/read-all")
async def mark_all_mentions_read(
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    service.table("mentions").update({"is_read": True}).eq("user_id", current_user_id).eq("is_read", False).execute()
    
    return {"success": True}


# Quick reactions endpoints
@router.post("/quick-reaction/{post_id}")
async def add_quick_reaction(
    post_id: str,
    reaction_type: str = "like",
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    existing = service.table("quick_reactions").select("*").eq("user_id", current_user_id).eq("post_id", post_id).execute()
    
    if existing.data:
        return {"success": True, "already_reacted": True}
    
    service.table("quick_reactions").insert({
        "user_id": current_user_id,
        "post_id": post_id,
        "reaction_type": reaction_type
    }).execute()
    
    return {"success": True, "already_reacted": False}


@router.delete("/quick-reaction/{post_id}")
async def remove_quick_reaction(
    post_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    service.table("quick_reactions").delete().eq("user_id", current_user_id).eq("post_id", post_id).execute()
    
    return {"success": True}


@router.get("/quick-reactions/check")
async def check_quick_reactions(
    post_ids: str,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    ids = post_ids.split(",")
    
    reactions = service.table("quick_reactions").select("post_id").eq("user_id", current_user_id).in_("post_id", ids).execute()
    
    reacted_ids = [r["post_id"] for r in reactions.data]
    
    return {"reacted_posts": reacted_ids}
