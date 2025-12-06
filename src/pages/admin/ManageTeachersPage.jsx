import { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
// 1. ADDED NEW IMPORTS: writeBatch, getCountFromServer
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  writeBatch,
  getCountFromServer,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Tooltip,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DeleteIcon from "@mui/icons-material/Delete";
import SchoolIcon from "@mui/icons-material/School";
import EditIcon from "@mui/icons-material/Edit";

const ManageTeachersPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states for adding a new teacher
  const [newTeacherName, setNewTeacherName] = useState("");
  const [newTeacherEmail, setNewTeacherEmail] = useState("");
  const [newTeacherPassword, setNewTeacherPassword] = useState("");
  const [creating, setCreating] = useState(false);
  // NEW STATE for deleting loading status
  const [deletingId, setDeletingId] = useState(null);

  // STATES FOR EDITING
  const [editingTeacherId, setEditingTeacherId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    displayName: "",
    photoUrl: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), where("role", "==", "teacher"));
      const querySnapshot = await getDocs(q);
      const teacherList = [];
      querySnapshot.forEach((doc) => {
        teacherList.push({ id: doc.id, ...doc.data() });
      });
      setTeachers(teacherList);
    } catch (err) {
      console.error("Error fetching teachers:", err);
      setError("Failed to load teachers.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = async () => {
    setError("");
    setSuccess("");

    if (!newTeacherEmail || !newTeacherPassword || !newTeacherName.trim()) {
      setError("All fields for adding teacher are required.");
      return;
    }
    if (newTeacherPassword.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }

    setCreating(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newTeacherEmail,
        newTeacherPassword
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email: newTeacherEmail,
        displayName: newTeacherName.trim(),
        role: "teacher",
        createdAt: serverTimestamp(),
      });

      setSuccess(
        "Teacher account created successfully. You have been logged out."
      );
      setNewTeacherName("");
      setNewTeacherEmail("");
      setNewTeacherPassword("");
    } catch (err) {
      console.error("Error creating teacher:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else {
        setError("Failed to create teacher account. " + err.message);
      }
    } finally {
      setCreating(false);
    }
  };

  // --- 2. NEW MULTI-STEP DELETE HANDLER ---
  const handleDeleteTeacher = async (teacherId) => {
    setError("");
    setSuccess("");
    if (
      !window.confirm(
        "Are you sure you want to delete this teacher? This action cannot be undone."
      )
    )
      return;

    setDeletingId(teacherId);

    try {
      // STEP 1: CHECK FOR EXISTING STUDENTS
      // We use getCountFromServer for a cheap, fast check
      const studentsQuery = query(
        collection(db, "users"),
        where("createdByTeacherId", "==", teacherId),
        where("role", "==", "student")
      );
      const snapshot = await getCountFromServer(studentsQuery);
      const studentCount = snapshot.data().count;

      if (studentCount > 0) {
        // STOP! Students exist.
        alert(
          `Cannot delete. This teacher still has ${studentCount} assigned student(s). Please ask the teacher (or use Admin tools) to delete their student accounts first.`
        );
        setDeletingId(null);
        return;
      }

      // STEP 2: NO STUDENTS EXIST - PROCEED WITH CASCADE DELETE OF DATA
      // We will use a batch for better performance and atomicity
      const batch = writeBatch(db);

      // A. Delete Tasks
      const tasksQuery = query(
        collection(db, "task_templates"),
        where("createdByTeacherId", "==", teacherId)
      );
      const tasksSnap = await getDocs(tasksQuery);
      tasksSnap.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // B. Delete Badges
      const badgesQuery = query(
        collection(db, "badges"),
        where("createdByTeacherId", "==", teacherId)
      );
      const badgesSnap = await getDocs(badgesQuery);
      badgesSnap.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // C. Delete Goals
      const goalsQuery = query(
        collection(db, "goals"),
        where("createdByTeacherId", "==", teacherId)
      );
      const goalsSnap = await getDocs(goalsQuery);
      goalsSnap.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // D. Delete the Teacher Document itself
      const teacherRef = doc(db, "users", teacherId);
      batch.delete(teacherRef);

      // Commit the batch delete
      await batch.commit();

      // Update UI
      setTeachers(teachers.filter((t) => t.id !== teacherId));
      setSuccess(
        "Teacher and all associated data (tasks, badges, goals) have been permanently deleted."
      );
    } catch (err) {
      console.error("Error deleting teacher and data:", err);
      setError("Failed to delete teacher. Check console for details.");
    } finally {
      setDeletingId(null);
    }
  };
  // ---------------------------------------

  // EDIT HANDLERS (Unchanged)
  const handleStartEdit = (teacher) => {
    setEditingTeacherId(teacher.id);
    setEditFormData({
      displayName: teacher.displayName || "",
      photoUrl: teacher.photoUrl || "",
    });
    setError("");
    setSuccess("");
  };
  const handleCancelEdit = () => {
    setEditingTeacherId(null);
    setEditFormData({ displayName: "", photoUrl: "" });
    setError("");
  };
  const handleSaveEdit = async () => {
    if (!editFormData.displayName.trim()) {
      setError("Display Name cannot be empty.");
      return;
    }
    setSavingEdit(true);
    setError("");
    try {
      const teacherRef = doc(db, "users", editingTeacherId);
      await updateDoc(teacherRef, {
        displayName: editFormData.displayName.trim(),
        photoUrl: editFormData.photoUrl.trim(),
      });
      setTeachers((prevTeachers) =>
        prevTeachers.map((t) =>
          t.id === editingTeacherId
            ? {
                ...t,
                displayName: editFormData.displayName.trim(),
                photoUrl: editFormData.photoUrl.trim(),
              }
            : t
        )
      );
      setSuccess("Teacher updated successfully.");
      handleCancelEdit();
    } catch (err) {
      console.error("Error updating teacher:", err);
      setError("Failed to update teacher.");
    } finally {
      setSavingEdit(false);
    }
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box maxWidth="md" sx={{ mx: "auto" }}>
      <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
        Manage Teachers
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Add Teacher Section */}
      <Paper
        elevation={3}
        sx={{ p: 3, mb: 4, borderRadius: 3, border: "1px solid #e0e0e0" }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <PersonAddIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">Add New Teacher</Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Box component="form">
          <TextField
            label="Full Name (e.g., Mr. Smith)"
            variant="outlined"
            fullWidth
            size="small"
            value={newTeacherName}
            onChange={(e) => setNewTeacherName(e.target.value)}
            disabled={creating}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Email Address"
                variant="outlined"
                fullWidth
                size="small"
                value={newTeacherEmail}
                onChange={(e) => setNewTeacherEmail(e.target.value)}
                disabled={creating}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Password"
                type="password"
                variant="outlined"
                fullWidth
                size="small"
                value={newTeacherPassword}
                onChange={(e) => setNewTeacherPassword(e.target.value)}
                disabled={creating}
              />
            </Grid>
          </Grid>
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 3, py: 1, borderRadius: 30, fontWeight: "bold" }}
            onClick={handleAddTeacher}
            disabled={creating}
          >
            {creating ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Create Teacher Account"
            )}
          </Button>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 1, textAlign: "center" }}
          >
            Note: Creating a user will log you out temporarily.
          </Typography>
        </Box>
      </Paper>

      {/* Existing Teachers List */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: "flex", alignItems: "center" }}
        >
          <SchoolIcon sx={{ mr: 1, color: "text.secondary" }} />
          Existing Teachers ({teachers.length})
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {teachers.length === 0 ? (
          <Typography color="text.secondary">No teachers found.</Typography>
        ) : (
          <List>
            {teachers.map((teacher) => {
              const isEditing = teacher.id === editingTeacherId;
              // 3. CHECK IF THIS TEACHER IS BEING DELETED
              const isDeletingThisOne = teacher.id === deletingId;

              if (isEditing) {
                return (
                  <ListItem
                    key={teacher.id}
                    sx={{
                      bgcolor: "#f5f5f5",
                      mb: 1,
                      borderRadius: 2,
                      flexDirection: "column",
                      alignItems: "stretch",
                      p: 2,
                      border: "2px solid #1976d2",
                    }}
                  >
                    <TextField
                      label="Display Name"
                      size="small"
                      fullWidth
                      margin="dense"
                      value={editFormData.displayName}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          displayName: e.target.value,
                        })
                      }
                    />
                    <TextField
                      label="Photo URL (Optional)"
                      size="small"
                      fullWidth
                      margin="dense"
                      placeholder="https://..."
                      value={editFormData.photoUrl}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          photoUrl: e.target.value,
                        })
                      }
                    />
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                      sx={{ mt: 2 }}
                    >
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleCancelEdit}
                        disabled={savingEdit}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleSaveEdit}
                        disabled={savingEdit}
                      >
                        {savingEdit ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </Stack>
                  </ListItem>
                );
              }

              const displayName = teacher.displayName || null;
              const email = teacher.email || null;
              let avatarChar = "?";
              if (displayName) avatarChar = displayName.charAt(0).toUpperCase();
              else if (email) avatarChar = email.charAt(0).toUpperCase();
              let primaryText =
                displayName ||
                (email ? email.split("@")[0] : "Unknown Teacher");

              return (
                <ListItem
                  key={teacher.id}
                  secondaryAction={
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Edit Details">
                        {/* Disable buttons while deleting */}
                        <IconButton
                          edge="end"
                          aria-label="edit"
                          onClick={() => handleStartEdit(teacher)}
                          disabled={isDeletingThisOne}
                        >
                          <EditIcon
                            color={isDeletingThisOne ? "disabled" : "primary"}
                          />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Database Record">
                        {/* Show spinner if deleting this specific teacher */}
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDeleteTeacher(teacher.id)}
                          disabled={isDeletingThisOne}
                        >
                          {isDeletingThisOne ? (
                            <CircularProgress size={24} color="error" />
                          ) : (
                            <DeleteIcon color="error" />
                          )}
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  }
                  sx={{
                    bgcolor: "background.default",
                    mb: 1,
                    borderRadius: 2,
                    "&:hover": { bgcolor: "#e3f2fd" },
                    opacity: isDeletingThisOne ? 0.5 : 1,
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{ bgcolor: "secondary.main" }}
                      src={teacher.photoUrl}
                    >
                      {avatarChar}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" fontWeight="bold">
                        {primaryText}
                      </Typography>
                    }
                    secondary={email || "No email record in database"}
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default ManageTeachersPage;
