from typing import Optional, List
from supabase import Client
from app.core import get_supabase, get_service_client

class FollowService:
    def __init__(self):
        self.supabase: Client = get_supabase()
    
    async def follow_user(self, follower_id: str, following_id: str) -> dict:
        if follower_id == following_id:
            return {"success": False, "message": "Cannot follow yourself"}
        
        existing = self.supabase.table("follows").select("*").eq("follower_id", follower_id).eq("following_id", following_id).execute()
        
        if existing.data:
            return {"success": False, "message": "Already following"}
        
        service_client = get_service_client()
        
        service_client.table("follows").insert({
            "follower_id": follower_id,
            "following_id": following_id
        }).execute()
        
        follower_count = self._get_follower_count(following_id)
        following_count = self._get_following_count(follower_id)
        
        service_client.table("profiles").update({"followers_count": follower_count}).eq("id", following_id).execute()
        service_client.table("profiles").update({"following_count": following_count}).eq("id", follower_id).execute()
        
        self._create_notification(following_id, "follow", follower_id)
        
        return {"success": True, "message": "Followed successfully"}
    
    async def unfollow_user(self, follower_id: str, following_id: str) -> dict:
        service_client = get_service_client()
        
        service_client.table("follows").delete().eq("follower_id", follower_id).eq("following_id", following_id).execute()
        
        follower_count = max(0, self._get_follower_count(following_id) - 1)
        following_count = max(0, self._get_following_count(follower_id) - 1)
        
        service_client.table("profiles").update({"followers_count": follower_count}).eq("id", following_id).execute()
        service_client.table("profiles").update({"following_count": following_count}).eq("id", follower_id).execute()
        
        return {"success": True, "message": "Unfollowed successfully"}
    
    def get_followers(self, user_id: str, current_user_id: str, limit: int = 50) -> List[dict]:
        response = self.supabase.table("follows").select("follower_id, profiles!follows_follower_id_fkey(*), created_at").eq("following_id", user_id).order("created_at", desc=True).limit(limit).execute()
        
        followers = []
        for item in response.data:
            if item.get("profiles"):
                profile = item["profiles"]
                profile["is_following"] = self._is_following(current_user_id, profile["id"])
                followers.append(profile)
        
        return followers
    
    def get_following(self, user_id: str, current_user_id: str, limit: int = 50) -> List[dict]:
        response = self.supabase.table("follows").select("following_id, profiles!follows_following_id_fkey(*), created_at").eq("follower_id", user_id).order("created_at", desc=True).limit(limit).execute()
        
        following = []
        for item in response.data:
            if item.get("profiles"):
                profile = item["profiles"]
                profile["is_following"] = self._is_following(current_user_id, profile["id"])
                following.append(profile)
        
        return following
    
    def _get_follower_count(self, user_id: str) -> int:
        response = self.supabase.table("follows").select("*", count="exact").eq("following_id", user_id).execute()
        return response.count or 0
    
    def _get_following_count(self, user_id: str) -> int:
        response = self.supabase.table("follows").select("*", count="exact").eq("follower_id", user_id).execute()
        return response.count or 0
    
    def _is_following(self, follower_id: str, following_id: str) -> bool:
        response = self.supabase.table("follows").select("*").eq("follower_id", follower_id).eq("following_id", following_id).execute()
        return len(response.data) > 0
    
    def _create_notification(self, user_id: str, notification_type: str, actor_id: str):
        try:
            service_client = get_service_client()
            
            notification_data = {
                "user_id": user_id,
                "type": notification_type,
                "actor_id": actor_id,
                "is_read": False
            }
            
            service_client.table("notifications").insert(notification_data).execute()
        except Exception:
            pass

follow_service = FollowService()
