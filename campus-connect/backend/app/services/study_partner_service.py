from supabase import Client
from typing import Optional, List
from datetime import datetime


class StudyPartnerService:
    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def create_request(self, user_id: str, request_data: dict) -> dict:
        data = {
            "user_id": user_id,
            "course": request_data.get("course"),
            "topic": request_data.get("topic"),
            "description": request_data.get("description"),
            "preferred_method": request_data.get("preferred_method", "both"),
            "availability": request_data.get("availability"),
            "is_active": True
        }
        response = self.supabase.table("study_partner_requests").insert(data).execute()
        return response.data[0] if response.data else None

    async def get_requests(self, filters: dict = None, limit: int = 50) -> List[dict]:
        query = self.supabase.table("study_partner_requests").select("*, profiles(username, avatar_url)")
        
        if filters:
            if filters.get("course"):
                query = query.ilike("course", f"%{filters['course']}%")
            if filters.get("topic"):
                query = query.ilike("topic", f"%{filters['topic']}%")
            if filters.get("preferred_method"):
                query = query.eq("preferred_method", filters["preferred_method"])
        
        query = query.eq("is_active", True).order("created_at", desc=True).limit(limit)
        response = query.execute()
        
        results = []
        for item in response.data:
            profile = item.pop("profiles", {})
            item["user_username"] = profile.get("username", "Unknown")
            item["user_avatar_url"] = profile.get("avatar_url")
            results.append(item)
        
        return results

    async def get_user_requests(self, user_id: str) -> List[dict]:
        response = self.supabase.table("study_partner_requests").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        return response.data

    async def update_request(self, user_id: str, request_id: str, update_data: dict) -> Optional[dict]:
        update_data["updated_at"] = datetime.utcnow().isoformat()
        response = self.supabase.table("study_partner_requests").update(update_data).eq("id", request_id).eq("user_id", user_id).execute()
        return response.data[0] if response.data else None

    async def delete_request(self, user_id: str, request_id: str) -> bool:
        response = self.supabase.table("study_partner_requests").delete().eq("id", request_id).eq("user_id", user_id).execute()
        return len(response.data) > 0

    async def create_match(self, user_id: str, request_id: str) -> Optional[dict]:
        request_response = self.supabase.table("study_partner_requests").select("*").eq("id", request_id).execute()
        if not request_response.data:
            return None
        
        request_data = request_response.data[0]
        if request_data.get("user_id") == user_id:
            return None
        
        data = {
            "request_id": request_id,
            "matched_user_id": user_id
        }
        response = self.supabase.table("study_matches").insert(data).execute()
        
        if response.data:
            match = response.data[0]
            matched_profile = self.supabase.table("profiles").select("username, avatar_url").eq("id", user_id).execute()
            if matched_profile.data:
                match["matched_username"] = matched_profile.data[0].get("username")
                match["matched_avatar_url"] = matched_profile.data[0].get("avatar_url")
                match["matched_course"] = request_data.get("course")
                match["matched_topic"] = request_data.get("topic")
            return match
        
        return None

    async def get_user_matches(self, user_id: str) -> List[dict]:
        requests_response = self.supabase.table("study_partner_requests").select("id").eq("user_id", user_id).execute()
        request_ids = [r["id"] for r in requests_response.data]
        
        if not request_ids:
            return []
        
        response = self.supabase.table("study_matches").select("*, profiles(username, avatar_url), study_partner_requests(course, topic)").in_("request_id", request_ids).execute()
        
        results = []
        for item in response.data:
            profile = item.pop("profiles", {})
            request = item.pop("study_partner_requests", {})
            item["matched_username"] = profile.get("username", "Unknown")
            item["matched_avatar_url"] = profile.get("avatar_url")
            item["matched_course"] = request.get("course") if request else None
            item["matched_topic"] = request.get("topic") if request else None
            results.append(item)
        
        return results
