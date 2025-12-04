import { useState, useEffect } from "react";
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import {
  doc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import dayjs from "dayjs";

const AddTaskDialog = ({ open, onClose, onTaskSaved, taskToEdit = null }) => {
  const [name, setName] = useState("");
  const [points, setPoints] = useState("10");
  const [recurrence, setRecurrence] = useState("daily");
  const [startDate, setStartDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(
    dayjs().add(1, "month").format("YYYY-MM-DD")
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setError("");
      if (taskToEdit) {
        setName(taskToEdit.name || "");
        setPoints(taskToEdit.points || "10");
        setRecurrence(taskToEdit.recurrenceType || "daily");
        setStartDate(
          taskToEdit.startDate
            ? dayjs(taskToEdit.startDate).format("YYYY-MM-DD")
            : dayjs().format("YYYY-MM-DD")
        );
        setEndDate(
          taskToEdit.endDate
            ? dayjs(taskToEdit.endDate).format("YYYY-MM-DD")
            : dayjs().add(1, "month").format("YYYY-MM-DD")
        );
      } else {
        setName("");
        setPoints("10");
        setRecurrence("daily");
        setStartDate(dayjs().format("YYYY-MM-DD"));
        setEndDate(dayjs().add(1, "month").format("YYYY-MM-DD"));
      }
    }
  }, [open, taskToEdit]);

  const handleSubmit = async () => {
    if (!name || !points || !startDate || !endDate) {
      setError("All fields are required.");
      return;
    }
    if (Number(points) < 1) {
      setError("Points must be positive.");
      return;
    }
    if (dayjs(endDate).isBefore(dayjs(startDate))) {
      setError("End date cannot be before start date.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const taskData = {
        name,
        points: Number(points),
        recurrenceType: recurrence,
        startDate: dayjs(startDate).toDate(),
        endDate: dayjs(endDate).toDate(),
        createdByTeacherId: auth.currentUser.uid,
        isActive: true,
        updatedAt: serverTimestamp(),
      };

      if (taskToEdit) {
        await setDoc(doc(db, "task_templates", taskToEdit.id), taskData, {
          merge: true,
        });
      } else {
        taskData.createdAt = serverTimestamp();
        await addDoc(collection(db, "task_templates"), taskData);
      }

      if (onTaskSaved) onTaskSaved();
      onClose();
    } catch (err) {
      console.error("Error saving task:", err);
      setError("Failed to save task. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine helper text based on selection
  const getRecurrenceHelperText = () => {
    switch (recurrence) {
      case "daily":
        return "Students can complete this once every day.";
      case "weekly":
        return "Students can complete this once per week (resets Monday).";
      // --- NEW HELPER TEXT ---
      case "once":
        return "Big Challenge! Students can only complete this exactly one time ever.";
      default:
        return "";
    }
  };

  return (
    <Dialog
      open={open}
      onClose={!loading ? onClose : undefined}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{taskToEdit ? "Edit Task" : "Add New Task"}</DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            margin="normal"
            required
            fullWidth
            label="Task Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            placeholder="e.g., Read for 20 mins"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Points Value"
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            disabled={loading}
            inputProps={{ min: 1 }}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel id="recurrence-label">Recurrence Type</InputLabel>
            <Select
              labelId="recurrence-label"
              value={recurrence}
              label="Recurrence Type"
              onChange={(e) => setRecurrence(e.target.value)}
              disabled={loading}
            >
              <MenuItem value="daily">Daily Task</MenuItem>
              {/* Added Weekly as an option, though logic is same as daily for now */}
              <MenuItem value="weekly">Weekly Task</MenuItem>
              {/* --- NEW OPTION --- */}
              <MenuItem
                value="once"
                sx={{ fontWeight: "bold", color: "primary.main" }}
              >
                One-time Challenge/Bonus
              </MenuItem>
            </Select>
            <FormHelperText>{getRecurrenceHelperText()}</FormHelperText>
          </FormControl>

          <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="date"
              fullWidth
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
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
  );
};

export default AddTaskDialog;
