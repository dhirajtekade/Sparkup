import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Divider,
  Grid,
} from "@mui/material";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";
import SecurityIcon from "@mui/icons-material/Security";

const AdminSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // SETTING STATE: Default to true if setting hasn't been created yet
  const [allowDelete, setAllowDelete] = useState(true);

  // Reference to the specific global settings document
  const settingsDocRef = doc(db, "settings", "global");

  // 1. Fetch current settings on load
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
          // If document exists, use saved preference
          setAllowDelete(docSnap.data().allowTeacherDeleteStudents);
        } else {
          // If it's the first time running, create default settings document
          await setDoc(settingsDocRef, { allowTeacherDeleteStudents: true });
          setAllowDelete(true);
        }
      } catch (err) {
        console.error("Error loading settings:", err);
        setError("Failed to load current settings.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Handle toggle change
  const handleToggleChange = async (event) => {
    const newValue = event.target.checked;
    // Optimistic UI update
    setAllowDelete(newValue);
    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      // Update Firestore document
      // merge: true is crucial here so we don't overwrite other future settings
      await setDoc(
        settingsDocRef,
        {
          allowTeacherDeleteStudents: newValue,
        },
        { merge: true }
      );

      setSuccessMsg(
        `Setting updated: Teachers ${
          newValue ? "CAN" : "CANNOT"
        } delete students.`
      );
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Error saving setting:", err);
      setError("Failed to save setting. Reverting change.");
      // Revert UI on error
      setAllowDelete(!newValue);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          display: "flex",
          alignItems: "center",
          color: "error.main",
          fontWeight: "bold",
        }}
      >
        <SettingsSuggestIcon sx={{ mr: 2, fontSize: 40 }} /> Platform Settings
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 4, color: "text.secondary" }}>
        Configure global rules and permissions for the application.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMsg}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 4, borderTop: "4px solid #d32f2f" }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <SecurityIcon color="error" sx={{ fontSize: 50, opacity: 0.7 }} />
          </Grid>
          <Grid item xs>
            <Typography variant="h6" fontWeight="bold">
              Teacher Permissions: Student Deletion
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Controls whether teachers have the ability to delete student
              accounts from their roster. Disabling this is recommended to
              prevent accidental data loss.
            </Typography>
          </Grid>
          <Grid item>
            {saving ? <CircularProgress size={24} sx={{ mr: 2 }} /> : null}
            <FormControlLabel
              control={
                <Switch
                  checked={allowDelete}
                  onChange={handleToggleChange}
                  color={allowDelete ? "success" : "default"}
                  disabled={saving}
                />
              }
              label={
                <Typography
                  fontWeight="bold"
                  sx={{ color: allowDelete ? "success.main" : "text.disabled" }}
                >
                  {allowDelete ? "ALLOWED" : "DISABLED"}
                </Typography>
              }
              labelPlacement="start"
            />
          </Grid>
        </Grid>
        <Divider sx={{ my: 2, opacity: 0.5 }} />
        <Typography
          variant="caption"
          sx={{ fontStyle: "italic", color: "text.secondary" }}
        >
          Note: Changes take effect immediately for all teachers logged into the
          platform.
        </Typography>
      </Paper>
    </Box>
  );
};

export default AdminSettingsPage;
