import { useState, useEffect } from "react";
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Alert,
  Box,
  Typography,
} from "@mui/material";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

const AddBadgeDialog = ({ open, onClose, onBadgeSaved, badgeToEdit }) => {
  const { currentUser } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  // 1. CHANGED: Replaced pointsRequired with min/max states
  // Defaulting min to 0 and max to something reasonable
  const [minPoints, setMinPoints] = useState(0);
  const [maxPoints, setMaxPoints] = useState(99);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && badgeToEdit) {
      // 2. UPDATED: Pre-fill min/max if editing
      setName(badgeToEdit.name);
      setDescription(badgeToEdit.description || "");
      setImageUrl(badgeToEdit.imageUrl || "");
      setMinPoints(badgeToEdit.minPoints);
      setMaxPoints(badgeToEdit.maxPoints);
    } else if (open && !badgeToEdit) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, badgeToEdit]);

  const resetForm = () => {
    // 3. UPDATED: Reset min/max
    setName("");
    setDescription("");
    setImageUrl("");
    setMinPoints(0);
    setMaxPoints(99);
    setError("");
    setLoading(false);
  };

  const handleSave = async () => {
    // 4. UPDATED: Validation Logic
    if (!name || minPoints === "" || maxPoints === "") {
      setError("Name and both point values are required.");
      return;
    }

    const min = Number(minPoints);
    const max = Number(maxPoints);

    // if (min < 0 || max < 0) {
    //   setError("Points cannot be negative.");
    //   return;
    // }

    if (min >= max) {
      setError("Minimum points must be less than maximum points.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 5. UPDATED: Payload uses minPoints and maxPoints
      const badgeData = {
        name,
        description,
        imageUrl,
        minPoints: min,
        maxPoints: max,
        isActive: true,
        ...(badgeToEdit
          ? {}
          : {
              createdByTeacherId: currentUser.uid,
              createdAt: serverTimestamp(),
            }),
      };

      if (badgeToEdit) {
        const badgeRef = doc(db, "badges", badgeToEdit.id);
        await updateDoc(badgeRef, badgeData);
      } else {
        await addDoc(collection(db, "badges"), badgeData);
      }

      setLoading(false);
      onBadgeSaved();
      handleClose();
    } catch (err) {
      console.error("Error saving badge:", err);
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
      <DialogTitle>
        {badgeToEdit ? "Edit Badge" : "Create New Badge"}
      </DialogTitle>
      <DialogContent>
        <DialogContentText gutterBottom>
          Define the point range for this badge. Students whose total score
          falls within this range will receive this badge.
        </DialogContentText>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Badge Name"
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
            helperText="Paste an image link here for now"
          />

          {/* 6. UPDATED: Two inputs for the range */}
          <Typography variant="subtitle2" sx={{ mt: 1 }}>
            Point Range
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Minimum Points"
              type="number"
              fullWidth
              value={minPoints}
              onChange={(e) => setMinPoints(e.target.value)}
              required
            />
            <TextField
              label="Maximum Points"
              type="number"
              fullWidth
              value={maxPoints}
              onChange={(e) => setMaxPoints(e.target.value)}
              required
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={loading}>
          {loading ? (
            <CircularProgress size={24} />
          ) : badgeToEdit ? (
            "Update Badge"
          ) : (
            "Create Badge"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddBadgeDialog;
