from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os
from pathlib import Path

# Load environment variables first
from .env import PROJECT_ROOT, ENVIRONMENT, IS_DEVELOPMENT

from .routes import auth_router, resumes_router
from .config import API_PREFIX, PROJECT_NAME
from .firebase import initialize_firebase
from .storage import get_storage

# Initialize Firebase Admin SDK
initialize_firebase()

# Initialize Firebase Storage (this will create the singleton instance)
storage = get_storage()

app = FastAPI(
    title=PROJECT_NAME,
    openapi_url=f"{API_PREFIX}/openapi.json",
    docs_url=f"{API_PREFIX}/docs",
    redoc_url=f"{API_PREFIX}/redoc",
)

# Configure CORS based on environment
origins = ["http://localhost:5000"] if IS_DEVELOPMENT else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(
    auth_router,
    prefix=f"{API_PREFIX}/auth",
    tags=["auth"]
)

app.include_router(
    resumes_router,
    prefix=f"{API_PREFIX}/resumes",
    tags=["resumes"]
)

@app.get("/healthcheck")
async def root():
    return {"status": "healthy", "environment": ENVIRONMENT}

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

# In production, serve static files
if IS_DEVELOPMENT:
    static_dir = PROJECT_ROOT / "dist" / "public"
    if not static_dir.exists():
        raise RuntimeError(f"Static directory '{static_dir}' does not exist. Please run 'npm run build' first.")
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static") 