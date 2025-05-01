from pathlib import Path
import os
from dotenv import load_dotenv
from firebase_admin import credentials, initialize_app
from .env import PROJECT_ROOT, ENVIRONMENT, IS_DEVELOPMENT

# Load environment variables from project root
PROJECT_ROOT = Path(__file__).parent.parent.parent.resolve()

# Print current working directory and .env file path for debugging
print(f"Current working directory: {os.getcwd()}")
print(f"Looking for .env file at: {PROJECT_ROOT / '.env'}")
print(f".env file exists: {(PROJECT_ROOT / '.env').exists()}")

# Load environment variables in order of precedence
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
    "OPENAI_API_KEY"  # Add OpenAI API key to required variables
]

# Print all environment variables for debugging
print("Environment variables:")
for var in REQUIRED_ENV_VARS:
    print(f"{var}: {'✓' if os.getenv(var) else '✗'}")

# Validate required environment variables
missing_vars = [var for var in REQUIRED_ENV_VARS if not os.getenv(var)]
if missing_vars:
    raise RuntimeError(f"Missing required environment variables: {', '.join(missing_vars)}")

# Firebase configuration
STORAGE_BUCKET = "airesumebooster.firebasestorage.app"

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
    "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_CERT_URL"),
}

# Initialize Firebase Admin
try:
    cred = credentials.Certificate(firebase_config)
    firebase_app = initialize_app(cred, {
        'storageBucket': STORAGE_BUCKET
    })
except Exception as e:
    print(f"Error initializing Firebase: {e}")
    # For development, you might want to initialize without credentials
    if IS_DEVELOPMENT:
        firebase_app = initialize_app(options={
            'storageBucket': STORAGE_BUCKET
        })
    else:
        raise

# API configuration
API_PREFIX = "/api"
PROJECT_NAME = "AIResumeBooster" 