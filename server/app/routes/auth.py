from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from ..auth import get_current_user, User
from firebase_admin import auth

router = APIRouter()

class UserRegistration(BaseModel):
    email: str
    name: str
    photo_url: Optional[str] = None
    firebase_id: str

@router.post("/register")
async def register_user(user_data: UserRegistration):
    """
    Register a new user after successful Firebase authentication
    """
    try:
        # Verify the Firebase user exists
        firebase_user = auth.get_user(user_data.firebase_id)
        
        # Here you would typically save the user to your database
        # For now, we'll just return the user info
        return {
            "id": firebase_user.uid,
            "email": firebase_user.email,
            "name": firebase_user.display_name,
            "photo_url": firebase_user.photo_url,
            "email_verified": firebase_user.email_verified
        }
    except auth.UserNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Firebase user not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current user information
    """
    return current_user

@router.post("/verify-token")
async def verify_token(current_user: User = Depends(get_current_user)):
    """
    Verify the Firebase ID token
    """
    return {"valid": True, "user": current_user} 