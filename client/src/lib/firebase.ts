import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    if (!user.email || !user.displayName) {
      throw new Error("Missing required user information");
    }

    // Register user with our backend
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        name: user.displayName,
        photoUrl: user.photoURL,
        firebaseId: user.uid
      }),
      credentials: "include"
    });

    if (!res.ok) {
      throw new Error("Failed to register user with backend");
    }

    return user;
  } catch (error: any) {
    console.error("Error signing in with Google", error);
    if (error.code === 'auth/configuration-not-found') {
      throw new Error("Firebase configuration error. Please ensure the app URL is added to authorized domains in Firebase Console.");
    }
    throw error;
  }
}

export function signOut() {
  return auth.signOut();
}

export { auth };