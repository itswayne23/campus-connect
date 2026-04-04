from supabase import Client
from typing import Optional, List
from app.schemas.course_review import CourseReviewCreate, CourseReviewResponse, CourseStatsResponse, CourseStats


class CourseReviewService:
    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def create_review(self, user_id: str, review: CourseReviewCreate) -> dict:
        data = {
            "user_id": user_id,
            "course_code": review.course_code.upper(),
            "course_name": review.course_name,
            "department": review.department,
            "semester": review.semester,
            "overall_rating": review.overall_rating,
            "difficulty": review.difficulty,
            "workload": review.workload,
            "lecture_quality": review.lecture_quality,
            "materials_quality": review.materials_quality,
            "comment": review.comment,
            "pros": review.pros or [],
            "cons": review.cons or []
        }
        response = self.supabase.table("course_reviews").insert(data).execute()
        return response.data[0] if response.data else None

    async def get_course_reviews(self, course_code: str, semester: Optional[str] = None, limit: int = 20) -> List[dict]:
        query = self.supabase.table("course_reviews").select("*, profiles(username)").eq("course_code", course_code.upper())
        
        if semester:
            query = query.eq("semester", semester)
        
        query = query.order("created_at", desc=True).limit(limit)
        response = query.execute()
        
        results = []
        for item in response.data:
            profile = item.pop("profiles", {})
            item["user_username"] = profile.get("username", "Unknown")
            results.append(item)
        
        return results

    async def get_course_stats(self, course_code: str) -> Optional[dict]:
        response = self.supabase.table("course_reviews").select("*").eq("course_code", course_code.upper()).execute()
        reviews = response.data
        
        if not reviews:
            return None
        
        total = len(reviews)
        avg_overall = sum(r.get("overall_rating", 0) for r in reviews) / total
        avg_difficulty = sum(r.get("difficulty", 0) for r in reviews) / total
        avg_workload = sum(r.get("workload", 0) for r in reviews) / total
        avg_lecture = sum(r.get("lecture_quality", 0) for r in reviews) / total
        avg_materials = sum(r.get("materials_quality", 0) for r in reviews) / total
        
        stats = CourseStats(
            course_code=course_code.upper(),
            course_name=reviews[0].get("course_name", ""),
            department=reviews[0].get("department"),
            average_overall=round(avg_overall, 2),
            average_difficulty=round(avg_difficulty, 2),
            average_workload=round(avg_workload, 2),
            average_lecture_quality=round(avg_lecture, 2),
            average_materials_quality=round(avg_materials, 2),
            total_reviews=total
        )
        
        recent_response = self.supabase.table("course_reviews").select("*, profiles(username)").eq("course_code", course_code.upper()).order("created_at", desc=True).limit(5).execute()
        
        recent = []
        for item in recent_response.data:
            profile = item.pop("profiles", {})
            item["user_username"] = profile.get("username", "Unknown")
            recent.append(CourseReviewResponse(**item))
        
        return CourseStatsResponse(stats=stats, recent_reviews=recent)

    async def update_review(self, user_id: str, review_id: str, update_data: dict) -> Optional[dict]:
        response = self.supabase.table("course_reviews").update(update_data).eq("id", review_id).eq("user_id", user_id).execute()
        return response.data[0] if response.data else None

    async def upvote_review(self, review_id: str) -> bool:
        response = self.supabase.table("course_reviews").update({"upvotes": self.supabase.rpc('increment_upvotes', {'row_id': review_id})}).eq("id", review_id).execute()
        return len(response.data) > 0

    async def search_courses(self, query: str, limit: int = 20) -> List[dict]:
        response = self.supabase.table("course_reviews").select("course_code, course_name, department").ilike("course_code", f"%{query}%").order("course_code").limit(limit).execute()
        
        seen = set()
        results = []
        for r in response.data:
            code = r.get("course_code")
            if code and code not in seen:
                seen.add(code)
                results.append({"course_code": code, "course_name": r.get("course_name"), "department": r.get("department")})
        
        return results
