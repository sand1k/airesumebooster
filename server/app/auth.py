from typing import Optional
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth
from .models import User

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> User:
    """
    Get the current user from the Firebase ID token
    """
    try:
        # Verify the Firebase ID token
        token = credentials.credentials
        decoded_token = auth.verify_id_token(token)
        
        # Get the user from Firebase
        firebase_user = auth.get_user(decoded_token['uid'])
        
        # Convert to our User model
        return User(
            id=firebase_user.uid,
            email=firebase_user.email or "",
            name=firebase_user.display_name or "",
            photo_url=firebase_user.photo_url,
            email_verified=firebase_user.email_verified
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid authentication credentials: {str(e)}"
        ) 