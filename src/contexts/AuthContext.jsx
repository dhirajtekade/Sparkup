import React, { useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  // 1. NEW IMPORTS FOR LINKING
  EmailAuthProvider,
  linkWithCredential,
  signInWithCredential,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { CircularProgress, Box } from "@mui/material";

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  function googleSignIn() {
    const provider = new GoogleAuthProvider();
    // We don't catch errors here; we let the LoginPage handle them
    return signInWithPopup(auth, provider);
  }

  // 2. NEW FUNCTION: Handles the complex linking process
  async function linkGoogleToEmailAccount(email, password, pendingCredential) {
    // A. Create an email/password credential from what the user just entered
    const emailCredential = EmailAuthProvider.credential(email, password);

    // B. Sign in with that email/password credential first to prove ownership
    const userCredential = await signInWithCredential(auth, emailCredential);
    const user = userCredential.user;

    // C. Once signed in, link the pending Google credential to this user
    return linkWithCredential(user, pendingCredential);
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setCurrentUser(user);
            setUserRole(userDocSnap.data().role);
          } else {
            console.warn(
              "Unauthorized Google login attempt. No Firestore doc."
            );
            await signOut(auth);
            setCurrentUser(null);
            setUserRole(null);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          await signOut(auth);
          setCurrentUser(null);
          setUserRole(null);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    googleSignIn,
    linkGoogleToEmailAccount, // Export the new function
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
