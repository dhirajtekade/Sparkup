import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Chip, Avatar
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AddGoalDialog from '../../components/AddGoalDialog';

const GoalsPage = () => {
  const { currentUser } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchGoals = async () => {
    if (!currentUser?.uid) return;
    setLoading(true);
    try {
      const goalsRef = collection(db, 'goals');
      // FILTER BY TEACHER ID
      const q = query(
          goalsRef, 
          where("createdByTeacherId", "==", currentUser.uid),
          orderBy("targetPoints", "asc")
      );
      
      const querySnapshot = await getDocs(q);
      const goalList = [];
      querySnapshot.forEach((doc) => goalList.push({ id: doc.id, ...doc.data() }));
      setGoals(goalList);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchGoals(); }, [currentUser]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Manage Goals</Typography>
        <Button variant="contained" startIcon={<EmojiEventsIcon />} onClick={() => setIsDialogOpen(true)}>
          Add Goal
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table aria-label="goals table">
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Goal Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="center">Target Points</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow style={{ height: 53 * 5 }}><TableCell colSpan={6} align="center"><CircularProgress /></TableCell></TableRow>
            ) : goals.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center"><Typography sx={{ py: 3 }}>No goals found.</Typography></TableCell></TableRow>
            ) : (
              goals.map((goal) => (
                <TableRow key={goal.id}>
                  <TableCell>{goal.imageUrl ? <Avatar src={goal.imageUrl} variant="rounded" /> : <EmojiEventsIcon color="disabled" fontSize="large" />}</TableCell>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>{goal.name}</TableCell>
                  <TableCell sx={{ maxWidth: 300 }}>{goal.description}</TableCell>
                  <TableCell align="center"><Chip label={goal.targetPoints} color="primary" size="small" /></TableCell>
                   <TableCell align="center">{goal.isActive ? <Chip label="Active" color="success" size="small" variant="outlined" /> : "Inactive"}</TableCell>
                  <TableCell align="right"><Button size="small" color="inherit">Edit</Button></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <AddGoalDialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} onGoalAdded={fetchGoals}/>
    </Box>
  );
};

export default GoalsPage;