import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from app.services.message_service import MessageService


class TestMessageService:
    """Test suite for MessageService"""

    @pytest.fixture
    def message_service(self, mock_supabase_client):
        """Create MessageService with mocked Supabase client"""
        with patch('app.services.message_service.get_supabase', return_value=mock_supabase_client):
            with patch('app.services.message_service.get_service_client', return_value=mock_supabase_client):
                service = MessageService()
                service.supabase = mock_supabase_client
                return service

    @pytest.mark.unit
    def test_message_service_initialization(self, message_service):
        """Test that MessageService initializes correctly"""
        assert message_service is not None
        assert hasattr(message_service, 'supabase')

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_send_message(self, message_service, mock_message_data):
        """Test send_message creates message"""
        mock_response = MagicMock()
        mock_response.data = [mock_message_data]
        
        message_service.supabase.table.return_value.insert.return_value.execute.return_value = mock_response
        
        result = await message_service.send_message(
            sender_id="user-123",
            receiver_id="user-456",
            content="Test message"
        )
        
        assert result is not None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_conversations(self, message_service):
        """Test get_conversations returns conversation list"""
        mock_response = MagicMock()
        mock_response.data = [
            {"user_id": "user-456", "username": "user2", "last_message": "Hi", "created_at": "2024-01-01"}
        ]
        
        message_service.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        result = await message_service.get_conversations("user-123")
        
        assert isinstance(result, list)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_messages(self, message_service, mock_message_data):
        """Test get_messages returns messages between users"""
        mock_response = MagicMock()
        mock_response.data = [mock_message_data]
        
        message_service.supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_response
        
        result = await message_service.get_messages("user-123", "user-456", limit=50)
        
        assert isinstance(result, list)

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_mark_as_read(self, message_service):
        """Test mark_as_read updates message read status"""
        mock_response = MagicMock()
        mock_response.data = [{"id": "message-123"}]
        
        message_service.supabase.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        result = await message_service.mark_as_read("user-456", "user-123")
        
        assert result is not None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_delete_message(self, message_service):
        """Test delete_message removes message"""
        result = await message_service.delete_message("message-123", "user-123")
        
        assert result is not None

    @pytest.mark.unit
    @pytest.mark.asyncio
    async def test_get_unread_count(self, message_service):
        """Test get_unread_count returns unread message count"""
        mock_response = MagicMock()
        mock_response.count = 5
        
        message_service.supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_response
        
        result = await message_service.get_unread_count("user-123")
        
        assert result == 5


class TestMessageSchemas:
    """Test suite for Message schemas"""

    @pytest.mark.unit
    def test_message_create_schema(self):
        """Test MessageCreate schema validation"""
        from app.schemas.message import MessageCreate
        
        message_data = {
            "content": "Test message",
            "receiver_id": "user-456"
        }
        
        message = MessageCreate(**message_data)
        
        assert message.content == "Test message"
        assert message.receiver_id == "user-456"

    @pytest.mark.unit
    def test_message_create_with_media(self):
        """Test MessageCreate schema with media"""
        from app.schemas.message import MessageCreate
        
        message_data = {
            "content": "Message with media",
            "receiver_id": "user-456",
            "media_url": "https://example.com/image.jpg"
        }
        
        message = MessageCreate(**message_data)
        
        assert message.content == "Message with media"
        assert message.media_url == "https://example.com/image.jpg"