import pytest
import sys
import os
from unittest.mock import MagicMock, AsyncMock
from typing import Dict, Any

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def create_mock_response(data=None, count=0):
    """Helper to create mock response"""
    response = MagicMock()
    response.data = data if data is not None else []
    response.count = count
    return response


def create_mock_execute():
    """Helper to create execute mock that returns response"""
    def execute():
        return create_mock_response()
    return execute


@pytest.fixture
def mock_supabase_client():
    """Create a mock Supabase client"""
    client = MagicMock()
    
    client.auth = MagicMock()
    client.auth.admin = MagicMock()
    client.auth.sign_in_with_password = MagicMock()
    client.auth.sign_out = MagicMock()
    
    def table_side_effect(name):
        mock_table = MagicMock()
        
        select_mock = MagicMock()
        
        def select_side_effect(*args, **kwargs):
            select_result = MagicMock()
            
            def execute_side_effect(*args, **kwargs):
                return create_mock_response()
            
            select_result.execute = execute_side_effect
            
            eq_mock = MagicMock()
            def eq_side_effect(*args, **kwargs):
                eq_result = MagicMock()
                eq_result.execute = execute_side_effect
                return eq_result
            eq_mock.eq = eq_side_effect
            
            ilike_mock = MagicMock()
            def ilike_side_effect(*args, **kwargs):
                return create_mock_response()
            ilike_mock.ilike = lambda x: create_mock_response()
            
            select_result.eq = eq_side_effect()
            return select_result
        
        select_mock.select = select_side_effect
        
        insert_mock = MagicMock()
        def insert_side_effect(*args, **kwargs):
            return MagicMock(execute=lambda: create_mock_response([{"id": "test-id"}]))
        insert_mock.insert = insert_side_effect
        
        update_mock = MagicMock()
        def update_side_effect(*args, **kwargs):
            return MagicMock(execute=lambda: create_mock_response())
        update_mock.update = update_side_effect
        
        delete_mock = MagicMock()
        def delete_side_effect(*args, **kwargs):
            return MagicMock(execute=lambda: create_mock_response())
        delete_mock.delete = lambda *args, **kwargs: MagicMock(execute=lambda: create_mock_response())
        
        mock_table.select = lambda *args, **kwargs: MagicMock(
            execute=lambda: create_mock_response()
        )
        mock_table.insert = lambda *args, **kwargs: MagicMock(
            execute=lambda: create_mock_response([{"id": "test-id"}])
        )
        mock_table.update = lambda *args, **kwargs: MagicMock(
            execute=lambda: create_mock_response()
        )
        mock_table.delete = lambda *args, **kwargs: MagicMock(
            execute=lambda: create_mock_response()
        )
        
        return mock_table
    
    client.table = table_side_effect
    
    return client


@pytest.fixture
def mock_supabase_response():
    """Create a mock Supabase response factory"""
    return create_mock_response


@pytest.fixture
def mock_user_data():
    """Create mock user data"""
    return {
        "id": "user-123",
        "email": "test@example.com",
        "username": "testuser",
        "avatar_url": None,
        "bio": "Test bio",
        "university": "Test University",
        "followers_count": 10,
        "following_count": 5,
        "posts_count": 20,
        "is_following": False,
        "is_blocked": False,
        "is_muted": False,
        "is_own_profile": False,
        "created_at": "2024-01-01T00:00:00Z"
    }


@pytest.fixture
def mock_post_data():
    """Create mock post data"""
    return {
        "id": "post-123",
        "content": "Test post content",
        "author_id": "user-123",
        "author": {
            "id": "user-123",
            "username": "testuser",
            "avatar_url": None
        },
        "media_urls": [],
        "likes_count": 5,
        "comments_count": 3,
        "is_liked": False,
        "is_bookmarked": False,
        "created_at": "2024-01-01T00:00:00Z",
        "status": "approved"
    }


@pytest.fixture
def mock_message_data():
    """Create mock message data"""
    return {
        "id": "message-123",
        "sender_id": "user-123",
        "receiver_id": "user-456",
        "content": "Test message",
        "read": False,
        "created_at": "2024-01-01T00:00:00Z"
    }


@pytest.fixture
def mock_notification_data():
    """Create mock notification data"""
    return {
        "id": "notif-123",
        "user_id": "user-123",
        "type": "like",
        "actor_id": "user-456",
        "post_id": "post-123",
        "read": False,
        "created_at": "2024-01-01T00:00:00Z"
    }


@pytest.fixture
def mock_auth_user():
    """Create mock auth user"""
    user = MagicMock()
    user.id = "user-123"
    user.email = "test@example.com"
    user.user_metadata = {"username": "testuser"}
    return user


@pytest.fixture
def app_mock():
    """Create mock FastAPI app"""
    app = MagicMock()
    return app