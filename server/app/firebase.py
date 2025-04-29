import firebase_admin
from firebase_admin import credentials
import json
import os

def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    try:
        # Check if default app already exists
        default_app = None
        try:
            default_app = firebase_admin.get_app()
        except ValueError:
            pass

        if not default_app:
            # Get credentials from environment variables
            cred_dict = {
                "type": "service_account",
                "project_id": "airesumebooster",
                "private_key_id": os.environ["FIREBASE_PRIVATE_KEY_ID"],
                "private_key": os.environ["FIREBASE_PRIVATE_KEY"].replace("\\n", "\n"),
                "client_email": os.environ["FIREBASE_CLIENT_EMAIL"],
                "client_id": os.environ["FIREBASE_CLIENT_ID"],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url": os.environ["FIREBASE_CLIENT_CERT_URL"]
            }
            
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK initialized successfully")
        else:
            print("Firebase Admin SDK already initialized")
    except Exception as e:
        print(f"Failed to initialize Firebase: {e}") 