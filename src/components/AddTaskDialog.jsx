import { useState } from 'react';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Alert,
  Box
} from '@mui/material';
// Date Picker imports
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// Import Auth hook to get current teacher ID
import { useAuth } from '../contexts/AuthContext';

const AddTaskDialog = ({ open, onClose, onTaskAdded }) => {
  const { currentUser } = useAuth();
  
  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState(10);
  // Default dates to today
  const [startDate, setStartDate] = useState(dayjs());
  const [endDate, setEndDate] = useState(dayjs());
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    // Basic validation
    if(!name || !points || !startDate || !endDate) {
        setError("Please fill in required fields.");
        return;
    }
    if(endDate.isBefore(startDate)) {
        setError("End date cannot be before start date.");
        return;
    }

    setLoading(true);
    setError('');

    try {
      // Add document to 'task_templates' collection
      await addDoc(collection(db, "task_templates"), {
        name: name,
        description: description,
        points: Number(points), // Ensure it's saved as a number
        // Convert dayjs objects to Javascript Date objects for Firestore
        startDate: startDate.toDate(),
        endDate: endDate.toDate(),
        createdByTeacherId: currentUser.uid, // <--- Scoping to current teacher
        createdAt: serverTimestamp(),
        isActive: true // Default to active
      });
      
      // Cleanup
      setLoading(false);
      onTaskAdded(); // Refresh parent list
      handleClose();

    } catch (err) {
      console.error("Error creating task:", err);
      setError("Failed to create task: " + err.message);
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form on close
    setName('');
    setDescription('');
    setPoints(10);
    setStartDate(dayjs());
    setEndDate(dayjs());
    setError('');
    setLoading(false);
    onClose();
  };

  return (
    // wrap date pickers in LocalizationProvider
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={loading ? null : handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              autoFocus
              label="Task Name"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
             <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
             <TextField
              label="Points Reward"
              type="number"
              fullWidth
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              disabled={loading}
              required
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
                <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue)}
                    disabled={loading}
                    slotProps={{ textField: { fullWidth: true } }}
                />
                 <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                    disabled={loading}
                    minDate={startDate} // Cannot pick end date before start date
                    slotProps={{ textField: { fullWidth: true } }}
                />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Create Task"}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default AddTaskDialog;