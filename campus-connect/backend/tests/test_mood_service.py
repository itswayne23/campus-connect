import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from app.services.mood_service import MoodService


class TestMoodService:
    """Test suite for MoodService"""

    @pytest.fixture
    def mood_service(self, mock_supabase_client):
        """Create MoodService with mocked Supabase client"""
        with patch('app.services.mood_service.get_supabase', return_value=mock_supabase_client):
            with patch('app.services.mood_service.get_service_client', return_value=mock_supabase_client):
                service = MoodService()
                service.supabase = mock_supabase_client
                return service

    @pytest.mark.unit
    def test_mood_service_initialization(self, mood_service):
        """Test that MoodService initializes correctly"""
        assert mood_service is not None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_create_mood_entry(self, mood_service):
        """Test create_mood_entry creates mood entry"""
        mock_response = MagicMock()
        mock_response.data = [{"id": "mood-123"}]
        
        mood_service.supabase.table.return_value.insert.return_value.execute.return_value = mock_response
        
        result = await mood_service.create_mood_entry(
            user_id="user-123",
            mood_type="happy",
            note="Feeling great!"
        )
        
        assert result is not None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_mood_entries(self, mood_service):
        """Test get_mood_entries returns mood history"""
        mock_response = MagicMock()
        mock_response.data = [
            {"id": "mood-123", "mood_type": "happy", "note": "Great day!"}
        ]
        
        mood_service.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        result = await mood_service.get_mood_entries("user-123", limit=10)
        
        assert isinstance(result, list)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_mood_stats(self, mood_service):
        """Test get_mood_stats returns statistics"""
        mock_response = MagicMock()
        mock_response.data = [
            {"mood_type": "happy", "count": 10},
            {"mood_type": "sad", "count": 5}
        ]
        
        mood_service.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        result = await mood_service.get_mood_stats("user-123")
        
        assert result is not None


class TestMoodSchemas:
    """Test suite for Mood schemas"""

    @pytest.mark.unit
    def test_mood_entry_create_schema(self):
        """Test MoodEntryCreate schema validation"""
        from app.schemas.mood import MoodEntryCreate
        
        mood_data = {
            "mood": "happy",
            "note": "Feeling great!"
        }
        
        mood = MoodEntryCreate(**mood_data)
        
        assert mood.mood == "happy"
        assert mood.note == "Feeling great!"

    @pytest.mark.unit
    def test_mood_entry_create_without_note(self):
        """Test MoodEntryCreate schema without optional note"""
        from app.schemas.mood import MoodEntryCreate
        
        mood_data = {
            "mood": "sad"
        }
        
        mood = MoodEntryCreate(**mood_data)
        
        assert mood.mood == "sad"
        assert mood.note is None

    @pytest.mark.unit
    def test_mood_stats_schema(self):
        """Test MoodStats schema"""
        from app.schemas.mood import MoodStats
        
        stats_data = {
            "total_entries": 10,
            "mood_distribution": {"happy": 5, "sad": 3},
            "average_mood": "happy",
            "streak_days": 3,
            "weekly_data": []
        }
        
        stats = MoodStats(**stats_data)
        
        assert stats.total_entries == 10
        assert stats.streak_days == 3