from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    """User model"""
    id: str
    email: str
    name: Optional[str] = None
    photo_url: Optional[str] = None
    firebase_id: str 