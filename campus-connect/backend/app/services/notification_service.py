from typing import List, Optional
from supabase import Client
from app.core import get_supabase, get_service_client

class NotificationService:
    def __init__(self):
        self.supabase: Client = get_supabase()
    
    async def get_notifications(self, user_id: str, limit: int = 50) -> dict:
        response = self.supabase.table("notifications").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit + 1).execute()
        
        has_more = len(response.data) > limit
        notifications_data = response.data[:limit]
        
        notifications = []
        for notification in notifications_data:
            notifications.append(await self._build_notification_response(notification))
        
        unread_count = self._get_unread_count(user_id)
        
        return {
            "notifications": notifications,
            "unread_count": unread_count,
            "has_more": has_more
        }
    
    def mark_as_read(self, notification_id: str, user_id: str) -> bool:
        service_client = get_service_client()
        
        service_client.table("notifications").update({"is_read": True}).eq("id", notification_id).eq("user_id", user_id).execute()
        
        return True
    
    def mark_all_as_read(self, user_id: str) -> bool:
        service_client = get_service_client()
        
        service_client.table("notifications").update({"is_read": True}).eq("user_id", user_id).eq("is_read", False).execute()
        
        return True
    
    def _get_unread_count(self, user_id: str) -> int:
        response = self.supabase.table("notifications").select("id", count="exact").eq("user_id", user_id).eq("is_read", False).execute()
        return response.count or 0
    
    async def _build_notification_response(self, notification: dict) -> dict:
        actor = None
        if notification.get("actor_id"):
            user_response = self.supabase.table("profiles").select("id, username, avatar_url").eq("id", notification["actor_id"]).execute()
            if user_response.data:
                actor = user_response.data[0]
        
        post = None
        if notification.get("post_id"):
            post_response = self.supabase.table("posts").select("id, content").eq("id", notification["post_id"]).execute()
            if post_response.data:
                post = {
                    "id": post_response.data[0]["id"],
                    "content": post_response.data[0]["content"][:100] + "..." if len(post_response.data[0]["content"]) > 100 else post_response.data[0]["content"]
                }
        
        return {
            "id": notification["id"],
            "user_id": notification["user_id"],
            "type": notification["type"],
            "actor_id": notification.get("actor_id"),
            "actor": actor,
            "post_id": notification.get("post_id"),
            "post": post,
            "is_read": notification.get("is_read", False),
            "created_at": notification.get("created_at")
        }

notification_service = NotificationService()
