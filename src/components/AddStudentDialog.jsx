import { useState, useEffect } from "react";
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Alert,
  Box,
  Typography,
} from "@mui/material";
import { db } from "../firebase";
// 1. Import updateDoc and doc
import { doc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { useAuth } from "../contexts/AuthContext";

// Configuration for temp app remains same
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// 2. Accept studentToEdit prop, rename onStudentAdded to onStudentSaved
const AddStudentDialog = ({ open, onClose, onStudentSaved, studentToEdit }) => {
  const { currentUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 3. Effect to pre-fill form if editing
  useEffect(() => {
    if (open && studentToEdit) {
      // Edit mode: fill form
      setName(studentToEdit.displayName || "");
      setEmail(studentToEdit.email || "");
      // Password field remains empty in edit mode
    } else if (open && !studentToEdit) {
      // Add mode: reset form
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, studentToEdit]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setError("");
    setLoading(false);
  };

  // 4. Updated save handler to handle both Create and Update
  const handleSave = async () => {
    // Basic validation
    if (!email || !name) {
      setError("Name and email are required.");
      return;
    }

    // Password is required ONLY when creating a new student
    if (!studentToEdit && !password) {
      setError("Password is required for new students.");
      return;
    }
    if (!studentToEdit && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");
    let tempApp = null;

    try {
      if (studentToEdit) {
        // --- UPDATE EXISTING STUDENT ---
        // We only update Firestore data. We cannot update Auth credentials here.
        const studentRef = doc(db, "users", studentToEdit.id);
        await updateDoc(studentRef, {
          displayName: name,
          email: email, // Updates display email only, not login email
        });
      } else {
        // --- CREATE NEW STUDENT ---
        // (This logic remains the same as before)
        tempApp = initializeApp(firebaseConfig, "tempAppForUserCreation");
        const tempAuth = getAuth(tempApp);
        const userCredential = await createUserWithEmailAndPassword(
          tempAuth,
          email,
          password
        );
        const newStudentUid = userCredential.user.uid;

        await setDoc(doc(db, "users", newStudentUid), {
          email: email,
          displayName: name,
          role: "student",
          totalPoints: 0,
          createdByTeacherId: currentUser.uid,
          createdAt: serverTimestamp(),
        });
      }

      setLoading(false);
      onStudentSaved();
      handleClose();
    } catch (err) {
      console.error("Error saving student:", err);
      setLoading(false);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else {
        setError("Failed to save student. " + err.message);
      }
    } finally {
      if (tempApp) {
        try {
          tempApp.delete();
        } catch (e) {
          /* ignore */
        }
      }
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? null : handleClose}
      maxWidth="sm"
      fullWidth
    >
      {/* 5. Dynamic Title */}
      <DialogTitle>
        {studentToEdit ? "Edit Student Details" : "Add New Student"}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Student Name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
          />
          <TextField
            label="Email Address"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
            helperText={
              studentToEdit
                ? "Note: Updating email here does not change their login email."
                : ""
            }
          />

          {/* 6. Hide Password field in Edit Mode */}
          {!studentToEdit && (
            <TextField
              label="Password (min 6 chars)"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          )}

          {studentToEdit && (
            <Typography variant="caption" color="text.secondary">
              To reset a student's password, please contact the administrator.
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        {/* 7. Dynamic Button Text and Handler */}
        <Button onClick={handleSave} variant="contained" disabled={loading}>
          {loading ? (
            <CircularProgress size={24} />
          ) : studentToEdit ? (
            "Update Student"
          ) : (
            "Create Student"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddStudentDialog;
