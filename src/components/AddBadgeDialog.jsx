import { useState } from 'react';
import {
  Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle,
  CircularProgress, Alert, Box
} from '@mui/material';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// 1. Import Auth hook
import { useAuth } from '../contexts/AuthContext';

const AddBadgeDialog = ({ open, onClose, onBadgeAdded }) => {
  // 2. Get current teacher
  const { currentUser } = useAuth();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(''); // Just a URL string for now
  const [pointsRequired, setPointsRequired] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if(!name || !pointsRequired) {
        setError("Name and points are required.");
        return;
    }

    setLoading(true);
    setError('');

    try {
      await addDoc(collection(db, "badges"), {
        name,
        description,
        imageUrl, // Saving the URL string
        pointsRequired: Number(pointsRequired),
        // 3. STAMP WITH TEACHER ID
        createdByTeacherId: currentUser.uid, 
        createdAt: serverTimestamp(),
        isActive: true
      });
      
      setLoading(false);
      onBadgeAdded();
      handleClose();
    } catch (err) {
      console.error("Error creating badge:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName(''); setDescription(''); setImageUrl(''); setPointsRequired(100);
    setError(''); setLoading(false);
    onClose();
  };

  return (
      <Dialog open={open} onClose={loading ? null : handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Badge</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Badge Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} required />
             <TextField label="Description" fullWidth multiline rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
             {/* Placeholder for Image URL */}
             <TextField label="Image URL (Placeholder)" fullWidth value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} helperText="Paste an image link here for now" />
             <TextField label="Points Required" type="number" fullWidth value={pointsRequired} onChange={(e) => setPointsRequired(e.target.value)} required />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Create Badge"}
          </Button>
        </DialogActions>
      </Dialog>
  );
};

export default AddBadgeDialog;