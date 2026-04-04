from supabase import Client
from typing import Optional, List
from app.schemas.professor import ProfessorRatingCreate, ProfessorRatingResponse, ProfessorStatsResponse, ProfessorStats


class ProfessorRatingService:
    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def create_rating(self, user_id: str, rating: ProfessorRatingCreate) -> dict:
        data = {
            "user_id": user_id,
            "professor_name": rating.professor_name,
            "course_code": rating.course_code,
            "department": rating.department,
            "overall_rating": rating.overall_rating,
            "difficulty": rating.difficulty,
            "would_take_again": rating.would_take_again,
            "attendance_mandatory": rating.attendance_mandatory,
            "grade_type": rating.grade_type,
            "comment": rating.comment
        }
        response = self.supabase.table("professor_ratings").insert(data).execute()
        return response.data[0] if response.data else None

    async def get_professor_ratings(self, professor_name: str, course_code: Optional[str] = None, limit: int = 20) -> List[dict]:
        query = self.supabase.table("professor_ratings").select("*, profiles(username)").ilike("professor_name", f"%{professor_name}%")
        
        if course_code:
            query = query.eq("course_code", course_code.upper())
        
        query = query.order("created_at", desc=True).limit(limit)
        response = query.execute()
        
        results = []
        for item in response.data:
            profile = item.pop("profiles", {})
            item["user_username"] = profile.get("username", "Unknown")
            results.append(item)
        
        return results

    async def get_professor_stats(self, professor_name: str, course_code: Optional[str] = None) -> Optional[dict]:
        query = self.supabase.table("professor_ratings").select("*").ilike("professor_name", f"%{professor_name}%")
        
        if course_code:
            query = query.eq("course_code", course_code.upper())
        
        response = query.execute()
        ratings = response.data
        
        if not ratings:
            return None
        
        total = len(ratings)
        avg_rating = sum(r.get("overall_rating", 0) for r in ratings) / total
        avg_difficulty = sum(r.get("difficulty", 0) for r in ratings) / total
        would_take = sum(1 for r in ratings if r.get("would_take_again")) / total * 100
        attendance = sum(1 for r in ratings if r.get("attendance_mandatory")) / total * 100
        
        department = ratings[0].get("department")
        
        stats = ProfessorStats(
            professor_name=professor_name,
            course_code=course_code or "All",
            department=department,
            average_rating=round(avg_rating, 2),
            average_difficulty=round(avg_difficulty, 2),
            total_ratings=total,
            would_take_again_percentage=round(would_take, 2),
            attendance_mandatory_percentage=round(attendance, 2)
        )
        
        recent_response = self.supabase.table("professor_ratings").select("*, profiles(username)").ilike("professor_name", f"%{professor_name}%").order("created_at", desc=True).limit(5).execute()
        
        recent = []
        for item in recent_response.data:
            profile = item.pop("profiles", {})
            item["user_username"] = profile.get("username", "Unknown")
            recent.append(ProfessorRatingResponse(**item))
        
        return ProfessorStatsResponse(stats=stats, recent_ratings=recent)

    async def update_rating(self, user_id: str, rating_id: str, update_data: dict) -> Optional[dict]:
        response = self.supabase.table("professor_ratings").update(update_data).eq("id", rating_id).eq("user_id", user_id).execute()
        return response.data[0] if response.data else None

    async def upvote_rating(self, rating_id: str) -> bool:
        response = self.supabase.table("professor_ratings").update({"upvotes": self.supabase.rpc('increment_upvotes', {'row_id': rating_id})}).eq("id", rating_id).execute()
        return len(response.data) > 0

    async def search_professors(self, query: str, limit: int = 20) -> List[dict]:
        response = self.supabase.table("professor_ratings").select("professor_name, department").ilike("professor_name", f"%{query}%").order("professor_name").limit(limit).execute()
        
        seen = set()
        results = []
        for r in response.data:
            name = r.get("professor_name")
            if name and name not in seen:
                seen.add(name)
                results.append({"professor_name": name, "department": r.get("department")})
        
        return results
