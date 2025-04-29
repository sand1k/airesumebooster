from typing import Optional
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth
from pydantic import BaseModel

security = HTTPBearer()

class User(BaseModel):
    uid: str
    email: str
    name: Optional[str] = None
    photo_url: Optional[str] = None
    email_verified: bool = False

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> User:
    """
    Verify Firebase ID token and return user information
    """
    try:
        # Verify the Firebase token
        token = credentials.credentials
        decoded_token = auth.verify_id_token(token)
        
        # Get additional user information
        firebase_user = auth.get_user(decoded_token['uid'])
        
        # Create User object
        user = User(
            uid=firebase_user.uid,
            email=firebase_user.email,
            name=firebase_user.display_name,
            photo_url=firebase_user.photo_url,
            email_verified=firebase_user.email_verified
        )
        
        return user
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token"
        )
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=401,
            detail="Authentication token has expired"
        )
    except auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=401,
            detail="Authentication token has been revoked"
        )
    except auth.UserNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Authentication failed: {str(e)}"
        ) 