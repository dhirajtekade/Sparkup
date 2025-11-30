import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
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
} from "@mui/material";
import AddTaskIcon from "@mui/icons-material/AddTask";
import AddTaskDialog from "../../components/AddTaskDialog";

const TasksPage = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchTasks = async () => {
    if (!currentUser?.uid) return;

    setLoading(true);
    try {
      // 1. Reference the 'task_templates' collection
      const tasksRef = collection(db, "task_templates");
      // 2. Order by creation time or name (optional)
      const q = query(
          tasksRef, 
          where("createdByTeacherId", "==", currentUser.uid),
          orderBy("name")
      );
      // NOTE: If this query fails in the console with an index error,
      // click the link in the console error to automatically create the index in Firebase.
      const querySnapshot = await getDocs(q);

      const taskList = [];
      querySnapshot.forEach((doc) => {
        taskList.push({ id: doc.id, ...doc.data() });
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

  const handleTaskAdded = () => {
    fetchTasks();
  };

  // Helper to format dates nicely
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
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
          onClick={() => setIsDialogOpen(true)} // Will use this later
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
              tasks.map((task) => (
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
                    {/* Simple logic to check if current date is within range */}
                    {new Date() >= new Date(task.startDate) &&
                    new Date() <= new Date(task.endDate) ? (
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
                  <TableCell align="right">
                    <Button size="small" color="inherit">
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog component will go here */}
      <AddTaskDialog 
        open={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        onTaskAdded={handleTaskAdded}
      />
    </Box>
  );
};

export default TasksPage;
