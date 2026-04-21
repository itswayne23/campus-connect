import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from app.services.gamification_service import GamificationService


class TestGamificationService:
    """Test suite for GamificationService"""

    @pytest.fixture
    def gamification_service(self, mock_supabase_client):
        """Create GamificationService with mocked Supabase client"""
        with patch('app.services.gamification_service.get_supabase', return_value=mock_supabase_client):
            with patch('app.services.gamification_service.get_service_client', return_value=mock_supabase_client):
                service = GamificationService()
                service.supabase = mock_supabase_client
                return service

    @pytest.mark.unit
    def test_gamification_service_initialization(self, gamification_service):
        """Test that GamificationService initializes correctly"""
        assert gamification_service is not None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_user_stats(self, gamification_service):
        """Test get_user_stats returns user statistics"""
        mock_response = MagicMock()
        mock_response.data = [{
            "user_id": "user-123",
            "username": "testuser",
            "total_points": 100,
            "level": 2,
            "posts_count": 10,
            "likes_received": 50,
            "comments_count": 25,
            "followers_count": 15,
            "achievements_count": 3
        }]
        
        gamification_service.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        result = await gamification_service.get_user_stats("user-123")
        
        assert result is not None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_update_points(self, gamification_service):
        """Test update_points adds points to user"""
        mock_response = MagicMock()
        mock_response.data = [{"user_id": "user-123", "points": 110}]
        
        gamification_service.supabase.table.return_value.upsert.return_value.execute.return_value = mock_response
        
        result = await gamification_service.update_points("user-123", 10, "create_post")
        
        assert result is not None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_leaderboard(self, gamification_service):
        """Test get_leaderboard returns top users"""
        mock_response = MagicMock()
        mock_response.data = [
            {"user_id": "user-1", "username": "user1", "total_points": 1000, "level": 5},
            {"user_id": "user-2", "username": "user2", "total_points": 900, "level": 4}
        ]
        
        gamification_service.supabase.table.return_value.select.return_value.order.return_value.limit.return_value.execute.return_value = mock_response
        
        result = await gamification_service.get_leaderboard(limit=10)
        
        assert isinstance(result, list)
        assert len(result) == 2

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_check_achievements(self, gamification_service):
        """Test check_achievements returns unlocked achievements"""
        mock_response = MagicMock()
        mock_response.data = []
        
        gamification_service.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        result = await gamification_service.check_achievements("user-123")
        
        assert result is not None


class TestGamificationSchemas:
    """Test suite for Gamification schemas"""

    @pytest.mark.unit
    def test_user_stats_response_schema(self):
        """Test UserStatsResponse schema"""
        from app.schemas.gamification import UserStatsResponse
        
        stats_data = {
            "user_id": "user-123",
            "username": "testuser",
            "total_points": 100,
            "current_streak": 5,
            "longest_streak": 10,
            "posts_count": 10,
            "likes_received": 50,
            "comments_count": 25,
            "followers_count": 15,
            "achievements_count": 3,
            "rank": 1,
            "level": 2
        }
        
        stats = UserStatsResponse(**stats_data)
        
        assert stats.user_id == "user-123"
        assert stats.total_points == 100
        assert stats.level == 2

    @pytest.mark.unit
    def test_leaderboard_entry_schema(self):
        """Test LeaderboardEntry schema"""
        from app.schemas.gamification import LeaderboardEntry
        
        entry_data = {
            "rank": 1,
            "user_id": "user-1",
            "username": "testuser",
            "total_points": 1000,
            "current_streak": 5
        }
        
        entry = LeaderboardEntry(**entry_data)
        
        assert entry.user_id == "user-1"
        assert entry.rank == 1

    @pytest.mark.unit
    def test_achievement_response_schema(self):
        """Test AchievementResponse schema"""
        from app.schemas.gamification import AchievementResponse
        
        achievement_data = {
            "id": "achievement-1",
            "name": "First Post",
            "description": "Create your first post",
            "icon": "🏆",
            "category": "posts",
            "points_required": 10,
            "badge_type": "bronze",
            "created_at": "2024-01-01T00:00:00Z"
        }
        
        achievement = AchievementResponse(**achievement_data)
        
        assert achievement.id == "achievement-1"
        assert achievement.name == "First Post"

    @pytest.mark.unit
    def test_leaderboard_response_schema(self):
        """Test LeaderboardResponse schema"""
        from app.schemas.gamification import LeaderboardResponse, LeaderboardEntry
        
        entry = LeaderboardEntry(rank=1, user_id="u1", username="user1", total_points=100, current_streak=5)
        
        response_data = {
            "entries": [entry],
            "user_rank": 1,
            "time_period": "weekly"
        }
        
        response = LeaderboardResponse(**response_data)
        
        assert len(response.entries) == 1
        assert response.user_rank == 1