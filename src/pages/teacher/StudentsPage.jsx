import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
// 1. Add deleteDoc and doc imports
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Chip,
  // 2. Add Dialog imports
  IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
// 3. Add Icon imports
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddStudentDialog from '../../components/AddStudentDialog';

const StudentsPage = () => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // 4. State for Add/Edit Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);

  // 5. State for Delete Confirmation
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [studentToDeleteId, setStudentToDeleteId] = useState(null);

  const fetchStudents = async () => {
    if (!currentUser?.uid) return;
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
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
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, [currentUser]);

  // --- Dialog Handlers ---
  const handleOpenAddDialog = () => {
    setStudentToEdit(null);
    setIsDialogOpen(true);
  }

  const handleOpenEditDialog = (studentData) => {
    setStudentToEdit(studentData);
    setIsDialogOpen(true);
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setStudentToEdit(null);
  }

  // --- Delete Handlers ---
  const promptDelete = (studentId) => {
    setStudentToDeleteId(studentId);
    setDeleteConfirmationOpen(true);
  }

  const cancelDelete = () => {
    setDeleteConfirmationOpen(false);
    setStudentToDeleteId(null);
  }

  const confirmDelete = async () => {
    if(!studentToDeleteId) return;
    try {
        // This deletes the Firestore document only. 
        // The Auth account still exists but won't be able to log in fully.
        await deleteDoc(doc(db, "users", studentToDeleteId));
        fetchStudents();
        setDeleteConfirmationOpen(false);
        setStudentToDeleteId(null);
    } catch (error) {
        console.error("Error deleting student:", error);
        alert("Failed to delete student.");
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">Manage Students</Typography>
        {/* 6. Update Add Button click handler */}
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={handleOpenAddDialog}>
          Add Student
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Name/Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="center">Total Points</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow style={{ height: 53 * 5 }}><TableCell colSpan={4} align="center"><CircularProgress /></TableCell></TableRow>
            ) : students.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center"><Typography sx={{ py: 3 }}>No students found. Click "Add Student" to begin.</Typography></TableCell></TableRow>
            ) : (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell component="th" scope="row">
                    <Typography variant="subtitle2">{student.displayName || 'No Name Set'}</Typography>
                    <Typography variant="caption" color="text.secondary">{student.email}</Typography>
                  </TableCell>
                  <TableCell><Chip label={student.role} size="small" color="secondary" variant="outlined" /></TableCell>
                  <TableCell align="center">
                      <Typography fontWeight="bold" color="primary.main">{student.totalPoints || 0}</Typography>
                  </TableCell>
                  
                  {/* 7. Update Actions Cell with Icons */}
                  <TableCell align="right">
                    <IconButton color="primary" size="small" onClick={() => handleOpenEditDialog(student)}>
                        <EditIcon />
                    </IconButton>
                    <IconButton color="error" size="small" onClick={() => promptDelete(student.id)}>
                        <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 8. Update Dialog Props */}
      <AddStudentDialog 
        open={isDialogOpen} 
        onClose={handleDialogClose} 
        onStudentSaved={fetchStudents} // Renamed prop for clarity
        studentToEdit={studentToEdit}
      />

      {/* 9. Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmationOpen} onClose={cancelDelete}>
        <DialogTitle>Delete Student?</DialogTitle>
        <DialogContent>
          <DialogContentText>
              Are you sure you want to delete this student? They will no longer be able to log in.
              <br/><br/>
              <b>Note: This action is irreversible.</b>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" autoFocus>Delete Student</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentsPage;