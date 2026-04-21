import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from app.services.notification_service import NotificationService


class TestNotificationService:
    """Test suite for NotificationService"""

    @pytest.fixture
    def notification_service(self, mock_supabase_client):
        """Create NotificationService with mocked Supabase client"""
        with patch('app.services.notification_service.get_supabase', return_value=mock_supabase_client):
            with patch('app.services.notification_service.get_service_client', return_value=mock_supabase_client):
                service = NotificationService()
                service.supabase = mock_supabase_client
                return service

    @pytest.mark.unit
    def test_notification_service_initialization(self, notification_service):
        """Test that NotificationService initializes correctly"""
        assert notification_service is not None
        assert hasattr(notification_service, 'supabase')

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_create_notification(self, notification_service):
        """Test create_notification creates notification"""
        mock_response = MagicMock()
        mock_response.data = [{"id": "notif-123"}]
        
        notification_service.supabase.table.return_value.insert.return_value.execute.return_value = mock_response
        
        result = await notification_service.create_notification(
            user_id="user-123",
            notification_type="like",
            actor_id="user-456",
            post_id="post-123"
        )
        
        assert result is not None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_notifications(self, notification_service, mock_notification_data):
        """Test get_notifications returns notifications"""
        mock_response = MagicMock()
        mock_response.data = [mock_notification_data]
        
        notification_service.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        result = await notification_service.get_notifications("user-123", limit=20)
        
        assert isinstance(result, list)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_mark_as_read(self, notification_service):
        """Test mark_as_read updates notification read status"""
        result = await notification_service.mark_as_read("notif-123")
        
        assert result is not None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_mark_all_as_read(self, notification_service):
        """Test mark_all_as_read updates all notifications"""
        result = await notification_service.mark_all_as_read("user-123")
        
        assert result is not None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_delete_notification(self, notification_service):
        """Test delete_notification removes notification"""
        result = await notification_service.delete_notification("notif-123")
        
        assert result is not None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_unread_count(self, notification_service):
        """Test get_unread_count returns unread count"""
        mock_response = MagicMock()
        mock_response.count = 10
        
        notification_service.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        result = await notification_service.get_unread_count("user-123")
        
        assert result == 10
    
    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_notification_types(self, notification_service):
        """Test notification types are defined"""
        from app.services.notification_service import NotificationType
        
        assert NotificationType.LIKE.value == "like"
        assert NotificationType.COMMENT.value == "comment"
        assert NotificationType.FOLLOW.value == "follow"
        assert NotificationType.MENTION.value == "mention"