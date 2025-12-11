import { useState, useEffect, useMemo } from "react";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  orderBy as firestoreOrderBy,
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
  TableSortLabel,
  Tooltip, // NEW
} from "@mui/material";
import AddTaskIcon from "@mui/icons-material/AddTask";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoIcon from "@mui/icons-material/Info"; // NEW
import dayjs from "dayjs";
import AddTaskDialog from "../../components/AddTaskDialog";

// Helper functions for client-side sorting (including Dates)
function descendingComparator(a, b, orderByField) {
  let aValue = a[orderByField];
  let bValue = b[orderByField];

  // Handle numeric fields
  if (orderByField === "points" || orderByField === "requiredDays") {
    aValue = Number(aValue) || 0;
    bValue = Number(bValue) || 0;
  }

  // Handle Date fields (ensure they are date objects or timestamps for comparison)
  if (["startDate", "endDate"].includes(orderByField)) {
    // These are already converted to JS Dates in fetchTasks, so simple subtraction works
    // Handle nulls just in case
    const aDate = aValue ? new Date(aValue) : new Date(0);
    const bDate = bValue ? new Date(bValue) : new Date(0);
    if (bDate < aDate) return -1;
    if (bDate > aDate) return 1;
    return 0;
  }

  // Handle string comparison (Name/RecurType) - case-insensitive
  if (typeof aValue === "string" && typeof bValue === "string") {
    const aStr = aValue.toLowerCase();
    const bStr = bValue.toLowerCase();
    if (bStr < aStr) return -1;
    if (bStr > aStr) return 1;
    return 0;
  }

  // Handle boolean (Status) - Active (true) first in asc
  if (orderByField === "isActive") {
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

const TasksPage = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // New State for sorting
  const [order, setOrder] = useState("asc");
  // Default sort by Name
  const [orderBy, setOrderBy] = useState("name");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState(null);

  const fetchTasks = async () => {
    if (!currentUser?.uid) return;
    setLoading(true);
    try {
      const tasksRef = collection(db, "task_templates");
      // Initial fetch order (can remain name asc)
      const q = query(
        tasksRef,
        where("createdByTeacherId", "==", currentUser.uid),
        firestoreOrderBy("name", "asc")
      );

      const querySnapshot = await getDocs(q);
      const taskList = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        taskList.push({
          id: doc.id,
          ...data,
          // Convert Firestore timestamps to JS Dates for easier handling
          startDate: data.startDate?.toDate(),
          endDate: data.endDate?.toDate(),
        });
      });
      setTasks(taskList);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [currentUser]);

  // --- Handlers ---
  const handleOpenAddDialog = () => {
    setTaskToEdit(null);
    setIsDialogOpen(true);
  };
  const handleOpenEditDialog = (taskData) => {
    setTaskToEdit(taskData);
    setIsDialogOpen(true);
  };
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setTaskToEdit(null);
  };
  const promptDelete = (taskId) => {
    setTaskToDeleteId(taskId);
    setDeleteConfirmationOpen(true);
  };
  const cancelDelete = () => {
    setDeleteConfirmationOpen(false);
    setTaskToDeleteId(null);
  };
  const confirmDelete = async () => {
    if (!taskToDeleteId) return;
    try {
      await deleteDoc(doc(db, "task_templates", taskToDeleteId));
      fetchTasks();
      setDeleteConfirmationOpen(false);
      setTaskToDeleteId(null);
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task.");
    }
  };

  // Header click handler
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  // Calculate sorted tasks
  const sortedTasks = useMemo(() => {
    return [...tasks].sort(getComparator(order, orderBy));
  }, [tasks, order, orderBy]);

  return (
    <Container maxWidth="xl">
      {" "}
      {/* Changed to xl for more space */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5">Manage Tasks</Typography>
        <Button
          variant="contained"
          startIcon={<AddTaskIcon />}
          onClick={handleOpenAddDialog}
        >
          Add Task
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 800 }} aria-label="tasks table">
          <TableHead sx={{ bgcolor: "#f5f5f5" }}>
            <TableRow>
              {/* Sortable Headers */}
              <TableCell>
                <TableSortLabel
                  active={orderBy === "name"}
                  direction={orderBy === "name" ? order : "asc"}
                  onClick={() => handleRequestSort("name")}
                >
                  Task Name
                </TableSortLabel>
              </TableCell>
              {/* NEW: Description Header */}
              <TableCell align="center">Description</TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === "points"}
                  direction={orderBy === "points" ? order : "asc"}
                  onClick={() => handleRequestSort("points")}
                >
                  Points
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === "recurrenceType"}
                  direction={orderBy === "recurrenceType" ? order : "asc"}
                  onClick={() => handleRequestSort("recurrenceType")}
                >
                  Recurrence
                </TableSortLabel>
              </TableCell>
              {/* NEW: Streak Days Header */}
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === "requiredDays"}
                  direction={orderBy === "requiredDays" ? order : "asc"}
                  onClick={() => handleRequestSort("requiredDays")}
                >
                  Streak Days
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === "startDate"}
                  direction={orderBy === "startDate" ? order : "asc"}
                  onClick={() => handleRequestSort("startDate")}
                >
                  Start Date
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === "endDate"}
                  direction={orderBy === "endDate" ? order : "asc"}
                  onClick={() => handleRequestSort("endDate")}
                >
                  End Date
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
                <TableCell colSpan={10} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : sortedTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Typography sx={{ py: 3 }}>No tasks found.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              // Render sortedTasks
              sortedTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell
                    component="th"
                    scope="row"
                    sx={{ fontWeight: "bold" }}
                  >
                    {task.name}
                  </TableCell>
                  {/* NEW: Description Cell with Tooltip */}
                  <TableCell align="center">
                    {task.description ? (
                      <Tooltip title={task.description} arrow>
                        <InfoIcon
                          color="action"
                          fontSize="small"
                          sx={{ cursor: "help" }}
                        />
                      </Tooltip>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={task.points}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ textTransform: "capitalize" }}
                  >
                    {task.recurrenceType}
                  </TableCell>
                  {/* NEW: Streak Days Cell */}
                  <TableCell align="center">
                    {task.recurrenceType === "streak" ? task.requiredDays : "-"}
                  </TableCell>
                  <TableCell align="center">
                    {task.startDate
                      ? dayjs(task.startDate).format("MMM D, YYYY")
                      : "-"}
                  </TableCell>
                  <TableCell align="center">
                    {task.endDate
                      ? dayjs(task.endDate).format("MMM D, YYYY")
                      : "-"}
                  </TableCell>
                  <TableCell align="center">
                    {task.isActive ? (
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
                      onClick={() => handleOpenEditDialog(task)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => promptDelete(task.id)}
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
      <AddTaskDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        onTaskSaved={fetchTasks}
        taskToEdit={taskToEdit}
      />
      <Dialog open={deleteConfirmationOpen} onClose={cancelDelete}>
        <DialogTitle>Delete Task?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this task? Students will no longer
            see it on their tracker.
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

export default TasksPage;
