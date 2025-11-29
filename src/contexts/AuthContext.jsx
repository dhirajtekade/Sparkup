import React, { useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { CircularProgress, Box } from "@mui/material";

// 1. Create the context
const AuthContext = React.createContext();

// 2. Custom hook to use the context easily in other components
export function useAuth() {
  return useContext(AuthContext);
}

// 3. The Provider component that wraps the app
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  // loading is crucial: don't render the app until we know login state
  const [loading, setLoading] = useState(true);

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    // This listener runs whenever Firebase detects a login/logout change
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        // User is signed in, save them to state
        setCurrentUser(user);
        
        // Fetch their role from Firestore 'users' collection
        try {
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                setUserRole(userDocSnap.data().role);
            } else {
                // Handle case where auth exists but firestore doc doesn't
                console.error("User exists in Auth but not Firestore");
                setUserRole(null); 
            }
        } catch (error) {
            console.error("Error fetching user role:", error);
             setUserRole(null);
        }

      } else {
        // User is signed out
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Show a spinner while Firebase is checking initial connection */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}