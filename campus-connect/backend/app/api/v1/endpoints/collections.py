from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from app.schemas.collections import (
    CollectionCreate, CollectionUpdate, CollectionResponse, 
    CollectionDetailResponse, CollectionPostAdd, ThemePreferencesResponse,
    ThemePreferencesUpdate, ScheduledStoryCreate, ScheduledStoryResponse
)
from app.api.deps import get_current_user_id

router = APIRouter()


def get_service_client():
    from app.core import get_service_client as get_client
    return get_client()


# Collections endpoints
@router.get("/collections", response_model=List[CollectionResponse])
async def get_my_collections(
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    collections = service.table("collections").select("*").eq("user_id", current_user_id).order("created_at", desc=True).execute()
    
    result = []
    for c in collections.data:
        posts_count = service.table("collection_posts").select("id", count="exact").eq("collection_id", c["id"]).execute()
        result.append({
            "id": c["id"],
            "user_id": c["user_id"],
            "name": c["name"],
            "description": c.get("description"),
            "is_public": c.get("is_public", False),
            "posts_count": posts_count.count or 0,
            "created_at": c["created_at"],
            "updated_at": c.get("updated_at", c["created_at"])
        })
    
    return result


@router.post("/collections", response_model=CollectionResponse)
async def create_collection(
    data: CollectionCreate,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    result = service.table("collections").insert({
        "user_id": current_user_id,
        "name": data.name,
        "description": data.description,
        "is_public": data.is_public
    }).execute()
    
    c = result.data[0]
    
    return {
        "id": c["id"],
        "user_id": c["user_id"],
        "name": c["name"],
        "description": c.get("description"),
        "is_public": c.get("is_public", False),
        "posts_count": 0,
        "created_at": c["created_at"],
        "updated_at": c.get("updated_at", c["created_at"])
    }


@router.get("/collections/{collection_id}", response_model=CollectionDetailResponse)
async def get_collection(
    collection_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    collection = service.table("collections").select("*").eq("id", collection_id).execute()
    
    if not collection.data:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    c = collection.data[0]
    
    if not c.get("is_public", False) and c["user_id"] != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this collection")
    
    collection_posts = service.table("collection_posts").select("post_id, added_at").eq("collection_id", collection_id).order("added_at", desc=True).execute()
    
    posts = []
    for cp in collection_posts.data:
        post = service.table("posts").select("*").eq("id", cp["post_id"]).execute()
        if post.data:
            posts.append(post.data[0])
    
    posts_count = len(collection_posts.data)
    
    return {
        "id": c["id"],
        "user_id": c["user_id"],
        "name": c["name"],
        "description": c.get("description"),
        "is_public": c.get("is_public", False),
        "posts_count": posts_count,
        "created_at": c["created_at"],
        "updated_at": c.get("updated_at", c["created_at"]),
        "posts": posts
    }


@router.put("/collections/{collection_id}", response_model=CollectionResponse)
async def update_collection(
    collection_id: str,
    data: CollectionUpdate,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    collection = service.table("collections").select("*").eq("id", collection_id).execute()
    if not collection.data or collection.data[0]["user_id"] != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {"updated_at": "now()"}
    if data.name is not None:
        update_data["name"] = data.name
    if data.description is not None:
        update_data["description"] = data.description
    if data.is_public is not None:
        update_data["is_public"] = data.is_public
    
    service.table("collections").update(update_data).eq("id", collection_id).execute()
    
    updated = service.table("collections").select("*").eq("id", collection_id).execute()
    c = updated.data[0]
    posts_count = service.table("collection_posts").select("id", count="exact").eq("collection_id", collection_id).execute()
    
    return {
        "id": c["id"],
        "user_id": c["user_id"],
        "name": c["name"],
        "description": c.get("description"),
        "is_public": c.get("is_public", False),
        "posts_count": posts_count.count or 0,
        "created_at": c["created_at"],
        "updated_at": c.get("updated_at", c["created_at"])
    }


@router.delete("/collections/{collection_id}")
async def delete_collection(
    collection_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    collection = service.table("collections").select("*").eq("id", collection_id).execute()
    if not collection.data or collection.data[0]["user_id"] != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    service.table("collection_posts").delete().eq("collection_id", collection_id).execute()
    service.table("collections").delete().eq("id", collection_id).execute()
    
    return {"success": True}


@router.post("/collections/{collection_id}/posts")
async def add_to_collection(
    collection_id: str,
    data: CollectionPostAdd,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    collection = service.table("collections").select("*").eq("id", collection_id).execute()
    if not collection.data or collection.data[0]["user_id"] != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    existing = service.table("collection_posts").select("*").eq("collection_id", collection_id).eq("post_id", data.post_id).execute()
    if existing.data:
        return {"success": True, "message": "Already in collection"}
    
    service.table("collection_posts").insert({
        "collection_id": collection_id,
        "post_id": data.post_id
    }).execute()
    
    return {"success": True}


@router.delete("/collections/{collection_id}/posts/{post_id}")
async def remove_from_collection(
    collection_id: str,
    post_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    collection = service.table("collections").select("*").eq("id", collection_id).execute()
    if not collection.data or collection.data[0]["user_id"] != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    service.table("collection_posts").delete().eq("collection_id", collection_id).eq("post_id", post_id).execute()
    
    return {"success": True}


# Theme preferences endpoints
@router.get("/theme", response_model=ThemePreferencesResponse)
async def get_theme(
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    theme = service.table("theme_preferences").select("*").eq("user_id", current_user_id).execute()
    
    if not theme.data:
        return ThemePreferencesResponse(
            theme="system",
            accent_color="#3b82f6",
            custom_dark_bg=None,
            custom_light_bg=None,
            font_size="medium",
            reduced_motion=False,
            high_contrast=False
        )
    
    t = theme.data[0]
    return ThemePreferencesResponse(
        theme=t.get("theme", "system"),
        accent_color=t.get("accent_color", "#3b82f6"),
        custom_dark_bg=t.get("custom_dark_bg"),
        custom_light_bg=t.get("custom_light_bg"),
        font_size=t.get("font_size", "medium"),
        reduced_motion=t.get("reduced_motion", False),
        high_contrast=t.get("high_contrast", False)
    )


@router.put("/theme", response_model=ThemePreferencesResponse)
async def update_theme(
    data: ThemePreferencesUpdate,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    update_data = {"updated_at": "now()"}
    for field, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            update_data[field] = value
    
    existing = service.table("theme_preferences").select("*").eq("user_id", current_user_id).execute()
    
    if existing.data:
        service.table("theme_preferences").update(update_data).eq("user_id", current_user_id).execute()
    else:
        update_data["user_id"] = current_user_id
        service.table("theme_preferences").insert(update_data).execute()
    
    return await get_theme(current_user_id)


# Scheduled stories endpoints
@router.get("/scheduled-stories", response_model=List[ScheduledStoryResponse])
async def get_scheduled_stories(
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    stories = service.table("scheduled_stories").select("*").eq("user_id", current_user_id).eq("status", "pending").order("scheduled_at", asc=True).execute()
    
    return [
        ScheduledStoryResponse(
            id=s["id"],
            user_id=s["user_id"],
            media_url=s["media_url"],
            media_type=s.get("media_type", "image"),
            caption=s.get("caption"),
            scheduled_at=s["scheduled_at"],
            status=s["status"],
            created_at=s["created_at"]
        )
        for s in stories.data
    ]


@router.post("/scheduled-stories", response_model=ScheduledStoryResponse)
async def create_scheduled_story(
    data: ScheduledStoryCreate,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    result = service.table("scheduled_stories").insert({
        "user_id": current_user_id,
        "media_url": data.media_url,
        "media_type": data.media_type,
        "caption": data.caption,
        "scheduled_at": data.scheduled_at.isoformat()
    }).execute()
    
    s = result.data[0]
    return ScheduledStoryResponse(
        id=s["id"],
        user_id=s["user_id"],
        media_url=s["media_url"],
        media_type=s.get("media_type", "image"),
        caption=s.get("caption"),
        scheduled_at=s["scheduled_at"],
        status=s["status"],
        created_at=s["created_at"]
    )


@router.delete("/scheduled-stories/{story_id}")
async def cancel_scheduled_story(
    story_id: str,
    current_user_id: str = Depends(get_current_user_id)
):
    service = get_service_client()
    
    story = service.table("scheduled_stories").select("*").eq("id", story_id).execute()
    if not story.data or story.data[0]["user_id"] != current_user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    service.table("scheduled_stories").update({"status": "cancelled"}).eq("id", story_id).execute()
    
    return {"success": True}
