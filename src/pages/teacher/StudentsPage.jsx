import { useState, useEffect } from 'react';
import { db } from '../../firebase';
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

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to fetch students from Firestore
  const fetchStudents = async () => {
    setLoading(true);
    try {
      // 1. Reference the 'users' collection
      const usersRef = collection(db, 'users');
      // 2. Create a query against the collection where role == 'student'
      const q = query(usersRef, where("role", "==", "student"));
      // 3. Execute the query
      const querySnapshot = await getDocs(q);
      
      // 4. Map the results into a nice array
      const studentList = [];
      querySnapshot.forEach((doc) => {
        // doc.data() is the object { email: '...', role: '...' }
        // doc.id is the Firebase UID
        studentList.push({ id: doc.id, ...doc.data() });
      });
      
      setStudents(studentList);
    } catch (error) {
      console.error("Error fetching students:", error);
      // In a real app, you'd show a Snackbar error message here
    } finally {
      setLoading(false);
    }
  };

  // Run the fetch function automatically when the component mounts
  useEffect(() => {
    fetchStudents();
  }, []);

  return (
    <Box>
      {/* Header section with title and Add button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Manage Students
        </Typography>
        <Button 
            variant="contained" 
            startIcon={<PersonAddIcon />}
            // We will wire this button up in the next step
            onClick={() => alert('Add student dialog coming next!')}
        >
          Add Student
        </Button>
      </Box>

      {/* The Data Table */}
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
              // Show spinner inside table while loading
              <TableRow style={{ height: 53 * 5 }}>
                <TableCell colSpan={4} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              // Show message if no students found
              <TableRow>
                 <TableCell colSpan={4} align="center">
                   <Typography variant="subtitle1" sx={{ py: 3 }}>
                     No students found. Click "Add Student" to begin.
                   </Typography>
                 </TableCell>
              </TableRow>
            ) : (
              // Map through the student array and create rows
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
    </Box>
  );
};

export default StudentsPage;