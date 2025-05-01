"""User model module"""
from pydantic import BaseModel, Field
from typing import Optional

class User(BaseModel):
    id: str
    email: str
    name: str
    photoUrl: Optional[str] = Field(None, alias="photo_url")
    emailVerified: bool = Field(False, alias="email_verified")

    class Config:
        populate_by_name = True
        json_schema_extra = {"examples": [{"id": "123", "email": "user@example.com", "name": "User"}]} 