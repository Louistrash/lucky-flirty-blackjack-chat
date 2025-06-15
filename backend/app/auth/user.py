"""FastAPI dependency to extract user that has been authenticated by middleware.

Usage:

    from app.auth import AuthorizedUser

    @router.get("/example-data")
    def get_example_data(user: AuthorizedUser):
        return example_read_data_for_user(userId=user.sub)
"""

from typing import Annotated, Optional
from fastapi import Depends, HTTPException, Request
from pydantic import BaseModel

class User(BaseModel):
    """User model for authentication"""
    sub: str  # User ID
    email: Optional[str] = None
    name: Optional[str] = None

def get_authorized_user(request: Request) -> User:
    """
    Extract user from request headers or Firebase auth.
    For development, this can be simplified.
    """
    # For now, return a mock user for development
    # In production, this should validate Firebase auth tokens
    return User(
        sub="dev-user-123",
        email="dev@example.com", 
        name="Development User"
    )

AuthorizedUser = Annotated[User, Depends(get_authorized_user)]
