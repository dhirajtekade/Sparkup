import { useState, useEffect } from "react";
import { db } from "../../firebase";
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
  // 1. Add Container
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
  Container,
} from "@mui/material";
import StarsIcon from "@mui/icons-material/Stars";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddBadgeDialog from "../../components/AddBadgeDialog";
import BadgeToken from "../../utils/badgeTokenRenderer";

const BadgesPage = () => {
  const { currentUser } = useAuth();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [badgeToEdit, setBadgeToEdit] = useState(null);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [badgeToDeleteId, setBadgeToDeleteId] = useState(null);

  const fetchBadges = async () => {
    if (!currentUser?.uid) return;
    setLoading(true);
    try {
      const badgesRef = collection(db, "badges");
      const q = query(
        badgesRef,
        where("createdByTeacherId", "==", currentUser.uid),
        orderBy("minPoints", "asc")
      );

      const querySnapshot = await getDocs(q);
      const badgeList = [];
      querySnapshot.forEach((doc) =>
        badgeList.push({ id: doc.id, ...doc.data() })
      );
      setBadges(badgeList);
    } catch (error) {
      console.error("Error fetching badges:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBadges();
  }, [currentUser]);

  // --- Handlers ---
  const handleOpenAddDialog = () => {
    setBadgeToEdit(null);
    setIsDialogOpen(true);
  };
  const handleOpenEditDialog = (badgeData) => {
    setBadgeToEdit(badgeData);
    setIsDialogOpen(true);
  };
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setBadgeToEdit(null);
  };
  const promptDelete = (badgeId) => {
    setBadgeToDeleteId(badgeId);
    setDeleteConfirmationOpen(true);
  };
  const cancelDelete = () => {
    setDeleteConfirmationOpen(false);
    setBadgeToDeleteId(null);
  };
  const confirmDelete = async () => {
    if (!badgeToDeleteId) return;
    try {
      await deleteDoc(doc(db, "badges", badgeToDeleteId));
      fetchBadges();
      setDeleteConfirmationOpen(false);
      setBadgeToDeleteId(null);
    } catch (error) {
      console.error("Error deleting badge:", error);
      alert("Failed to delete badge.");
    }
  };

  return (
    // 2. Use Container to constrain width
    <Container maxWidth="md" sx={{ ml: 0 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5">Manage Badges</Typography>
        <Button
          variant="contained"
          startIcon={<StarsIcon />}
          onClick={handleOpenAddDialog}
        >
          Add Badge
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ width: "100%" }} aria-label="badges table">
          <TableHead sx={{ bgcolor: "#f5f5f5" }}>
            <TableRow>
              <TableCell>Token</TableCell>
              <TableCell>Badge Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="center">Min Points</TableCell>
              <TableCell align="center">Max Points</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow style={{ height: 53 * 5 }}>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : badges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography sx={{ py: 3 }}>No badges found.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              badges.map((badge) => (
                <TableRow key={badge.id}>
                  <TableCell>
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                      <BadgeToken
                        name={badge.name}
                        minPoints={badge.minPoints}
                        maxPoints={badge.maxPoints}
                        size={50}
                      />
                    </Box>
                  </TableCell>
                  <TableCell
                    component="th"
                    scope="row"
                    sx={{ fontWeight: "bold" }}
                  >
                    {badge.name}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 300 }}>
                    {badge.description}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={badge.minPoints}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={badge.maxPoints}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {badge.isActive ? (
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
                  <TableCell align="right" sx={{ minWidth: 120 }}>
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleOpenEditDialog(badge)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => promptDelete(badge.id)}
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

      <AddBadgeDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        onBadgeSaved={fetchBadges}
        badgeToEdit={badgeToEdit}
      />
      <Dialog open={deleteConfirmationOpen} onClose={cancelDelete}>
        <DialogTitle>Delete Badge?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this badge? This action cannot be
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
    </Container>
  );
};

export default BadgesPage;
