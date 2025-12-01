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
// 1. Import the new Token Renderer for the preview
import BadgeToken from "../utils/badgeTokenRenderer";

const AddBadgeDialog = ({ open, onClose, onBadgeSaved, badgeToEdit }) => {
  const { currentUser } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  // 2. REMOVED iconKey state
  const [minPoints, setMinPoints] = useState(0);
  const [maxPoints, setMaxPoints] = useState(99);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && badgeToEdit) {
      setName(badgeToEdit.name);
      setDescription(badgeToEdit.description || "");
      // 3. REMOVED setting iconKey
      setMinPoints(badgeToEdit.minPoints);
      setMaxPoints(badgeToEdit.maxPoints);
    } else if (open && !badgeToEdit) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, badgeToEdit]);

  const resetForm = () => {
    // 4. REMOVED resetting iconKey
    setName("");
    setDescription("");
    setMinPoints(0);
    setMaxPoints(99);
    setError("");
    setLoading(false);
  };

  const handleSave = async () => {
    if (!name || minPoints === "" || maxPoints === "") {
      setError("Name and both point values are required.");
      return;
    }

    const min = Number(minPoints);
    const max = Number(maxPoints);

    if (min >= max) {
      setError("Minimum points must be less than maximum points.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const badgeData = {
        name,
        description,
        // 5. REMOVED iconKey from data payload
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
          Define the name and point range for this badge.
        </DialogContentText>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* 6. NEW Live Preview Section */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            my: 2,
            p: 2,
            bgcolor: "#f5f5f5",
            borderRadius: 2,
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="caption" display="block" gutterBottom>
              Preview
            </Typography>
            {/* Render the token based on current form state */}
            <BadgeToken
              name={name || "NAME"}
              maxPoints={maxPoints || 0}
              size={70}
            />
          </Box>
        </Box>

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

          {/* 7. REMOVED Icon Select Control */}

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
