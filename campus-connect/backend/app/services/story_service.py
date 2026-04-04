from typing import Optional, List
from supabase import Client
from app.core import get_supabase, get_service_client
from datetime import datetime, timedelta

class StoryService:
    def __init__(self):
        self.supabase: Client = get_supabase()
    
    async def create_story(self, user_id: str, media_url: str, media_type: str = 'image', caption: Optional[str] = None) -> dict:
        service_client = get_service_client()
        
        expires_at = datetime.utcnow() + timedelta(hours=24)
        
        story_data = {
            "user_id": user_id,
            "media_url": media_url,
            "media_type": media_type,
            "caption": caption,
            "view_count": 0,
            "is_active": True,
            "expires_at": expires_at.isoformat()
        }
        
        response = service_client.table("stories").insert(story_data).execute()
        
        if response.data:
            return await self.get_story_by_id(response.data[0]["id"], user_id)
        
        return None
    
    async def get_story_by_id(self, story_id: str, current_user_id: Optional[str] = None) -> Optional[dict]:
        response = self.supabase.table("stories").select("*").eq("id", story_id).execute()
        
        if not response.data:
            return None
        
        story = response.data[0]
        return await self._build_story_response(story, current_user_id)
    
    async def get_user_stories(self, user_id: str, current_user_id: Optional[str] = None) -> List[dict]:
        now = datetime.utcnow()
        response = self.supabase.table("stories").select("*").eq("user_id", user_id).eq("is_active", True).gt("expires_at", now.isoformat()).order("created_at", desc=True).execute()
        
        stories = []
        for story in response.data:
            stories.append(await self._build_story_response(story, current_user_id))
        
        return stories
    
    async def get_following_stories(self, user_id: str, current_user_id: str) -> List[dict]:
        blocked_response = self.supabase.table("blocks").select("blocked_id").eq("blocker_id", current_user_id).execute()
        blocked_ids = [b["blocked_id"] for b in blocked_response.data]
        blocked_ids.append(current_user_id)
        
        following_response = self.supabase.table("follows").select("following_id").eq("follower_id", current_user_id).execute()
        following_ids = [f["following_id"] for f in following_response.data if f["following_id"] not in blocked_ids]
        
        if not following_ids:
            following_ids = [current_user_id]
        
        now = datetime.utcnow()
        
        stories_response = self.supabase.table("stories").select("*").in_("user_id", following_ids).eq("is_active", True).gt("expires_at", now.isoformat()).order("created_at", desc=True).execute()
        
        grouped_stories = {}
        for story in stories_response.data:
            user_id_key = story["user_id"]
            if user_id_key not in grouped_stories:
                user_response = self.supabase.table("profiles").select("id, username, avatar_url").eq("id", user_id_key).execute()
                user = user_response.data[0] if user_response.data else {"id": user_id_key, "username": "Unknown", "avatar_url": None}
                grouped_stories[user_id_key] = {
                    "user": user,
                    "stories": []
                }
            grouped_stories[user_id_key]["stories"].append(await self._build_story_response(story, current_user_id))
        
        return list(grouped_stories.values())
    
    async def view_story(self, story_id: str, user_id: str) -> dict:
        service_client = get_service_client()
        
        existing_view = self.supabase.table("story_views").select("*").eq("story_id", story_id).eq("user_id", user_id).execute()
        
        if not existing_view.data:
            service_client.table("story_views").insert({
                "story_id": story_id,
                "user_id": user_id
            }).execute()
            
            self.supabase.table("stories").update({"view_count": self.supabase.table("stories").select("view_count").eq("id", story_id).execute().data[0]["view_count"] + 1}).eq("id", story_id).execute()
        
        return {"success": True}
    
    async def delete_story(self, story_id: str, user_id: str) -> dict:
        service_client = get_service_client()
        
        service_client.table("stories").update({"is_active": False}).eq("id", story_id).eq("user_id", user_id).execute()
        
        return {"success": True}
    
    async def _build_story_response(self, story: dict, current_user_id: Optional[str] = None) -> dict:
        user_response = self.supabase.table("profiles").select("id, username, avatar_url").eq("id", story["user_id"]).execute()
        user = user_response.data[0] if user_response.data else None
        
        has_viewed = False
        if current_user_id:
            view_response = self.supabase.table("story_views").select("*").eq("story_id", story["id"]).eq("user_id", current_user_id).execute()
            has_viewed = len(view_response.data) > 0
        
        return {
            "id": story["id"],
            "user_id": story["user_id"],
            "user": user,
            "media_url": story["media_url"],
            "media_type": story.get("media_type", "image"),
            "caption": story.get("caption"),
            "view_count": story.get("view_count", 0),
            "has_viewed": has_viewed,
            "created_at": story.get("created_at"),
            "expires_at": story.get("expires_at")
        }

story_service = StoryService()
