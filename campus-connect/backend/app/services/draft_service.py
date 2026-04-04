from typing import Optional, List
from supabase import Client
from app.core import get_supabase, get_service_client

class DraftService:
    def __init__(self):
        self.supabase: Client = get_supabase()
    
    async def save_draft(self, user_id: str, content: str, media_urls: List[str] = [], category: Optional[str] = None, poll_data: Optional[dict] = None, is_anonymous: bool = False) -> dict:
        service_client = get_service_client()
        
        existing = self.supabase.table("drafts").select("id").eq("user_id", user_id).execute()
        
        if existing.data:
            draft_data = {
                "content": content,
                "media_urls": media_urls,
                "category": category,
                "poll_data": poll_data,
                "is_anonymous": is_anonymous,
                "updated_at": "now()"
            }
            service_client.table("drafts").update(draft_data).eq("user_id", user_id).execute()
            
            draft_response = self.supabase.table("drafts").select("*").eq("user_id", user_id).execute()
            return draft_response.data[0] if draft_response.data else None
        else:
            draft_data = {
                "user_id": user_id,
                "content": content,
                "media_urls": media_urls,
                "category": category,
                "poll_data": poll_data,
                "is_anonymous": is_anonymous
            }
            response = service_client.table("drafts").insert(draft_data).execute()
            return response.data[0] if response.data else None
    
    async def get_draft(self, user_id: str) -> Optional[dict]:
        response = self.supabase.table("drafts").select("*").eq("user_id", user_id).order("updated_at", desc=True).limit(1).execute()
        return response.data[0] if response.data else None
    
    async def delete_draft(self, draft_id: str, user_id: str) -> bool:
        service_client = get_service_client()
        service_client.table("drafts").delete().eq("id", draft_id).eq("user_id", user_id).execute()
        return True
    
    async def clear_draft(self, user_id: str) -> bool:
        service_client = get_service_client()
        service_client.table("drafts").delete().eq("user_id", user_id).execute()
        return True

draft_service = DraftService()
