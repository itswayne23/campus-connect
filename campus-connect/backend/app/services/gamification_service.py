from supabase import Client
from typing import Optional, List
from datetime import datetime, date


class GamificationService:
    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def get_user_stats(self, user_id: str) -> Optional[dict]:
        gam_response = self.supabase.table("user_gamification").select("*").eq("user_id", user_id).execute()
        
        if not gam_response.data:
            await self._create_user_gamification(user_id)
            gam_response = self.supabase.table("user_gamification").select("*").eq("user_id", user_id).execute()
        
        gam = gam_response.data[0]
        
        profile_response = self.supabase.table("profiles").select("username, avatar_url").eq("id", user_id).execute()
        profile = profile_response.data[0] if profile_response.data else {}
        
        posts_response = self.supabase.table("posts").select("id, likes_count, comments_count").eq("author_id", user_id).execute()
        posts_count = len(posts_response.data)
        likes_received = sum(p.get("likes_count", 0) for p in posts_response.data)
        
        comments_response = self.supabase.table("comments").select("id").eq("author_id", user_id).execute()
        comments_count = len(comments_response.data)
        
        follows_response = self.supabase.table("profiles").select("followers_count").eq("id", user_id).execute()
        followers_count = follows_response.data[0].get("followers_count", 0) if follows_response.data else 0
        
        achievements_response = self.supabase.table("user_achievements").select("id").eq("user_id", user_id).execute()
        achievements_count = len(achievements_response.data)
        
        rank = await self._calculate_rank(user_id, gam.get("total_points", 0))
        level = self._calculate_level(gam.get("total_points", 0))
        
        return {
            "user_id": user_id,
            "username": profile.get("username", "Unknown"),
            "avatar_url": profile.get("avatar_url"),
            "total_points": gam.get("total_points", 0),
            "current_streak": gam.get("current_streak", 0),
            "longest_streak": gam.get("longest_streak", 0),
            "posts_count": posts_count,
            "likes_received": likes_received,
            "comments_count": comments_count,
            "followers_count": followers_count,
            "achievements_count": achievements_count,
            "rank": rank,
            "level": level
        }

    async def get_leaderboard(self, time_period: str = "all_time", limit: int = 20) -> dict:
        response = self.supabase.table("user_gamification").select("*, profiles(username, avatar_url)").order("total_points", desc=True).limit(limit).execute()
        
        entries = []
        user_rank = None
        
        for i, item in enumerate(response.data):
            profile = item.pop("profiles", {})
            entries.append({
                "rank": i + 1,
                "user_id": item.get("user_id"),
                "username": profile.get("username", "Unknown"),
                "avatar_url": profile.get("avatar_url"),
                "total_points": item.get("total_points", 0),
                "current_streak": item.get("current_streak", 0)
            })
        
        return {"entries": entries, "user_rank": user_rank, "time_period": time_period}

    async def add_points(self, user_id: str, points: int, reason: str) -> Optional[dict]:
        transaction = {
            "user_id": user_id,
            "points": points,
            "reason": reason
        }
        self.supabase.table("points_transactions").insert(transaction).execute()
        
        gam_response = self.supabase.table("user_gamification").select("*").eq("user_id", user_id).execute()
        
        if not gam_response.data:
            await self._create_user_gamification(user_id)
            gam_response = self.supabase.table("user_gamification").select("*").eq("user_id", user_id).execute()
        
        gam = gam_response.data[0]
        today = date.today().isoformat()
        last_activity = gam.get("last_activity_date")
        
        current_streak = gam.get("current_streak", 0)
        longest_streak = gam.get("longest_streak", 0)
        
        if last_activity != today:
            yesterday = (date.today() - timedelta(days=1)).isoformat()
            if last_activity == yesterday:
                current_streak += 1
            else:
                current_streak = 1
            
            if current_streak > longest_streak:
                longest_streak = current_streak
        
        new_points = gam.get("total_points", 0) + points
        new_level = self._calculate_level(new_points)
        
        update_data = {
            "total_points": new_points,
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "last_activity_date": today,
            "level": new_level,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        self.supabase.table("user_gamification").update(update_data).eq("user_id", user_id).execute()
        
        await self._check_achievements(user_id)
        
        return update_data

    async def _create_user_gamification(self, user_id: str):
        data = {
            "user_id": user_id,
            "total_points": 0,
            "current_streak": 0,
            "longest_streak": 0,
            "level": 1
        }
        self.supabase.table("user_gamification").insert(data).execute()

    def _calculate_level(self, points: int) -> int:
        if points < 100:
            return 1
        elif points < 500:
            return 2
        elif points < 1000:
            return 3
        elif points < 2500:
            return 4
        elif points < 5000:
            return 5
        elif points < 10000:
            return 6
        else:
            return 7

    async def _calculate_rank(self, user_id: str, points: int) -> int:
        response = self.supabase.table("user_gamification").select("total_points").order("total_points", desc=True).execute()
        
        rank = 1
        for item in response.data:
            if item.get("total_points", 0) > points:
                rank += 1
            else:
                break
        
        return rank

    async def _check_achievements(self, user_id: str):
        stats = await self.get_user_stats(user_id)
        
        achievements_response = self.supabase.table("achievements").select("*").execute()
        
        user_achievements_response = self.supabase.table("user_achievements").select("achievement_id").eq("user_id", user_id).execute()
        user_achievement_ids = set(a.get("achievement_id") for a in user_achievement_response.data)
        
        for achievement in achievements_response.data:
            if achievement.get("id") in user_achievement_ids:
                continue
            
            points_required = achievement.get("points_required", 0)
            category = achievement.get("category")
            
            earned = False
            
            if category == "posts" and stats.get("posts_count", 0) >= points_required:
                earned = True
            elif category == "engagement" and stats.get("likes_received", 0) >= points_required:
                earned = True
            elif category == "social" and stats.get("followers_count", 0) >= points_required:
                earned = True
            elif category == "streak" and stats.get("current_streak", 0) >= points_required:
                earned = True
            
            if earned:
                self.supabase.table("user_achievements").insert({
                    "user_id": user_id,
                    "achievement_id": achievement.get("id")
                }).execute()

    async def get_user_achievements(self, user_id: str) -> List[dict]:
        response = self.supabase.table("user_achievements").select("*, achievements(*)").eq("user_id", user_id).order("earned_at", desc=True).execute()
        return response.data

    async def get_all_achievements(self) -> List[dict]:
        response = self.supabase.table("achievements").select("*").order("points_required").execute()
        return response.data


from datetime import timedelta
