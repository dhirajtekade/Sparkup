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
import { db } from "../firebase";
// 1. Add updateDoc and doc imports
import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

// 2. Accept goalToEdit prop, rename onGoalAdded to onGoalSaved
const AddGoalDialog = ({ open, onClose, onGoalSaved, goalToEdit }) => {
  const { currentUser } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [targetPoints, setTargetPoints] = useState(500);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 3. Effect to pre-fill form if editing
  useEffect(() => {
    if (open && goalToEdit) {
      // Edit mode: fill form
      setName(goalToEdit.name);
      setDescription(goalToEdit.description || "");
      setImageUrl(goalToEdit.imageUrl || "");
      setTargetPoints(goalToEdit.targetPoints);
    } else if (open && !goalToEdit) {
      // Add mode: reset form
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, goalToEdit]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setImageUrl("");
    setTargetPoints(500);
    setError("");
    setLoading(false);
  };

  // 4. Updated save handler to handle both Create and Update
  const handleSave = async () => {
    if (!name || !targetPoints) {
      setError("Name and target points required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Base data needed for both add and update
      const goalData = {
        name,
        description,
        imageUrl,
        targetPoints: Number(targetPoints),
        isActive: true,
        // Only add creator info if it's a new goal
        ...(goalToEdit
          ? {}
          : {
              createdByTeacherId: currentUser.uid,
              createdAt: serverTimestamp(),
            }),
      };

      if (goalToEdit) {
        // UPDATE EXISTING
        const goalRef = doc(db, "goals", goalToEdit.id);
        await updateDoc(goalRef, goalData);
      } else {
        // CREATE NEW
        await addDoc(collection(db, "goals"), goalData);
      }

      setLoading(false);
      onGoalSaved();
      handleClose();
    } catch (err) {
      console.error(err);
      setError(err.message);
      setLoading(false);
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
      <DialogTitle>{goalToEdit ? "Edit Goal" : "Create New Goal"}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Goal Name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <TextField
            label="Image URL (Placeholder)"
            fullWidth
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            helperText="Paste image link"
          />
          <TextField
            label="Target Points"
            type="number"
            fullWidth
            value={targetPoints}
            onChange={(e) => setTargetPoints(e.target.value)}
            required
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        {/* 6. Dynamic Button Text and Handler */}
        <Button onClick={handleSave} variant="contained" disabled={loading}>
          {loading ? (
            <CircularProgress size={24} />
          ) : goalToEdit ? (
            "Update Goal"
          ) : (
            "Create Goal"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddGoalDialog;
