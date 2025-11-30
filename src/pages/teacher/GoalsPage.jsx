import { useState, useEffect } from "react";
import { db } from "../../firebase";
// 1. Add deleteDoc and doc imports
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
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
  Avatar,
  // 2. Add Dialog imports
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
// 3. Add Icon imports
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddGoalDialog from "../../components/AddGoalDialog";

const GoalsPage = () => {
  const { currentUser } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // 4. State for Add/Edit Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState(null);

  // 5. State for Delete Confirmation
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [goalToDeleteId, setGoalToDeleteId] = useState(null);

  const fetchGoals = async () => {
    if (!currentUser?.uid) return;
    setLoading(true);
    try {
      const goalsRef = collection(db, "goals");
      const q = query(
        goalsRef,
        where("createdByTeacherId", "==", currentUser.uid),
        orderBy("targetPoints", "asc")
      );

      // NOTE: If this query fails with an index error in the console, click the provided link to create it.
      const querySnapshot = await getDocs(q);
      const goalList = [];
      querySnapshot.forEach((doc) =>
        goalList.push({ id: doc.id, ...doc.data() })
      );
      setGoals(goalList);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [currentUser]);

  // --- Dialog Handlers ---
  const handleOpenAddDialog = () => {
    setGoalToEdit(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (goalData) => {
    setGoalToEdit(goalData);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setGoalToEdit(null);
  };

  // --- Delete Handlers ---
  const promptDelete = (goalId) => {
    setGoalToDeleteId(goalId);
    setDeleteConfirmationOpen(true);
  };

  const cancelDelete = () => {
    setDeleteConfirmationOpen(false);
    setGoalToDeleteId(null);
  };

  const confirmDelete = async () => {
    if (!goalToDeleteId) return;
    try {
      await deleteDoc(doc(db, "goals", goalToDeleteId));
      fetchGoals(); // Refresh list
      setDeleteConfirmationOpen(false);
      setGoalToDeleteId(null);
    } catch (error) {
      console.error("Error deleting goal:", error);
      alert("Failed to delete goal.");
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
        <Typography variant="h5">Manage Goals</Typography>
        {/* 6. Update Add Button click handler */}
        <Button
          variant="contained"
          startIcon={<EmojiEventsIcon />}
          onClick={handleOpenAddDialog}
        >
          Add Goal
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table aria-label="goals table">
          <TableHead sx={{ bgcolor: "#f5f5f5" }}>
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
              <TableRow style={{ height: 53 * 5 }}>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : goals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography sx={{ py: 3 }}>No goals found.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              goals.map((goal) => (
                <TableRow key={goal.id}>
                  <TableCell>
                    {goal.imageUrl ? (
                      <Avatar src={goal.imageUrl} variant="rounded" />
                    ) : (
                      <EmojiEventsIcon color="disabled" fontSize="large" />
                    )}
                  </TableCell>
                  <TableCell
                    component="th"
                    scope="row"
                    sx={{ fontWeight: "bold" }}
                  >
                    {goal.name}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 300 }}>
                    {goal.description}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={goal.targetPoints}
                      color="primary"
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {goal.isActive ? (
                      <Chip
                        label="Active"
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      "Inactive"
                    )}
                  </TableCell>

                  {/* 7. Update Actions Cell with Icons */}
                  <TableCell align="right" sx={{ minWidth: 120 }}>
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleOpenEditDialog(goal)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => promptDelete(goal.id)}
                    >
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
      <AddGoalDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        onGoalSaved={fetchGoals} // Renamed prop for clarity
        goalToEdit={goalToEdit}
      />

      {/* 9. Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmationOpen} onClose={cancelDelete}>
        <DialogTitle>Delete Goal?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this goal? This action cannot be
            undone.
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
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GoalsPage;
