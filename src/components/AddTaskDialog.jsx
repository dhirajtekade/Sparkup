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
  Typography,
  Divider,
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
  // --- NEW: State for description ---
  const [description, setDescription] = useState("");
  // ----------------------------------
  const [points, setPoints] = useState("10");
  const [recurrence, setRecurrence] = useState("daily");
  const [startDate, setStartDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(
    dayjs().add(1, "month").format("YYYY-MM-DD")
  );
  const [requiredDays, setRequiredDays] = useState("21");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- Helper to calculate duration in days ---
  const calculateDuration = (startStr, endStr) => {
    const start = dayjs(startStr);
    const end = dayjs(endStr);
    if (start.isValid() && end.isValid()) {
      // diff gives days between, +1 makes it inclusive of start date
      return end.diff(start, "day") + 1;
    }
    return 0;
  };

  // --- Handlers for Inputs ---
  // These handle updating state AND auto-calculating requiredDays if needed

  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    // If in streak mode, recalculate required days when date changes
    if (recurrence === "streak") {
      const duration = calculateDuration(newStartDate, endDate);
      if (duration > 0) setRequiredDays(duration.toString());
    }
  };

  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);
    // If in streak mode, recalculate required days when date changes
    if (recurrence === "streak") {
      const duration = calculateDuration(startDate, newEndDate);
      if (duration > 0) setRequiredDays(duration.toString());
    }
  };

  const handleRecurrenceChange = (e) => {
    const newRecurrence = e.target.value;
    setRecurrence(newRecurrence);
    // When switching TO streak mode, set required days to current duration
    if (newRecurrence === "streak") {
      const duration = calculateDuration(startDate, endDate);
      if (duration > 0) {
        setRequiredDays(duration.toString());
      } else {
        // Fallback default if dates are invalid
        setRequiredDays("21");
      }
    }
  };

  useEffect(() => {
    if (open) {
      setError("");
      if (taskToEdit) {
        setName(taskToEdit.name || "");
        // --- NEW: Load description if editing ---
        setDescription(taskToEdit.description || "");
        // ----------------------------------------
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
        // Pre-fill saved required days, OR default to duration if missing
        if (taskToEdit.requiredDays) {
          setRequiredDays(taskToEdit.requiredDays);
        } else {
          const duration = calculateDuration(
            taskToEdit.startDate
              ? dayjs(taskToEdit.startDate).format("YYYY-MM-DD")
              : dayjs().format("YYYY-MM-DD"),
            taskToEdit.endDate
              ? dayjs(taskToEdit.endDate).format("YYYY-MM-DD")
              : dayjs().add(1, "month").format("YYYY-MM-DD")
          );
          setRequiredDays(duration > 0 ? duration.toString() : "21");
        }
      } else {
        // New Task defaults
        setName("");
        // --- NEW: Reset description for new task ---
        setDescription("");
        // -------------------------------------------
        setPoints("10");
        setRecurrence("daily");
        const defaultStart = dayjs().format("YYYY-MM-DD");
        const defaultEnd = dayjs().add(1, "month").format("YYYY-MM-DD");
        setStartDate(defaultStart);
        setEndDate(defaultEnd);
        // Default required days to the initial duration
        const duration = calculateDuration(defaultStart, defaultEnd);
        setRequiredDays(duration > 0 ? duration.toString() : "21");
      }
    }
  }, [open, taskToEdit]);

  const handleSubmit = async () => {
    if (!name || !points || !startDate || !endDate) {
      setError("All fields are required.");
      return;
    }

    const start = dayjs(startDate);
    const end = dayjs(endDate);
    if (end.isBefore(start)) {
      setError("End date cannot be before start date.");
      return;
    }

    // Validation for streak tasks
    let finalRequiredDays = null;
    if (recurrence === "streak") {
      if (!requiredDays || Number(requiredDays) < 1) {
        setError("Please specify minimum required days.");
        return;
      }
      const totalDuration = end.diff(start, "day") + 1;
      if (Number(requiredDays) > totalDuration) {
        setError(
          `Required days (${requiredDays}) cannot exceed total duration available (${totalDuration} days).`
        );
        return;
      }
      finalRequiredDays = Number(requiredDays);
    }

    setLoading(true);
    setError("");

    try {
      const finalRecurrence = recurrence || "daily";

      const taskData = {
        name,
        // --- NEW: Include description in save data ---
        description: description || "",
        // ---------------------------------------------
        points: Number(points),
        recurrenceType: finalRecurrence,
        // Save required days (null if not a streak task)
        requiredDays: finalRequiredDays,
        startDate: start.toDate(),
        endDate: end.toDate(),
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

  const getRecurrenceHelperText = () => {
    switch (recurrence) {
      case "daily":
        return "Students can complete this once every day.";
      case "weekly":
        return "Students can complete this once per week (resets Monday).";
      case "once":
        return "Big Challenge! Students can only complete this exactly one time ever.";
      case "streak":
        return "Students must check this box on multiple days within the date range to unlock a single large bonus.";
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
            placeholder="e.g., 21-Day Reading Challenge"
          />

          {/* --- NEW DESCRIPTION FIELD --- */}
          <TextField
            margin="normal"
            fullWidth
            label="Task Description (Optional)"
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            placeholder="Add instructions, links, or details here..."
          />
          {/* ----------------------------- */}

          <TextField
            margin="normal"
            required
            fullWidth
            label={
              recurrence === "streak" ? "Total Bonus Points" : "Points Value"
            }
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            disabled={loading}
            inputProps={{ min: 1 }}
            helperText={
              recurrence === "streak"
                ? "Awarded only once upon completing the required number of days."
                : "Awarded each time checked."
            }
          />

          <FormControl fullWidth margin="normal">
            <InputLabel id="recurrence-label">Recurrence Type</InputLabel>
            <Select
              labelId="recurrence-label"
              value={recurrence}
              label="Recurrence Type"
              // Use new handler
              onChange={handleRecurrenceChange}
              disabled={loading}
            >
              <MenuItem value="daily">Daily Task</MenuItem>
              <MenuItem value="weekly">Weekly Task</MenuItem>
              <Divider />
              <MenuItem
                value="streak"
                sx={{ fontWeight: "bold", color: "secondary.main" }}
              >
                Multi-Day Streak Challenge
              </MenuItem>
              <MenuItem
                value="once"
                sx={{ fontWeight: "bold", color: "primary.main" }}
              >
                One-time Challenge/Bonus
              </MenuItem>
            </Select>
            <FormHelperText>{getRecurrenceHelperText()}</FormHelperText>
          </FormControl>

          {/* Date Range Inputs */}
          <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
            <TextField
              label="Start Date Range"
              type="date"
              fullWidth
              value={startDate}
              // Use new handler
              onChange={handleStartDateChange}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date Range"
              type="date"
              fullWidth
              value={endDate}
              // Use new handler
              onChange={handleEndDateChange}
              disabled={loading}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          {/* CONDITIONAL INPUT: Only show if 'streak' is selected */}
          {recurrence === "streak" && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: "background.default",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "secondary.main",
              }}
            >
              <Typography
                variant="subtitle2"
                fontWeight="bold"
                color="secondary.dark"
                gutterBottom
              >
                Challenge Requirements
              </Typography>
              <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                Define how many days within the date range above they must
                complete.
              </Typography>
              <TextField
                margin="dense"
                required
                fullWidth
                label="Minimum Days Required to Complete"
                type="number"
                value={requiredDays}
                // Still editable by user
                onChange={(e) => setRequiredDays(e.target.value)}
                disabled={loading}
                inputProps={{ min: 2 }}
                helperText={`Student must do this task on at least ${requiredDays} different days to get the bonus points.`}
              />
            </Box>
          )}
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
