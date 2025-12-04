import { useState, useEffect, useMemo } from "react";
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
  TableSortLabel,
  // 1. NEW IMPORTS for photo column
  Avatar,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
// 2. NEW IMPORT for default photo icon
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AddStudentDialog from "../../components/AddStudentDialog";

// Helper function for comparing values (unchanged)
function descendingComparator(a, b, orderBy) {
  let aValue = a[orderBy];
  let bValue = b[orderBy];

  if (orderBy === "totalPoints") {
    aValue = aValue || 0;
    bValue = bValue || 0;
  }

  if (typeof aValue === "string" && typeof bValue === "string") {
    const aName = (a.displayName || a.email || "").toLowerCase();
    const bName = (b.displayName || b.email || "").toLowerCase();
    if (bName < aName) return -1;
    if (bName > aName) return 1;
    return 0;
  }

  if (bValue < aValue) return -1;
  if (bValue > aValue) return 1;
  return 0;
}

function getComparator(order, orderBy) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

const StudentsPage = () => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canDeleteStudents, setCanDeleteStudents] = useState(true);

  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("displayName");

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

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedStudents = useMemo(() => {
    return [...students].sort(getComparator(order, orderBy));
  }, [students, order, orderBy]);

  return (
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
              {/* 3. NEW Header Cell for Photo */}
              <TableCell sx={{ width: 60 }}>Photo</TableCell>

              <TableCell>
                <TableSortLabel
                  active={orderBy === "displayName"}
                  direction={orderBy === "displayName" ? order : "asc"}
                  onClick={() => handleRequestSort("displayName")}
                >
                  Name/Email
                </TableSortLabel>
              </TableCell>

              <TableCell>Role</TableCell>

              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === "totalPoints"}
                  direction={orderBy === "totalPoints" ? order : "asc"}
                  onClick={() => handleRequestSort("totalPoints")}
                >
                  Total Points
                </TableSortLabel>
              </TableCell>

              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow style={{ height: 53 * 5 }}>
                <TableCell colSpan={5} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : sortedStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography sx={{ py: 3 }}>
                    No students found. Click "Add Student" to begin.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              sortedStudents.map((student) => (
                <TableRow key={student.id}>
                  {/* 4. NEW Body Cell for Photo using Avatar component */}
                  <TableCell>
                    <Avatar
                      src={student.photoUrl}
                      alt={student.displayName || "Student"}
                      sx={{ bgcolor: "grey.300" }} // Background color for transparent images or fallback
                    >
                      {/* This icon shows automatically if src is empty or fails to load */}
                      <AccountCircleIcon />
                    </Avatar>
                  </TableCell>

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
