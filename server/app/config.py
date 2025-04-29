from pathlib import Path
import os
from dotenv import load_dotenv
from firebase_admin import credentials, initialize_app

# Load environment variables from project root
PROJECT_ROOT = Path(__file__).parent.parent.parent.resolve()
load_dotenv(PROJECT_ROOT / ".env")
load_dotenv(PROJECT_ROOT / f".env.{os.getenv('ENVIRONMENT', 'development')}")
load_dotenv(PROJECT_ROOT / ".env.local")  # Local overrides

# API Configuration
PROJECT_NAME = "AIResumeBooster API"
API_PREFIX = "/api"

# Environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
IS_DEVELOPMENT = ENVIRONMENT == "development"
IS_PRODUCTION = ENVIRONMENT == "production"

# Required environment variables
REQUIRED_ENV_VARS = [
    "FIREBASE_PRIVATE_KEY_ID",
    "FIREBASE_PRIVATE_KEY",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_CLIENT_ID",
    "FIREBASE_CLIENT_CERT_URL",
    "DATABASE_URL"
]

# Validate required environment variables
missing_vars = [var for var in REQUIRED_ENV_VARS if not os.getenv(var)]
if missing_vars:
    raise RuntimeError(f"Missing required environment variables: {', '.join(missing_vars)}")

# Firebase configuration
firebase_config = {
    "type": "service_account",
    "project_id": os.getenv("VITE_FIREBASE_PROJECT_ID"),
    "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
    "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n"),
    "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
    "client_id": os.getenv("FIREBASE_CLIENT_ID"),
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_CERT_URL")
}

# Initialize Firebase Admin
try:
    cred = credentials.Certificate(firebase_config)
    firebase_app = initialize_app(cred)
except Exception as e:
    print(f"Error initializing Firebase: {e}")
    # For development, you might want to initialize without credentials
    if os.getenv("ENVIRONMENT") == "development":
        firebase_app = initialize_app()
    else:
        raise

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL")

# API configuration
API_PREFIX = "/api"
PROJECT_NAME = "AIResumeBooster" 