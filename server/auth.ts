import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Check if Firebase app is already initialized to prevent multiple initializations
let auth;
try {
  // Try to get the existing auth instance
  auth = getAuth();
} catch (error) {
  // Initialize Firebase Admin SDK if not already initialized
  const firebaseConfig = {
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    // If you have a service account key file, you would use it here
    // credential: cert(serviceAccount)
  };
  
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
}

export { auth };