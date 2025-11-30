import { useState } from 'react';
import {
  Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle,
  CircularProgress, Alert, Box
} from '@mui/material';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const AddGoalDialog = ({ open, onClose, onGoalAdded }) => {
  const { currentUser } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetPoints, setTargetPoints] = useState(500);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if(!name || !targetPoints) { setError("Name and target points required."); return; }

    setLoading(true); setError('');

    try {
      await addDoc(collection(db, "goals"), {
        name, description, imageUrl,
        targetPoints: Number(targetPoints),
        // STAMP TEACHER ID
        createdByTeacherId: currentUser.uid, 
        createdAt: serverTimestamp(),
        isActive: true
      });
      setLoading(false); onGoalAdded(); handleClose();
    } catch (err) {
      console.error(err); setError(err.message); setLoading(false);
    }
  };

  const handleClose = () => {
    setName(''); setDescription(''); setImageUrl(''); setTargetPoints(500);
    setError(''); setLoading(false); onClose();
  };

  return (
      <Dialog open={open} onClose={loading ? null : handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Goal</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Goal Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} required />
             <TextField label="Description" fullWidth multiline rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
             <TextField label="Image URL (Placeholder)" fullWidth value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} helperText="Paste image link" />
             <TextField label="Target Points" type="number" fullWidth value={targetPoints} onChange={(e) => setTargetPoints(e.target.value)} required />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={loading}>{loading ? <CircularProgress size={24} /> : "Create Goal"}</Button>
        </DialogActions>
      </Dialog>
  );
};

export default AddGoalDialog;