from typing import List, Optional
from supabase import Client
from app.core import get_supabase, get_service_client

class MessageService:
    def __init__(self):
        self.supabase: Client = get_supabase()
    
    async def send_message(self, sender_id: str, receiver_id: str, content: str, media_url: Optional[str] = None) -> dict:
        service_client = get_service_client()
        
        message_data = {
            "sender_id": sender_id,
            "receiver_id": receiver_id,
            "content": content,
            "media_url": media_url,
            "is_read": False
        }
        
        response = service_client.table("messages").insert(message_data).execute()
        
        self._create_notification(receiver_id, "message", sender_id, response.data[0]["id"] if response.data else None)
        
        if response.data:
            return await self._build_message_response(response.data[0])
        
        return None
    
    async def get_conversations(self, user_id: str) -> List[dict]:
        response = self.supabase.table("messages").select("*").or_(f"sender_id.eq.{user_id},receiver_id.eq.{user_id}").order("created_at", desc=True).execute()
        
        conversations_dict = {}
        
        for msg in response.data:
            other_user_id = msg["receiver_id"] if msg["sender_id"] == user_id else msg["sender_id"]
            
            if other_user_id not in conversations_dict:
                user_response = self.supabase.table("profiles").select("id, username, avatar_url").eq("id", other_user_id).execute()
                
                if user_response.data:
                    conversations_dict[other_user_id] = {
                        "user_id": other_user_id,
                        "username": user_response.data[0]["username"],
                        "avatar_url": user_response.data[0].get("avatar_url"),
                        "last_message": None,
                        "unread_count": 0
                    }
            
            unread_response = self.supabase.table("messages").select("id", count="exact").eq("sender_id", other_user_id).eq("receiver_id", user_id).eq("is_read", False).execute()
            
            if other_user_id in conversations_dict:
                conversations_dict[other_user_id]["unread_count"] = unread_response.count or 0
                
                if not conversations_dict[other_user_id]["last_message"]:
                    conversations_dict[other_user_id]["last_message"] = await self._build_message_response(msg)
        
        conversations = list(conversations_dict.values())
        conversations.sort(key=lambda x: x["last_message"]["created_at"] if x["last_message"] else "", reverse=True)
        
        return conversations
    
    async def get_messages_with_user(self, user_id: str, other_user_id: str, limit: int = 50) -> List[dict]:
        response = self.supabase.table("messages").select("*").or_(f"and(sender_id.eq.{user_id},receiver_id.eq.{other_user_id}),and(sender_id.eq.{other_user_id},receiver_id.eq.{user_id})").order("created_at", desc=True).limit(limit).execute()
        
        messages = []
        for msg in reversed(response.data):
            messages.append(await self._build_message_response(msg))
        
        self._mark_messages_as_read(user_id, other_user_id)
        
        return messages
    
    def _mark_messages_as_read(self, user_id: str, other_user_id: str):
        try:
            service_client = get_service_client()
            
            service_client.table("messages").update({"is_read": True}).eq("sender_id", other_user_id).eq("receiver_id", user_id).eq("is_read", False).execute()
        except Exception:
            pass
    
    def _create_notification(self, user_id: str, notification_type: str, actor_id: str, message_id: Optional[str] = None):
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
    
    async def _build_message_response(self, message: dict) -> dict:
        return {
            "id": message["id"],
            "sender_id": message["sender_id"],
            "receiver_id": message["receiver_id"],
            "content": message["content"],
            "media_url": message.get("media_url"),
            "is_read": message.get("is_read", False),
            "created_at": message.get("created_at")
        }

message_service = MessageService()
