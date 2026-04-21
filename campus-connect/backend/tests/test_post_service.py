import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from datetime import datetime, timedelta
from app.services.post_service import PostService
from app.schemas.post import PostCreate, PostUpdate, PostCategory, PostStatus, Poll, PollOption


class TestPostService:
    """Test suite for PostService"""

    @pytest.fixture
    def post_service(self, mock_supabase_client):
        """Create PostService with mocked Supabase client"""
        with patch('app.services.post_service.get_supabase', return_value=mock_supabase_client):
            with patch('app.services.post_service.get_service_client', return_value=mock_supabase_client):
                service = PostService()
                service.supabase = mock_supabase_client
                return service

    @pytest.mark.unit
    def test_post_service_initialization(self, post_service):
        """Test that PostService initializes correctly"""
        assert post_service is not None
        assert hasattr(post_service, 'supabase')

    @pytest.mark.unit
    def test_generate_anonymous_name(self, post_service):
        """Test anonymous name generation"""
        name = post_service._generate_anonymous_name()
        assert name is not None
        assert " " in name
        assert any(emoji in name for emoji in ["🦊", "🦉", "🐼", "🦅", "🐰", "🐯", "🐺", "🐬", "🦇", "🐻", "🐱", "🦌", "🐲", "🐧", "🐍"])

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_post_by_id(self, post_service, mock_post_data):
        """Test get_post_by_id returns post"""
        mock_response = MagicMock()
        mock_response.data = [mock_post_data]
        
        post_service.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        with patch.object(post_service, '_build_post_response', new_callable=AsyncMock, return_value=mock_post_data):
            result = await post_service.get_post_by_id("post-123", "user-123")
        
        assert result is not None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_post_by_id_returns_none_for_invalid_id(self, post_service):
        """Test get_post_by_id returns None for invalid post ID"""
        mock_response = MagicMock()
        mock_response.data = []
        
        post_service.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        result = await post_service.get_post_by_id("invalid-id")
        assert result is None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_feed(self, post_service, mock_post_data):
        """Test get_feed returns posts"""
        mock_response = MagicMock()
        mock_response.data = [mock_post_data]
        
        post_service.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        with patch.object(post_service, '_build_post_response', new_callable=AsyncMock, return_value=mock_post_data):
            result = await post_service.get_feed("user-123", limit=10)
        
        assert isinstance(result, list)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_explore_feed(self, post_service, mock_post_data):
        """Test get_explore_feed returns posts"""
        mock_response = MagicMock()
        mock_response.data = [mock_post_data]
        
        post_service.supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = mock_response
        
        with patch.object(post_service, '_build_post_response', new_callable=AsyncMock, return_value=mock_post_data):
            result = await post_service.get_explore_feed(limit=10)
        
        assert isinstance(result, list)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_like_post(self, post_service):
        """Test like_post adds like"""
        mock_response = MagicMock()
        mock_response.data = []
        
        post_service.supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_response
        
        result = await post_service.like_post("post-123", "user-123")
        
        assert result is not None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_unlike_post(self, post_service):
        """Test unlike_post removes like"""
        result = await post_service.unlike_post("post-123", "user-123")
        
        assert result is not None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_is_post_liked(self, post_service):
        """Test is_post_liked returns True when liked"""
        mock_response = MagicMock()
        mock_response.data = [{"post_id": "post-123", "user_id": "user-123"}]
        
        post_service.supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_response
        
        result = await post_service.is_post_liked("post-123", "user-123")
        assert result is True

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_is_post_liked_returns_false(self, post_service):
        """Test is_post_liked returns False when not liked"""
        mock_response = MagicMock()
        mock_response.data = []
        
        post_service.supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_response
        
        result = await post_service.is_post_liked("post-123", "user-123")
        assert result is False

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_bookmark_post(self, post_service):
        """Test bookmark_post adds bookmark"""
        mock_response = MagicMock()
        mock_response.data = []
        
        post_service.supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_response
        
        result = await post_service.bookmark_post("post-123", "user-123")
        
        assert result is not None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_unbookmark_post(self, post_service):
        """Test unbookmark_post removes bookmark"""
        result = await post_service.unbookmark_post("post-123", "user-123")
        
        assert result is not None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_is_post_bookmarked(self, post_service):
        """Test is_post_bookmarked returns True when bookmarked"""
        mock_response = MagicMock()
        mock_response.data = [{"post_id": "post-123", "user_id": "user-123"}]
        
        post_service.supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_response
        
        result = await post_service.is_post_bookmarked("post-123", "user-123")
        assert result is True

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_delete_post(self, post_service):
        """Test delete_post deletes post"""
        result = await post_service.delete_post("post-123", "user-123")
        
        assert result is not None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_user_posts(self, post_service, mock_post_data):
        """Test get_user_posts returns user's posts"""
        mock_response = MagicMock()
        mock_response.data = [mock_post_data]
        
        post_service.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        with patch.object(post_service, '_build_post_response', new_callable=AsyncMock, return_value=mock_post_data):
            result = await post_service.get_user_posts("user-123", limit=10)
        
        assert isinstance(result, list)


class TestPostSchemas:
    """Test suite for Post schemas"""

    @pytest.mark.unit
    def test_post_create_schema(self):
        """Test PostCreate schema validation"""
        post_data = {
            "content": "Test post content",
            "is_anonymous": False,
            "category": "general"
        }
        
        post = PostCreate(**post_data)
        
        assert post.content == "Test post content"
        assert post.is_anonymous is False

    @pytest.mark.unit
    def test_post_create_with_poll(self):
        """Test PostCreate schema with poll"""
        poll = Poll(
            question="What's your favorite color?",
            options=[
                PollOption(text="Red"),
                PollOption(text="Blue"),
                PollOption(text="Green")
            ],
            expires_at=datetime.now() + timedelta(days=1)
        )
        
        post_data = {
            "content": "Poll test",
            "poll": poll
        }
        
        post = PostCreate(**post_data)
        
        assert post.poll is not None
        assert post.poll.question == "What's your favorite color?"
        assert len(post.poll.options) == 3

    @pytest.mark.unit
    def test_post_status_values(self):
        """Test PostStatus enum values"""
        assert PostStatus.APPROVED.value == "approved"
        assert PostStatus.PENDING.value == "pending"
        assert PostStatus.REJECTED.value == "rejected"

    @pytest.mark.unit
    def test_post_category_values(self):
        """Test PostCategory enum values"""
        from app.schemas.post import PostCategory
        
        assert PostCategory.GENERAL.value == "general"
        assert PostCategory.COMPLAINT.value == "complaint"
        assert PostCategory.SUGGESTION.value == "suggestion"
        assert PostCategory.EXPERIENCE.value == "experience"
        assert PostCategory.QNA.value == "qna"