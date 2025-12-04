import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { useAuth } from "../../contexts/AuthContext";
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
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip,
  Container,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddStudentDialog from "../../components/AddStudentDialog";

const StudentsPage = () => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
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
        const settingsRef = doc(db, "settings", "global");
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          const allowDelete =
            settingsSnap.data()?.allowTeacherDeleteStudents ?? true;
          setCanDeleteStudents(allowDelete);
        }
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

  // --- Handlers ---
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
  const promptDelete = (studentId) => {
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
      setStudents((prev) => prev.filter((s) => s.id !== studentToDeleteId));
      setDeleteConfirmationOpen(false);
      setStudentToDeleteId(null);
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student.");
    }
  };

  return (
    // UPDATED CONTAINER: Constrained width ("md") and forced left alignment (ml: 0)
    <Container maxWidth="md" sx={{ ml: 0 }}>
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
        <Table sx={{ width: "100%" }} aria-label="simple table">
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
                    <Tooltip
                      title={
                        canDeleteStudents
                          ? "Delete Student"
                          : "Deletion disabled by Admin"
                      }
                    >
                      <span>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => promptDelete(student.id)}
                          disabled={!canDeleteStudents}
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
        onStudentSaved={() => window.location.reload()}
        studentToEdit={studentToEdit}
      />
      <Dialog open={deleteConfirmationOpen} onClose={cancelDelete}>
        <DialogTitle>Delete Student?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this student? This action is
            irreversible.
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
    </Container>
  );
};

export default StudentsPage;
