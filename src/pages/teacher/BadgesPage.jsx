import { useState, useEffect, useMemo } from "react";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  orderBy as firestoreOrderBy,
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
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Container,
  // 1. Add TableSortLabel
  TableSortLabel,
} from "@mui/material";
import StarsIcon from "@mui/icons-material/Stars";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddBadgeDialog from "../../components/AddBadgeDialog";
import BadgeToken from "../../utils/badgeTokenRenderer";

// 2. Helper functions for client-side sorting
function descendingComparator(a, b, orderByField) {
  let aValue = a[orderByField];
  let bValue = b[orderByField];

  // Handle numeric fields safely
  if (["minPoints", "maxPoints"].includes(orderByField)) {
    aValue = Number(aValue) || 0;
    bValue = Number(bValue) || 0;
  }

  // Handle string comparison (Name/Description) - case-insensitive
  if (typeof aValue === "string" && typeof bValue === "string") {
    const aStr = aValue.toLowerCase();
    const bStr = bValue.toLowerCase();
    if (bStr < aStr) return -1;
    if (bStr > aStr) return 1;
    return 0;
  }

  // Handle boolean (Status)
  // We want "Active" (true) to come before "Inactive" (false) in ascending order
  if (orderByField === "isActive") {
    // Map true to 1, false to 2 so true comes first in asc sort
    aValue = aValue === true ? 1 : 2;
    bValue = bValue === true ? 1 : 2;
  }

  // Default comparison
  if (bValue < aValue) return -1;
  if (bValue > aValue) return 1;
  return 0;
}

function getComparator(order, orderByField) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderByField)
    : (a, b) => -descendingComparator(a, b, orderByField);
}

const BadgesPage = () => {
  const { currentUser } = useAuth();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  // 3. New State for sorting
  const [order, setOrder] = useState("asc");
  // Default sort by minimum points
  const [orderBy, setOrderBy] = useState("minPoints");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [badgeToEdit, setBadgeToEdit] = useState(null);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [badgeToDeleteId, setBadgeToDeleteId] = useState(null);

  const fetchBadges = async () => {
    if (!currentUser?.uid) return;
    setLoading(true);
    try {
      const badgesRef = collection(db, "badges");
      // Initial fetch still uses Firestore sort for efficiency
      const q = query(
        badgesRef,
        where("createdByTeacherId", "==", currentUser.uid),
        firestoreOrderBy("minPoints", "asc")
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

  // 4. Header click handler
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  // 5. Calculate sorted badges
  const sortedBadges = useMemo(() => {
    return [...badges].sort(getComparator(order, orderBy));
  }, [badges, order, orderBy]);

  return (
    <Container maxWidth="lg">
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

              {/* 6. Sortable Headers */}
              <TableCell>
                <TableSortLabel
                  active={orderBy === "name"}
                  direction={orderBy === "name" ? order : "asc"}
                  onClick={() => handleRequestSort("name")}
                >
                  Badge Name
                </TableSortLabel>
              </TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === "minPoints"}
                  direction={orderBy === "minPoints" ? order : "asc"}
                  onClick={() => handleRequestSort("minPoints")}
                >
                  Min Points
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === "maxPoints"}
                  direction={orderBy === "maxPoints" ? order : "asc"}
                  onClick={() => handleRequestSort("maxPoints")}
                >
                  Max Points
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === "isActive"}
                  direction={orderBy === "isActive" ? order : "asc"}
                  onClick={() => handleRequestSort("isActive")}
                >
                  Status
                </TableSortLabel>
              </TableCell>

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
            ) : sortedBadges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography sx={{ py: 3 }}>No badges found.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              // 7. Render sortedBadges
              sortedBadges.map((badge) => (
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
