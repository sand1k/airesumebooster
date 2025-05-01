from firebase_admin import storage
from datetime import datetime, timezone, timedelta
import uuid
from typing import Optional
import json
import traceback
from .config import STORAGE_BUCKET

class FirebaseStorage:
    _instance: Optional['FirebaseStorage'] = None
    _initialized: bool = False

    def __new__(cls) -> 'FirebaseStorage':
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if not self._initialized:
            try:
                self.bucket = storage.bucket(name=STORAGE_BUCKET)
                if not self.bucket:
                    raise ValueError("Failed to get storage bucket")
                print(f"Successfully initialized Firebase Storage bucket: {self.bucket.name}")
                self._initialized = True
            except Exception as e:
                print(f"Error initializing Firebase Storage: {str(e)}")
                print(f"Traceback: {traceback.format_exc()}")
                raise

    async def upload_pdf(self, file_content: bytes, user_id: str) -> tuple[str, str]:
        """
        Upload a PDF file to Firebase Storage.
        Returns a tuple of (public_url, resume_id).
        """
        try:
            # Generate a unique filename
            resume_id = str(uuid.uuid4())
            filename = f"resumes/{user_id}/{resume_id}.pdf"
            print(f"Uploading PDF to {filename}")
            blob = self.bucket.blob(filename)
            
            # Upload the file
            blob.upload_from_string(
                file_content,
                content_type='application/pdf'
            )
            print("File uploaded successfully, generating URL...")
            
            try:
                # Make the file publicly accessible and get URL
                blob.make_public()
                url = blob.public_url
                print(f"Generated public URL: {url}")
            except Exception as e:
                print(f"Error making blob public: {str(e)}")
                # Try to get the signed URL as fallback
                url = blob.generate_signed_url(
                    version="v4",
                    expiration=datetime.now(timezone.utc) + timedelta(days=7),
                    method="GET"
                )
                print(f"Generated signed URL: {url}")
                
            if not url:
                raise ValueError("Failed to generate URL for uploaded file")
                
            return url, resume_id
        except Exception as e:
            print(f"Error in upload_pdf: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            raise

    async def upload_suggestions(self, suggestions: str, resume_id: str, user_id: str) -> str:
        """
        Upload resume improvement suggestions to Firebase Storage.
        Returns the path to the suggestions document.
        """
        try:
            # Generate a unique ID for the suggestions file
            suggestions_id = str(uuid.uuid4())
            filename = f"suggestions/{user_id}/{resume_id}/{suggestions_id}"
            print(f"Uploading suggestions to {filename}")
            blob = self.bucket.blob(filename)
            
            # Upload suggestions as plain text
            blob.upload_from_string(
                suggestions,
                content_type='text/markdown'
            )
            
            return filename
        except Exception as e:
            print(f"Error in upload_suggestions: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            raise

    async def get_suggestions(self, suggestions_path: str) -> str:
        """
        Get resume improvement suggestions from Firebase Storage.
        Returns the suggestions as markdown text.
        """
        try:
            print(f"Getting suggestions from {suggestions_path}")
            blob = self.bucket.blob(suggestions_path)
            
            # Download suggestions as text
            suggestions = blob.download_as_string().decode('utf-8')
            return suggestions
        except Exception as e:
            print(f"Error in get_suggestions: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            raise

def get_storage() -> FirebaseStorage:
    """Get the FirebaseStorage singleton instance"""
    return FirebaseStorage() 