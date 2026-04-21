import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from app.services.follow_service import FollowService


class TestFollowService:
    """Test suite for FollowService"""

    @pytest.fixture
    def follow_service(self, mock_supabase_client):
        """Create FollowService with mocked Supabase client"""
        with patch('app.services.follow_service.get_supabase', return_value=mock_supabase_client):
            with patch('app.services.follow_service.get_service_client', return_value=mock_supabase_client):
                service = FollowService()
                service.supabase = mock_supabase_client
                return service

    @pytest.mark.unit
    def test_follow_service_initialization(self, follow_service):
        """Test that FollowService initializes correctly"""
        assert follow_service is not None
        assert hasattr(follow_service, 'supabase')

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_follow_user(self, follow_service):
        """Test follow_user creates follow"""
        mock_response = MagicMock()
        mock_response.data = []
        
        follow_service.supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_response
        
        result = await follow_service.follow_user("user-123", "user-456")
        
        assert result["success"] is True

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_follow_user_cannot_follow_self(self, follow_service):
        """Test follow_user fails when trying to follow self"""
        result = await follow_service.follow_user("user-id", "user-id")
        
        assert result["success"] is False
        assert "Cannot follow yourself" in result["message"]

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_unfollow_user(self, follow_service):
        """Test unfollow_user removes follow"""
        result = await follow_service.unfollow_user("user-123", "user-456")
        
        assert result["success"] is True

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_followers(self, follow_service, mock_user_data):
        """Test get_followers returns followers"""
        mock_response = MagicMock()
        mock_response.data = [mock_user_data]
        
        follow_service.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        result = await follow_service.get_followers("user-123", limit=10)
        
        assert isinstance(result, list)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_following(self, follow_service, mock_user_data):
        """Test get_following returns following users"""
        mock_response = MagicMock()
        mock_response.data = [mock_user_data]
        
        follow_service.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        result = await follow_service.get_following("user-123", limit=10)
        
        assert isinstance(result, list)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_followers_count(self, follow_service):
        """Test get_followers_count returns count"""
        mock_response = MagicMock()
        mock_response.count = 100
        
        follow_service.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        result = await follow_service.get_followers_count("user-123")
        
        assert result == 100

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_following_count(self, follow_service):
        """Test get_following_count returns count"""
        mock_response = MagicMock()
        mock_response.count = 50
        
        follow_service.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        result = await follow_service.get_following_count("user-123")
        
        assert result == 50