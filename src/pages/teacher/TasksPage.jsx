import { useState, useEffect } from "react";
import { db } from "../../firebase";
// 1. All required Firestore imports
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
  // 2. Dialog components for confirmation
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
} from "@mui/material";
import AddTaskIcon from "@mui/icons-material/AddTask";
// 3. Icons for Edit and Delete
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddTaskDialog from "../../components/AddTaskDialog";

const TasksPage = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // 4. State for general Dialog (Add/Edit)
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  // 5. State for Delete Confirmation Dialog
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState(null);

  const fetchTasks = async () => {
    if (!currentUser?.uid) return;

    setLoading(true);
    try {
      const tasksRef = collection(db, "task_templates");
      const q = query(
        tasksRef,
        where("createdByTeacherId", "==", currentUser.uid),
        orderBy("name")
      );

      // NOTE: If this query fails in the console with an index error,
      // click the link in the console error to automatically create the index.
      const querySnapshot = await getDocs(q);

      const taskList = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // 6. CRITICAL FIX: Convert Firestore Timestamps to JS Date objects here
        taskList.push({
          id: doc.id,
          ...data,
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

  // --- Dialog Handlers ---

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

  // --- Delete Handlers ---

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
      fetchTasks(); // Refresh list
      setDeleteConfirmationOpen(false);
      setTaskToDeleteId(null);
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task.");
    }
  };

  // --- Helpers ---

  // 7. Robust Date Formatter
  const formatDate = (dateInput) => {
    if (!dateInput) return "N/A";
    if (dateInput instanceof Date && !isNaN(dateInput)) {
      return dateInput.toLocaleDateString();
    }
    // Fallback in case a non-converted Timestamp slips through
    if (dateInput.toDate && typeof dateInput.toDate === "function") {
      try {
        return dateInput.toDate().toLocaleDateString();
      } catch (e) {
        return "Invalid";
      }
    }
    return "Invalid Date";
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
        <Typography variant="h5" component="h2">
          Manage Tasks
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddTaskIcon />}
          onClick={handleOpenAddDialog}
        >
          Add Task
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="tasks table">
          <TableHead sx={{ bgcolor: "#f5f5f5" }}>
            <TableRow>
              <TableCell>Task Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="center">Points</TableCell>
              <TableCell align="center">Dates</TableCell>
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
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="subtitle1" sx={{ py: 3 }}>
                    No tasks found. Click "Add Task" to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => {
                // Calculate active status locally based on converted dates
                const now = new Date();
                // Set hours to 0 for accurate day-only comparison
                now.setHours(0, 0, 0, 0);
                const start = new Date(task.startDate);
                start.setHours(0, 0, 0, 0);
                const end = new Date(task.endDate);
                end.setHours(23, 59, 59, 999);

                const isActive =
                  now >= start && now <= end && task.isActive !== false;

                return (
                  <TableRow key={task.id}>
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{ fontWeight: "bold" }}
                    >
                      {task.name}
                    </TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 300,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {task.description}
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={task.points} color="primary" size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="caption" display="block">
                        Start: {formatDate(task.startDate)}
                      </Typography>
                      <Typography variant="caption" display="block">
                        End: {formatDate(task.endDate)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {isActive ? (
                        <Chip
                          label="Active"
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          label="Inactive"
                          color="default"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </TableCell>

                    {/* 8. Updated Actions Cell with Icons */}
                    <TableCell align="right">
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
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 9. Updated Dialog with new props */}
      <AddTaskDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        onTaskSaved={fetchTasks} // Renamed prop for clarity
        taskToEdit={taskToEdit}
      />

      {/* 10. Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmationOpen} onClose={cancelDelete}>
        <DialogTitle>Delete Task?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this task? This action cannot be
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

export default TasksPage;
