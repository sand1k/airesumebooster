"""Resume models module"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class ResumeBase(BaseModel):
    userId: str = Field(alias="user_id")
    fileUrl: str = Field(alias="file_url")
    suggestionsPath: Optional[str] = Field(None, alias="suggestions_path")

    class Config:
        populate_by_name = True
        from_attributes = True
        json_encoders = {datetime: lambda v: v.isoformat()}

class ResumeCreate(ResumeBase):
    pass

class Resume(ResumeBase):
    id: str
    uploadedAt: datetime = Field(alias="uploaded_at")

    class Config:
        populate_by_name = True
        from_attributes = True
        json_encoders = {datetime: lambda v: v.isoformat()}

class SuggestionResponse(BaseModel):
    resumeId: str = Field(alias="resume_id")
    suggestions: str
    createdAt: datetime = Field(alias="created_at")

    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()} 