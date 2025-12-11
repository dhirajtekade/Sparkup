// src/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// taken from the .env.local file we created
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// 1. Initialize Main Firebase App
// Use a singleton pattern to avoid "App already initialized" errors in development hmr
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize main services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// 2. === CRITICAL SECTION: SECONDARY APP INSTANCE ===
// This is needed for teachers to create student accounts without logging themselves out.
let secondaryApp;
try {
  // Try to get existing secondary app instance if it exists already
  secondaryApp = getApp("SecondaryApp");
} catch (e) {
  // If it doesn't exist yet, initialize it with a unique name
  console.log(
    "Initializing secondary Firebase app instance for student creation.",
    e
  );
  secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
}

// Get the Auth service specifically for this secondary instance
const secondaryAuth = getAuth(secondaryApp);
// ==================================================

// Export services so other components can use them
// Note: We export secondaryAuth here so AddStudentDialog can find it.
export { auth, db, storage, secondaryAuth };
export default app;
