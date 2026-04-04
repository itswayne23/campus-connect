from supabase import Client
from typing import Optional, List
from datetime import datetime, timedelta
from app.schemas.mood import MoodEntryCreate, MoodEntryResponse, MoodStatsResponse, MoodStats


class MoodService:
    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def create_mood_entry(self, user_id: str, entry: MoodEntryCreate) -> dict:
        data = {
            "user_id": user_id,
            "mood": entry.mood,
            "note": entry.note,
            "activities": entry.activities or []
        }
        response = self.supabase.table("mood_entries").insert(data).execute()
        return response.data[0] if response.data else None

    async def get_user_mood_entries(self, user_id: str, limit: int = 30) -> List[dict]:
        response = self.supabase.table("mood_entries").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
        return response.data

    async def get_mood_stats(self, user_id: str) -> dict:
        entries_response = self.supabase.table("mood_entries").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        entries = entries_response.data or []
        
        mood_counts = {}
        for entry in entries:
            mood = entry.get("mood", "neutral")
            mood_counts[mood] = mood_counts.get(mood, 0) + 1
        
        total_entries = len(entries)
        streak_days = self._calculate_streak(entries)
        
        week_ago = (datetime.utcnow() - timedelta(days=7)).isoformat()
        week_entries = [e for e in entries if e.get("created_at", "") >= week_ago]
        weekly_data = []
        for i in range(7):
            day = (datetime.utcnow() - timedelta(days=6-i)).date()
            day_str = day.isoformat()
            day_entries = [e for e in week_entries if e.get("created_at", "").startswith(day_str)]
            weekly_data.append({
                "date": day_str,
                "mood": day_entries[0].get("mood") if day_entries else None,
                "count": len(day_entries)
            })
        
        avg_mood = max(mood_counts.keys(), key=(lambda k: mood_counts[k])) if mood_counts else None
        
        stats = MoodStats(
            total_entries=total_entries,
            mood_distribution=mood_counts,
            average_mood=avg_mood,
            streak_days=streak_days,
            weekly_data=weekly_data
        )
        
        return MoodStatsResponse(
            stats=stats,
            recent_entries=[MoodEntryResponse(**e) for e in entries[:10]]
        )

    def _calculate_streak(self, entries: List[dict]) -> int:
        if not entries:
            return 0
        
        dates = set()
        for entry in entries:
            created = entry.get("created_at", "")
            if created:
                date = created[:10]
                dates.add(date)
        
        if not dates:
            return 0
        
        sorted_dates = sorted(dates, reverse=True)
        today = datetime.utcnow().date().isoformat()
        
        streak = 0
        check_date = datetime.utcnow().date()
        
        for d in sorted_dates:
            if d == check_date.isoformat():
                streak += 1
                check_date -= timedelta(days=1)
            elif d == check_date.isoformat():
                streak += 1
                check_date -= timedelta(days=1)
            else:
                break
        
        return streak

    async def delete_mood_entry(self, user_id: str, entry_id: str) -> bool:
        response = self.supabase.table("mood_entries").delete().eq("id", entry_id).eq("user_id", user_id).execute()
        return len(response.data) > 0
