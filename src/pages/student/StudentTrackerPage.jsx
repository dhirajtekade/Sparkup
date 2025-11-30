import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, Chip
} from '@mui/material';
import dayjs from 'dayjs';

const StudentTrackerPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [daysOfMonth, setDaysOfMonth] = useState([]);
  const [studentData, setStudentData] = useState(null);

  // 1. Helper function to get all days in current month up to today
  const getDaysInMonth = () => {
    const now = dayjs();
    const daysInMonth = now.daysInMonth(); // e.g., 30 or 31
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const date = now.date(i);
      // Only add days up to today (future days not needed yet)
      if (date.isAfter(now, 'day')) break;
      days.push(date);
    }
    return days;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        // A. Calculate date columns
        const days = getDaysInMonth();
        setDaysOfMonth(days);

        // B. Fetch Student Data to get their Teacher ID
        const studentDocRef = doc(db, 'users', currentUser.uid);
        const studentDocSnap = await getDoc(studentDocRef);
        if (!studentDocSnap.exists()) throw new Error("Student profile not found");
        const sData = studentDocSnap.data();
        setStudentData(sData);
        const teacherId = sData.createdByTeacherId;

        // C. Fetch Active Tasks created by THEIR teacher
        const tasksRef = collection(db, 'task_templates');
        // Filter: Created by my teacher AND is active
        const q = query(
            tasksRef, 
            where("createdByTeacherId", "==", teacherId),
            where("isActive", "==", true)
        );
        
        // NOTE: You might need to create another Firebase index for this query.
        // Check the console if it fails.

        const querySnapshot = await getDocs(q);
        const taskList = [];
        querySnapshot.forEach((doc) => {
            taskList.push({ id: doc.id, ...doc.data() });
        });
        setTasks(taskList);

      } catch (error) {
        console.error("Error loading tracker:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  }

  if (!studentData || tasks.length === 0) {
      return <Typography>No tasks assigned yet.</Typography>;
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Daily Tracker: {dayjs().format('MMMM YYYY')}
      </Typography>
      
      <TableContainer component={Paper} sx={{ maxHeight: '80vh' }}>
        <Table stickyHeader size="small" aria-label="sticky table">
          <TableHead>
            <TableRow>
              {/* First column fixed for Task Names */}
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', zIndex: 3, position: 'sticky', left: 0 }}>
                Task / Date
              </TableCell>
              {/* Render Date Columns */}
              {daysOfMonth.map((day) => (
                <TableCell key={day.toString()} align="center" sx={{ minWidth: 50, backgroundColor: day.isSame(dayjs(), 'day') ? '#e3f2fd' : 'inherit' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="caption" color="text.secondary">{day.format('ddd')}</Typography>
                      <Typography variant="body2" fontWeight="bold">{day.format('D')}</Typography>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id} hover>
                {/* Fixed Task Name Column */}
                <TableCell component="th" scope="row" sx={{ position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 1 }}>
                  <Box>
                      <Typography variant="body2" fontWeight={500}>{task.name}</Typography>
                      <Chip label={`${task.points} pts`} size="small" color="primary" variant="outlined" sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }} />
                  </Box>
                </TableCell>
                {/* Render Checkbox Cells (Empty placeholders for now) */}
                {daysOfMonth.map((day) => (
                  <TableCell key={day.toString()} align="center" sx={{ borderLeft: '1px solid rgba(224, 224, 224, 1)' }}>
                    {/* We will put the checkbox here in the next step */}
                    <Box sx={{ width: 24, height: 24, border: '1px dashed #ccc', borderRadius: '4px', margin: 'auto' }}></Box>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default StudentTrackerPage;