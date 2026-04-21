import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from app.services.user_service import UserService
from app.schemas.user import UserCreate, UserUpdate


class TestUserService:
    """Test suite for UserService"""

    @pytest.fixture
    def user_service(self, mock_supabase_client):
        """Create UserService with mocked Supabase client"""
        with patch('app.services.user_service.get_supabase', return_value=mock_supabase_client):
            with patch('app.services.user_service.get_service_client', return_value=mock_supabase_client):
                service = UserService()
                service.supabase = mock_supabase_client
                return service

    @pytest.mark.unit
    def test_user_service_initialization(self, user_service):
        """Test that UserService initializes correctly"""
        assert user_service is not None
        assert hasattr(user_service, 'supabase')

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_user_by_id_returns_user(self, user_service, mock_user_data):
        """Test get_user_by_id returns user data"""
        mock_response = MagicMock()
        mock_response.data = [mock_user_data]
        
        user_service.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        with patch.object(user_service, 'get_followers_count', new_callable=AsyncMock, return_value=10):
            with patch.object(user_service, 'get_following_count', new_callable=AsyncMock, return_value=5):
                with patch.object(user_service, 'get_user_posts_count', new_callable=AsyncMock, return_value=20):
                    with patch.object(user_service, 'is_following', new_callable=AsyncMock, return_value=False):
                        result = await user_service.get_user_by_id("user-123")
        
        assert result is not None
        assert result["id"] == "user-123"

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_user_by_id_returns_none_for_invalid_id(self, user_service):
        """Test get_user_by_id returns None for invalid user ID"""
        mock_response = MagicMock()
        mock_response.data = []
        
        user_service.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        result = await user_service.get_user_by_id("invalid-id")
        assert result is None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_search_users(self, user_service, mock_user_data):
        """Test search_users returns matching users"""
        mock_response = MagicMock()
        mock_response.data = [mock_user_data]
        
        user_service.supabase.table.return_value.select.return_value.ilike.return_value.execute.return_value = mock_response
        
        with patch.object(user_service, '_build_user_response', new_callable=AsyncMock, return_value=mock_user_data):
            result = await user_service.search_users("test", "current-user-id")
        
        assert isinstance(result, list)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_followers_count(self, user_service):
        """Test get_followers_count returns correct count"""
        mock_response = MagicMock()
        mock_response.count = 10
        
        user_service.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        result = await user_service.get_followers_count("user-123")
        assert result == 10

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_following_count(self, user_service):
        """Test get_following_count returns correct count"""
        mock_response = MagicMock()
        mock_response.count = 5
        
        user_service.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        result = await user_service.get_following_count("user-123")
        assert result == 5

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_is_following_returns_true(self, user_service):
        """Test is_following returns True when following"""
        mock_response = MagicMock()
        mock_response.data = [{"follower_id": "user-1", "following_id": "user-2"}]
        
        user_service.supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_response
        
        result = await user_service.is_following("user-1", "user-2")
        assert result is True

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_is_following_returns_false(self, user_service):
        """Test is_following returns False when not following"""
        mock_response = MagicMock()
        mock_response.data = []
        
        user_service.supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_response
        
        result = await user_service.is_following("user-1", "user-2")
        assert result is False

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_block_user(self, user_service):
        """Test block_user adds block"""
        user_service.supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
        
        result = await user_service.block_user("blocker-id", "blocked-id")
        
        assert result["success"] is True

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_block_user_cannot_block_self(self, user_service):
        """Test block_user fails when trying to block self"""
        result = await user_service.block_user("user-id", "user-id")
        
        assert result["success"] is False
        assert "Cannot block yourself" in result["error"]

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_unblock_user(self, user_service):
        """Test unblock_user removes block"""
        result = await user_service.unblock_user("blocker-id", "blocked-id")
        
        assert result["success"] is True

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_mute_user(self, user_service):
        """Test mute_user adds mute"""
        user_service.supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
        
        result = await user_service.mute_user("muter-id", "muted-id")
        
        assert result["success"] is True

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_mute_user_cannot_mute_self(self, user_service):
        """Test mute_user fails when trying to mute self"""
        result = await user_service.mute_user("user-id", "user-id")
        
        assert result["success"] is False
        assert "Cannot mute yourself" in result["error"]

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_unmute_user(self, user_service):
        """Test unmute_user removes mute"""
        result = await user_service.unmute_user("muter-id", "muted-id")
        
        assert result["success"] is True


class TestUserSchemas:
    """Test suite for User schemas"""

    @pytest.mark.unit
    def test_user_create_schema(self):
        """Test UserCreate schema validation"""
        user_data = {
            "email": "test@example.com",
            "username": "testuser",
            "password": "TestPass123!"
        }
        
        user = UserCreate(**user_data)
        
        assert user.email == "test@example.com"
        assert user.username == "testuser"
        assert user.password == "TestPass123!"

    @pytest.mark.unit
    def test_user_update_schema(self):
        """Test UserUpdate schema validation"""
        user_data = {
            "bio": "Updated bio",
            "university": "New University"
        }
        
        user = UserUpdate(**user_data)
        
        assert user.bio == "Updated bio"
        assert user.university == "New University"

    @pytest.mark.unit
    def test_user_update_schema_optional_fields(self):
        """Test UserUpdate schema allows optional fields"""
        user = UserUpdate()
        
        assert user.bio is None
        assert user.university is None
        assert user.avatar_url is None
