from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from firebase_admin import auth
from typing import List
import uuid
from datetime import datetime, timezone, timedelta
from ..models import Resume, SuggestionResponse, User
from ..storage import FirebaseStorage, get_storage
from ..auth import get_current_user
from ..openai_client import analyze_resume
import traceback

router = APIRouter()

@router.post("/upload", response_model=Resume)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    storage: FirebaseStorage = Depends(get_storage)
):
    """
    Upload a resume PDF and get improvement suggestions.
    """
    try:
        # Validate file type
        print(f"Received file: {file.filename}, content_type: {file.content_type}")
        if file.content_type != "application/pdf":
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")
        
        # Read file content
        print("Reading file content...")
        content = await file.read()
        print(f"File size: {len(content)} bytes")
        
        try:
            # Upload PDF to Firebase Storage
            print("Uploading to Firebase Storage...")
            file_url, resume_id = await storage.upload_pdf(content, current_user.id)
            print(f"File uploaded successfully: {file_url}")
        except Exception as e:
            print(f"Firebase Storage upload error: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(status_code=500, detail=f"Failed to upload file to storage: {str(e)}")
        
        # Create resume record
        resume = Resume(
            id=resume_id,
            userId=current_user.id,
            fileUrl=file_url,
            uploadedAt=datetime.now(timezone.utc)
        )
        
        try:
            # Analyze resume and get suggestions
            print("Analyzing resume with OpenAI...")
            suggestions = await analyze_resume(content)
            print("Resume analysis complete")
        except Exception as e:
            print(f"OpenAI analysis error: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            # Don't fail the upload if analysis fails
            suggestions = ""
        
        try:
            # Upload suggestions to Firebase Storage
            print("Uploading suggestions...")
            suggestions_path = await storage.upload_suggestions(suggestions, resume_id, current_user.id)
            resume.suggestionsPath = suggestions_path
            print("Suggestions uploaded successfully")
        except Exception as e:
            print(f"Suggestions upload error: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            # Don't fail if suggestions upload fails
            resume.suggestionsPath = None
        
        return resume
        
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"Unexpected error in upload_resume: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail={
                "message": "An unexpected error occurred while processing your resume",
                "error": str(e)
            }
        )

@router.get("/{resume_id}/suggestions", response_model=SuggestionResponse)
async def get_suggestions(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    storage: FirebaseStorage = Depends(get_storage)
):
    """
    Get improvement suggestions for a specific resume.
    """
    try:
        print(f"Fetching suggestions for resume {resume_id}")
        
        # List all blobs in the suggestions directory for this user and resume
        print(f"Listing blobs in suggestions/{current_user.id}/{resume_id}/")
        blobs = list(storage.bucket.list_blobs(prefix=f"suggestions/{current_user.id}/{resume_id}/"))
        
        if not blobs:
            print(f"No suggestions found for resume {resume_id}")
            raise HTTPException(status_code=404, detail="Suggestions not found")
        
        # Sort blobs by name (which includes timestamp) to get the latest
        blobs.sort(key=lambda b: b.name, reverse=True)
        blob = blobs[0]
        print(f"Found suggestion at: {blob.name}")
            
        # Read and parse suggestions
        try:
            suggestions_str = blob.download_as_string().decode('utf-8')
            
            return SuggestionResponse(
                resumeId=resume_id,
                suggestions=suggestions_str,
                createdAt=datetime.now(timezone.utc)
            )
        except Exception as e:
            print(f"Error reading suggestions: {str(e)}")
            print(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to read suggestions: {str(e)}"
            )
        
    except HTTPException as he:
        raise
    except Exception as e:
        print(f"Error in get_suggestions: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch suggestions: {str(e)}"
        )

@router.get("/user/{user_id}", response_model=List[Resume])
async def get_user_resumes(
    user_id: str,
    current_user: User = Depends(get_current_user),
    storage: FirebaseStorage = Depends(get_storage)
):
    """
    Get all resumes for a specific user.
    """
    # Ensure user can only access their own resumes
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access these resumes")
        
    try:
        # List all resumes in the user's directory
        print(f"Listing resumes for user {user_id}")
        blobs = storage.bucket.list_blobs(prefix=f"resumes/{user_id}/")
        
        resumes = []
        for blob in blobs:
            print(f"Processing blob: {blob.name}")
            resume_id = blob.name.split('/')[-1].replace('.pdf', '')
            try:
                # Try to make the blob public first
                blob.make_public()
                file_url = blob.public_url
                print(f"Generated public URL: {file_url}")
            except Exception as e:
                print(f"Error making blob public: {str(e)}, falling back to signed URL")
                # Fall back to signed URL if making public fails
                file_url = blob.generate_signed_url(
                    version="v4",
                    expiration=datetime.now(timezone.utc) + timedelta(days=7),
                    method="GET"
                )
                print(f"Generated signed URL: {file_url}")
            
            resume = Resume(
                id=resume_id,
                userId=user_id,
                fileUrl=file_url,
                uploadedAt=blob.time_created,
                suggestionsPath=f"suggestions/{user_id}/{resume_id}"
            )
            print(f"Created resume object: {resume.model_dump_json()}")
            resumes.append(resume)
            
        print(f"Returning {len(resumes)} resumes")
        return resumes
        
    except Exception as e:
        print(f"Error in get_user_resumes: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e)) 