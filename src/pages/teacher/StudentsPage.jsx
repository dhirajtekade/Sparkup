import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";
// 1. Add doc and getDoc imports for fetching settings
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  // 2. Add Tooltip import for better UX
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddStudentDialog from "../../components/AddStudentDialog";

const StudentsPage = () => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // 3. NEW STATE: Track if deletion is allowed globally
  // Default to true so it works even if settings haven't loaded yet
  const [canDeleteStudents, setCanDeleteStudents] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);

  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [studentToDeleteId, setStudentToDeleteId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        // A. Fetch Global Settings first
        const settingsRef = doc(db, "settings", "global");
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          // Use optional chaining and nullish coalescing to be safe
          const allowDelete =
            settingsSnap.data()?.allowTeacherDeleteStudents ?? true;
          setCanDeleteStudents(allowDelete);
        }

        // B. Fetch Students
        const usersRef = collection(db, "users");
        const q = query(
          usersRef,
          where("role", "==", "student"),
          where("createdByTeacherId", "==", currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const studentList = [];
        querySnapshot.forEach((doc) => {
          studentList.push({ id: doc.id, ...doc.data() });
        });
        setStudents(studentList);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // --- Dialog Handlers ---
  const handleOpenAddDialog = () => {
    setStudentToEdit(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (studentData) => {
    setStudentToEdit(studentData);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setStudentToEdit(null);
  };

  // --- Delete Handlers ---
  const promptDelete = (studentId) => {
    // Extra safety check
    if (!canDeleteStudents) return;
    setStudentToDeleteId(studentId);
    setDeleteConfirmationOpen(true);
  };

  const cancelDelete = () => {
    setDeleteConfirmationOpen(false);
    setStudentToDeleteId(null);
  };

  const confirmDelete = async () => {
    if (!studentToDeleteId || !canDeleteStudents) return;
    try {
      await deleteDoc(doc(db, "users", studentToDeleteId));
      // Refresh list (re-fetches settings too, which is fine)
      const fetchData = async () => {
        /* ... same fetch logic as above ... */
      };
      // A simpler way is to just reload the window or re-run the effect,
      // but let's just manually filter the local state for now to be fast.
      setStudents((prev) => prev.filter((s) => s.id !== studentToDeleteId));

      setDeleteConfirmationOpen(false);
      setStudentToDeleteId(null);
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student.");
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" component="h2">
          Manage Students
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={handleOpenAddDialog}
        >
          Add Student
        </Button>
      </Box>

      {/* Optional: Show an alert if deletion is disabled */}
      {!canDeleteStudents && !loading && (
        <Typography
          variant="caption"
          color="error"
          sx={{ display: "block", mb: 2, fontStyle: "italic" }}
        >
          Notice: Student deletion has been temporarily disabled by the
          administrator.
        </Typography>
      )}

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead sx={{ bgcolor: "#f5f5f5" }}>
            <TableRow>
              <TableCell>Name/Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="center">Total Points</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow style={{ height: 53 * 5 }}>
                <TableCell colSpan={4} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography sx={{ py: 3 }}>
                    No students found. Click "Add Student" to begin.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell component="th" scope="row">
                    <Typography variant="subtitle2">
                      {student.displayName || "No Name Set"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {student.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={student.role}
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontWeight="bold" color="primary.main">
                      {student.totalPoints || 0}
                    </Typography>
                  </TableCell>

                  <TableCell align="right">
                    <Tooltip title="Edit Student Details">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleOpenEditDialog(student)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>

                    {/* 4. UPDATE DELETE BUTTON with conditional disabling and Tooltip */}
                    <Tooltip
                      title={
                        canDeleteStudents
                          ? "Delete Student"
                          : "Deletion disabled by Admin"
                      }
                    >
                      {/* We wrap in a span so the tooltip works even when disabled */}
                      <span>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => promptDelete(student.id)}
                          disabled={!canDeleteStudents} // <--- THE KEY CHANGE
                        >
                          <DeleteIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <AddStudentDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        // Simple refresh function
        onStudentSaved={() => window.location.reload()}
        studentToEdit={studentToEdit}
      />

      <Dialog open={deleteConfirmationOpen} onClose={cancelDelete}>
        <DialogTitle>Delete Student?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this student? They will no longer be
            able to log in.
            <br />
            <br />
            <b>Note: This action is irreversible.</b>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete}>Cancel</Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            autoFocus
          >
            Delete Student
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentsPage;
