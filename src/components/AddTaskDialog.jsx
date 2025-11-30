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
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { db } from "../firebase";
// 1. Import updateDoc and doc needed for editing
import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

// 2. Accept new prop: taskToEdit (will be null if adding, an object if editing)
const AddTaskDialog = ({ open, onClose, onTaskSaved, taskToEdit }) => {
  const { currentUser } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState(10);
  const [startDate, setStartDate] = useState(dayjs());
  const [endDate, setEndDate] = useState(dayjs());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 3. NEW useEffect: Detect if we are in "Edit Mode" whenever the dialog opens
  useEffect(() => {
    if (open && taskToEdit) {
      // We are editing! Pre-fill form data.
      setName(taskToEdit.name);
      setDescription(taskToEdit.description || "");
      setPoints(taskToEdit.points);
      // Important: Convert JS Date objects back to dayjs objects for the picker
      setStartDate(dayjs(taskToEdit.startDate));
      setEndDate(dayjs(taskToEdit.endDate));
    } else if (open && !taskToEdit) {
      // We are adding new! Reset form data to defaults.
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, taskToEdit]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setPoints(10);
    setStartDate(dayjs());
    setEndDate(dayjs());
    setError("");
    setLoading(false);
  };

  const handleSave = async () => {
    if (!name || !points || !startDate || !endDate) {
      setError("Please fill in required fields.");
      return;
    }
    if (endDate.isBefore(startDate)) {
      setError("End date cannot be before start date.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const taskData = {
        name: name,
        description: description,
        points: Number(points),
        startDate: startDate.toDate(),
        endDate: endDate.toDate(),
        // Only set creator and createdAt if adding new
        ...(taskToEdit
          ? {}
          : {
              createdByTeacherId: currentUser.uid,
              createdAt: serverTimestamp(),
            }),
        isActive: true,
      };

      if (taskToEdit) {
        // 4a. UPDATE EXISTING TASK
        const taskRef = doc(db, "task_templates", taskToEdit.id);
        // merge: true ensures we only update changed fields (good practice)
        await updateDoc(taskRef, taskData, { merge: true });
      } else {
        // 4b. CREATE NEW TASK
        await addDoc(collection(db, "task_templates"), taskData);
      }

      setLoading(false);
      onTaskSaved(); // Notify parent
      handleClose();
    } catch (err) {
      console.error("Error saving task:", err);
      setError("Failed to save task: " + err.message);
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog
        open={open}
        onClose={loading ? null : handleClose}
        maxWidth="sm"
        fullWidth
      >
        {/* 5. Dynamic Title */}
        <DialogTitle>
          {taskToEdit ? "Edit Task" : "Create New Task"}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            {/* ... Inputs remain exactly the same ... */}
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
            <Box sx={{ display: "flex", gap: 2 }}>
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
                minDate={startDate}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          {/* 6. Dynamic Button Label and click handler */}
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {loading ? (
              <CircularProgress size={24} />
            ) : taskToEdit ? (
              "Update Task"
            ) : (
              "Create Task"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default AddTaskDialog;
