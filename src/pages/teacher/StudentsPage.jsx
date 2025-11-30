import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
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
  Chip
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
// 1. Import the new dialog component
import AddStudentDialog from '../../components/AddStudentDialog';

const StudentsPage = () => {
    const { currentUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  // 2. State to control dialog visibility
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchStudents = async () => {
    // ... (Keep existing fetchStudents logic exactly the same) ...
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef, 
        where("role", "==", "student"),
        where("createdByTeacherId", "==", currentUser.uid) // <--- CRITICAL UPDATE
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

  useEffect(() => {
    fetchStudents();
  }, [currentUser]);

  // 3. Handler for when a student is successfully added
  const handleStudentAdded = () => {
    // Refresh the list to show the new student
    fetchStudents();
    // Show success message (optional, can add Snackbar later)
    console.log("Student added successfully!");
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Manage Students
        </Typography>
        <Button 
            variant="contained" 
            startIcon={<PersonAddIcon />}
            // 4. Update click handler to open dialog
            onClick={() => setIsDialogOpen(true)}
        >
          Add Student
        </Button>
      </Box>

      <TableContainer component={Paper}>
        {/* ... (Keep existing Table logic exactly the same) ... */}
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
              <TableRow style={{ height: 53 * 5 }}>
                <TableCell colSpan={4} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                 <TableCell colSpan={4} align="center">
                   <Typography variant="subtitle1" sx={{ py: 3 }}>
                     No students found. Click "Add Student" to begin.
                   </Typography>
                 </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow
                  key={student.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    <Typography variant="subtitle2">
                        {student.displayName || 'No Name Set'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {student.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={student.role} size="small" color="secondary" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                      <Typography fontWeight="bold" color="primary.main">
                        {student.totalPoints || 0}
                      </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" color="inherit">Edit</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 5. Render the Dialog Component */}
      <AddStudentDialog 
        open={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        onStudentAdded={handleStudentAdded}
      />
    </Box>
  );
};

export default StudentsPage;