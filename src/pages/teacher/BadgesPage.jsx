import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress, Chip, Avatar
} from '@mui/material';
import StarsIcon from '@mui/icons-material/Stars';
import AddBadgeDialog from '../../components/AddBadgeDialog';

const BadgesPage = () => {
  const { currentUser } = useAuth();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchBadges = async () => {
    if (!currentUser?.uid) return;
    setLoading(true);
    try {
      const badgesRef = collection(db, 'badges');
      // FILTER QUERY BY TEACHER ID
      const q = query(
          badgesRef, 
          where("createdByTeacherId", "==", currentUser.uid),
          orderBy("pointsRequired", "asc")
      );
      
      const querySnapshot = await getDocs(q);
      const badgeList = [];
      querySnapshot.forEach((doc) => badgeList.push({ id: doc.id, ...doc.data() }));
      setBadges(badgeList);
    } catch (error) {
      console.error("Error fetching badges:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBadges(); }, [currentUser]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Manage Badges</Typography>
        <Button variant="contained" startIcon={<StarsIcon />} onClick={() => setIsDialogOpen(true)}>
          Add Badge
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table aria-label="badges table">
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Badge Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="center">Points Required</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow style={{ height: 53 * 5 }}><TableCell colSpan={6} align="center"><CircularProgress /></TableCell></TableRow>
            ) : badges.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center"><Typography sx={{ py: 3 }}>No badges found.</Typography></TableCell></TableRow>
            ) : (
              badges.map((badge) => (
                <TableRow key={badge.id}>
                  <TableCell>
                      {/* Display image if URL exists, else default icon */}
                      {badge.imageUrl ? <Avatar src={badge.imageUrl} variant="rounded" /> : <StarsIcon color="disabled" fontSize="large" />}
                  </TableCell>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>{badge.name}</TableCell>
                  <TableCell sx={{ maxWidth: 300 }}>{badge.description}</TableCell>
                  <TableCell align="center"><Chip label={badge.pointsRequired} color="secondary" size="small" /></TableCell>
                   <TableCell align="center">{badge.isActive ? <Chip label="Active" color="success" size="small" variant="outlined" /> : "Inactive"}</TableCell>
                  <TableCell align="right"><Button size="small" color="inherit">Edit</Button></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <AddBadgeDialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} onBadgeAdded={fetchBadges}/>
    </Box>
  );
};

export default BadgesPage;