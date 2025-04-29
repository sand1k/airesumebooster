from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os
from pathlib import Path
from .routes import auth, resumes
from .config import API_PREFIX, PROJECT_NAME
from .firebase import initialize_firebase

# Get the project root directory (2 levels up from this file)
PROJECT_ROOT = Path(__file__).parent.parent.parent.resolve()

# Initialize Firebase Admin SDK
initialize_firebase()

app = FastAPI(
    title=PROJECT_NAME,
    openapi_url=f"{API_PREFIX}/openapi.json",
    docs_url=f"{API_PREFIX}/docs",
    redoc_url=f"{API_PREFIX}/redoc",
)

# Configure CORS based on environment
origins = ["http://localhost:5000"] if os.getenv("ENVIRONMENT") == "development" else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(
    auth.router,
    prefix=f"{API_PREFIX}/auth",
    tags=["auth"]
)

app.include_router(
    resumes.router,
    prefix=f"{API_PREFIX}/resumes",
    tags=["resumes"]
)

@app.get("/healthcheck")
async def root():
    return {"status": "healthy", "environment": os.getenv("ENVIRONMENT", "unknown")}

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

# In production, serve static files
if os.getenv("ENVIRONMENT") == "production":
    static_dir = PROJECT_ROOT / "dist" / "public"
    if not static_dir.exists():
        raise RuntimeError(f"Static directory '{static_dir}' does not exist. Please run 'npm run build' first.")
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static") 