import { useState } from 'react';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Alert
} from '@mui/material';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
// We import firebase/app to create a secondary temporary instance
import { initializeApp } from 'firebase/app';

// Get config to initialize secondary app
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const AddStudentDialog = ({ open, onClose, onStudentAdded }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    // Basic validation
    if(!email || !password || !name) {
        setError("All fields are required.");
        return;
    }
    if(password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
    }

    setLoading(true);
    setError('');
    
    let tempApp = null;

    try {
      // --- WORKAROUND START ---
      // 1. Initialize a secondary temporary Firebase App.
      // This allows us to create a user without logging out the currently logged-in teacher.
      tempApp = initializeApp(firebaseConfig, "tempAppForUserCreation");
      const tempAuth = getAuth(tempApp);

      // 2. Create Auth User using temp app instance
      const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
      const newStudentUid = userCredential.user.uid;

      // 3. Create Firestore Document for the new student
      // We use the main 'db' instance here, as the teacher has write permissions.
      await setDoc(doc(db, "users", newStudentUid), {
        email: email,
        displayName: name,
        role: "student",
        totalPoints: 0,
        createdAt: serverTimestamp()
      });
      
      // 4. Cleanup
      setLoading(false);
      onStudentAdded(); // Tell parent component to refresh the list
      handleClose(); // Close the dialog

    } catch (err) {
      console.error("Error creating student:", err);
      setLoading(false);
      // Handle common errors
      if(err.code === 'auth/email-already-in-use') {
          setError("This email is already registered.");
      } else {
          setError("Failed to create student. " + err.message);
      }
    } finally {
        // Delete the temp app to free resources
        if (tempApp) {
           // We use a fire-and-forget approach here as deleteApp can be async but we don't need to wait
           try{ tempApp.delete() } catch(e) { /* ignore */ }
        }
    }
  };

  const handleClose = () => {
    // Reset form state on close
    setEmail('');
    setPassword('');
    setName('');
    setError('');
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={loading ? null : handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Student</DialogTitle>
      <DialogContent>
        <DialogContentText gutterBottom>
          Create an account for a student. They will use this email and password to log in.
        </DialogContentText>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TextField
          autoFocus
          margin="dense"
          id="name"
          label="Student Name"
          type="text"
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />
        <TextField
          margin="dense"
          id="email"
          label="Email Address"
          type="email"
          fullWidth
          variant="outlined"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <TextField
          margin="dense"
          id="password"
          label="Password (min 6 chars)"
          type="text" // Using text type so teacher can see what they type
          fullWidth
          variant="outlined"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleCreate} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Create Student"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddStudentDialog;