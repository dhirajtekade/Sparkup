import { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
} from "firebase/firestore";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Alert,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";

const ManageTeachersPage = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      // Query for all users with the 'teacher' role
      const q = query(
        usersRef,
        where("role", "==", "teacher"),
        orderBy("email", "asc")
      );

      // Note: If you get a Firebase index error in the console, click the link provided.
      const querySnapshot = await getDocs(q);
      const teacherList = [];
      querySnapshot.forEach((doc) => {
        teacherList.push({ id: doc.id, ...doc.data() });
      });
      setTeachers(teacherList);
    } catch (err) {
      console.error("Error fetching teachers:", err);
      setError("Failed to load teacher list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // --- Delete Handlers ---
  const promptDelete = (teacher) => {
    setTeacherToDelete(teacher);
    setDeleteDialogOpen(true);
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setTeacherToDelete(null);
  };

  const confirmDelete = async () => {
    if (!teacherToDelete) return;
    setDeleteLoading(true);
    try {
      // 1. Delete the teacher's user document from Firestore
      await deleteDoc(doc(db, "users", teacherToDelete.id));

      // Note: We are NOT deleting their associated data (students, tasks, etc.) in this version.
      // That data will become orphaned. A full system would need a cloud function to clean that up.

      // 2. Refresh the list
      fetchTeachers();
      setDeleteDialogOpen(false);
      setTeacherToDelete(null);
    } catch (err) {
      console.error("Error deleting teacher:", err);
      alert("Failed to delete teacher document.");
    } finally {
      setDeleteLoading(false);
    }
  };

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
        <SupervisorAccountIcon sx={{ mr: 2, fontSize: 40 }} /> Manage Teachers
      </Typography>
      <Typography variant="subtitle1" sx={{ mb: 4, color: "text.secondary" }}>
        View and manage all registered teacher accounts on the platform.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} elevation={3}>
        <Table sx={{ minWidth: 650 }} aria-label="teachers table">
          <TableHead sx={{ bgcolor: "#ffebee" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Teacher Email</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Display Name</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                Account Status
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow style={{ height: 53 * 5 }}>
                <TableCell colSpan={4} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : teachers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  <Typography sx={{ py: 3 }}>
                    No teacher accounts found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              teachers.map((teacher) => (
                <TableRow key={teacher.id} hover>
                  <TableCell
                    component="th"
                    scope="row"
                    sx={{ fontWeight: "medium" }}
                  >
                    {teacher.email}
                  </TableCell>
                  <TableCell>
                    {teacher.displayName || (
                      <Typography variant="caption" color="text.secondary">
                        Not Set
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label="Active"
                      color="success"
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={() => promptDelete(teacher)}
                    >
                      Delete Account
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={deleteLoading ? null : cancelDelete}
      >
        <DialogTitle sx={{ color: "error.main" }}>
          ⚠️ Delete Teacher Account?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the admin account for{" "}
            <b>{teacherToDelete?.email}</b>?
          </DialogContentText>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <b>Warning:</b> This will only remove their login access. All
            students, tasks, and data created by this teacher will remain in the
            database as "orphaned" data.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Delete Teacher"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageTeachersPage;
