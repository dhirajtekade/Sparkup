import { useState, useEffect } from "react"; // 1. Make sure useEffect is imported
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Avatar,
} from "@mui/material";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, secondaryAuth } from "../firebase";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

const AddStudentDialog = ({
  open,
  onClose,
  onStudentSaved,
  studentToEdit = null,
}) => {
  // Initial state should just be empty
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // === THE FIX IS HERE ===
  // Use useEffect to react to changes in 'open' or 'studentToEdit' props
  useEffect(() => {
    if (open) {
      // If dialog opened, reset errors/success messages
      setError("");
      setSuccess("");
      setPassword(""); // Password field always starts empty

      if (studentToEdit) {
        // Edit Mode: Pre-fill form with student data
        // Use || '' to ensure controlled inputs don't get null/undefined
        setEmail(studentToEdit.email || "");
        setName(studentToEdit.displayName || "");
        setPhotoUrl(studentToEdit.photoUrl || "");
      } else {
        // Add Mode: Clear form fields
        setEmail("");
        setName("");
        setPhotoUrl("");
      }
    }
  }, [open, studentToEdit]); // Run this logic whenever these change
  // =======================

  const handleSubmit = async () => {
    // Basic validation (Password optional in edit mode)
    if (!email || !name || (!studentToEdit && !password)) {
      setError("Please fill in required fields (Email, Name, Password).");
      return;
    }
    if (password && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const currentTeacherId = auth.currentUser.uid;
      // Ensure empty string becomes null for Firestore storage
      const finalPhotoUrl = photoUrl.trim() ? photoUrl.trim() : null;

      if (studentToEdit) {
        // --- EDIT MODE (Firestore Update Only) ---
        const studentRef = doc(db, "users", studentToEdit.id);
        // We use merge: true to only update fields that changed
        await setDoc(
          studentRef,
          {
            displayName: name,
            email: email.toLowerCase(),
            photoUrl: finalPhotoUrl,
          },
          { merge: true }
        );

        setSuccess(
          "Student updated successfully in database. (Note: Login credentials not changed)."
        );
      } else {
        // --- CREATE MODE (New Auth User + Firestore Doc) ---
        // 1. Create user in Firebase Auth using secondary app instance
        const userCredential = await createUserWithEmailAndPassword(
          secondaryAuth,
          email,
          password
        );
        const newUser = userCredential.user;

        // 2. Immediately update the Auth profile with Name AND Photo URL
        await updateProfile(newUser, {
          displayName: name,
          photoURL: finalPhotoUrl,
        });

        // 3. Create user document in Firestore 'users' collection
        await setDoc(doc(db, "users", newUser.uid), {
          email: email.toLowerCase(),
          displayName: name,
          photoUrl: finalPhotoUrl, // Keep sync in Firestore too
          role: "student",
          createdByTeacherId: currentTeacherId,
          totalPoints: 0,
          createdAt: serverTimestamp(),
        });

        setSuccess(`Student '${name}' created successfully!`);
        // No need to manually clear form here, useEffect handles it on next open
      }

      // Notify parent component to refresh list
      if (onStudentSaved) onStudentSaved();

      // Auto close after short delay on success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error saving student:", err);
      // Handle common Firebase Auth errors
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("This email is already registered.");
          break;
        case "auth/invalid-email":
          setError("Invalid email address format.");
          break;
        default:
          setError("Failed to save student. " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {studentToEdit ? "Edit Student Details" : "Add New Student"}
      </DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Full Name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
          {/* Email is disabled in edit mode because changing it here doesn't change auth login */}
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || studentToEdit}
            helperText={
              studentToEdit ? "Email cannot be changed once created." : ""
            }
          />
          {/* Password only shown in Add mode */}
          {!studentToEdit && (
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              helperText="At least 6 characters."
            />
          )}

          {/* Photo URL Input */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
            <Avatar
              src={photoUrl}
              sx={{ width: 56, height: 56, bgcolor: "grey.300" }}
            >
              <AccountCircleIcon />
            </Avatar>
            <TextField
              margin="normal"
              fullWidth
              id="photoUrl"
              label="Photo URL (Optional)"
              name="photoUrl"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              disabled={loading}
              helperText="Paste a direct link to an image (e.g., https://example.com/photo.jpg)"
              placeholder="https://..."
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
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
