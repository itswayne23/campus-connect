import pytest
from datetime import datetime, timedelta
from jose import jwt


class TestSecurity:
    """Test suite for security functions"""

    @pytest.mark.unit
    def test_password_hashing(self):
        """Test password hashing works"""
        from app.core.security import get_password_hash
        
        password = "TestPassword123"
        hashed = get_password_hash(password)
        
        assert hashed is not None
        assert hashed != password
        assert len(hashed) > 0

    @pytest.mark.unit
    def test_password_verification(self):
        """Test password verification works"""
        from app.core.security import get_password_hash, verify_password
        
        password = "TestPassword123"
        hashed = get_password_hash(password)
        
        assert verify_password(password, hashed) is True
        assert verify_password("WrongPassword", hashed) is False

    @pytest.mark.unit
    def test_create_access_token(self):
        """Test access token creation"""
        from app.core.security import create_access_token
        
        data = {"sub": "user-123"}
        token = create_access_token(data)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0

    @pytest.mark.unit
    def test_create_refresh_token(self):
        """Test refresh token creation"""
        from app.core.security import create_refresh_token
        
        data = {"sub": "user-123"}
        token = create_refresh_token(data)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0

    @pytest.mark.unit
    def test_decode_token(self):
        """Test token decoding"""
        from app.core.security import create_access_token, decode_token
        
        data = {"sub": "user-123"}
        token = create_access_token(data)
        
        decoded = decode_token(token)
        
        assert decoded is not None
        assert decoded.get("sub") == "user-123"

    @pytest.mark.unit
    def test_password_hash_is_different_each_time(self):
        """Test password hashing produces different hashes"""
        from app.core.security import get_password_hash, verify_password
        
        password = "TestPassword123"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        
        assert hash1 != hash2
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True