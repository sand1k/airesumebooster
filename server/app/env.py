"""Environment variable loading module"""
from pathlib import Path
import os
from dotenv import load_dotenv

# Get the project root directory (3 levels up from this file)
PROJECT_ROOT = Path(__file__).parent.parent.parent.resolve()

# Print current working directory and .env file path for debugging
print(f"Current working directory: {os.getcwd()}")
print(f"Looking for .env file at: {PROJECT_ROOT / '.env'}")
print(f".env file exists: {(PROJECT_ROOT / '.env').exists()}")

# Load environment variables in order of precedence
load_dotenv(PROJECT_ROOT / ".env")
load_dotenv(PROJECT_ROOT / f".env.{os.getenv('ENVIRONMENT', 'development')}")
load_dotenv(PROJECT_ROOT / ".env.local")  # Local overrides

# Required environment variables
REQUIRED_ENV_VARS = [
    "FIREBASE_PRIVATE_KEY_ID",
    "FIREBASE_PRIVATE_KEY",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_CLIENT_ID",
    "FIREBASE_CLIENT_CERT_URL",
    "OPENAI_API_KEY"
]

# Print all environment variables for debugging
print("Environment variables:")
for var in REQUIRED_ENV_VARS:
    print(f"{var}: {'✓' if os.getenv(var) else '✗'}")

# Validate required environment variables
missing_vars = [var for var in REQUIRED_ENV_VARS if not os.getenv(var)]
if missing_vars:
    raise RuntimeError(f"Missing required environment variables: {', '.join(missing_vars)}")

# Environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
IS_DEVELOPMENT = ENVIRONMENT == "development"
IS_PRODUCTION = ENVIRONMENT == "production" 