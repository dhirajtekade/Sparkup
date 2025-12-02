import { useState, useEffect } from "react";
import { db } from "../../firebase";
// 1. Add necessary Firestore imports for writing data
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Chip,
  // 2. Import Checkbox component
  Checkbox,
} from "@mui/material";
import dayjs from "dayjs";

const StudentTrackerPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [daysOfMonth, setDaysOfMonth] = useState([]);
  const [studentData, setStudentData] = useState(null);
  // 3. New State: Map to store completed tasks for quick lookup
  // Key: "YYYY-MM-DD_taskId", Value: points earned (number)
  const [completionsMap, setCompletionsMap] = useState(new Map());

  // Helper to get days in month up to today
  const getDaysInMonth = () => {
    const now = dayjs();
    const daysInMonth = now.daysInMonth();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const date = now.date(i);
      // We allow viewing the whole month, but future dates will be disabled later
      days.push(date);
    }
    return days;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        const now = dayjs();
        const days = getDaysInMonth();
        setDaysOfMonth(days);

        // A. Fetch Student Data
        const studentDocRef = doc(db, "users", currentUser.uid);
        const studentDocSnap = await getDoc(studentDocRef);
        if (!studentDocSnap.exists())
          throw new Error("Student profile not found");
        const sData = studentDocSnap.data();
        setStudentData(sData);
        const teacherId = sData.createdByTeacherId;

        // B. Fetch Active Tasks from THEIR teacher
        const tasksRef = collection(db, "task_templates");
        const qTasks = query(
          tasksRef,
          where("createdByTeacherId", "==", teacherId),
          where("isActive", "==", true)
        );
        const taskSnapshot = await getDocs(qTasks);
        const taskList = [];
        taskSnapshot.forEach((doc) => {
          const data = doc.data();
          taskList.push({
            id: doc.id,
            ...data,
            // Convert timestamps for comparison
            startDate: data.startDate?.toDate(),
            endDate: data.endDate?.toDate(),
          });
        });
        setTasks(taskList);

        // C. Fetch existing completions for THIS student for THIS month
        // Define start and end of current month for query
        const startOfMonthStr = now.startOf("month").format("YYYY-MM-DD");
        const endOfMonthStr = now.endOf("month").format("YYYY-MM-DD");

        // Reference the subcollection: users/{studentId}/completions
        const completionsRef = collection(
          db,
          "users",
          currentUser.uid,
          "completions"
        );
        const qCompletions = query(
          completionsRef,
          where("dateCompleted", ">=", startOfMonthStr),
          where("dateCompleted", "<=", endOfMonthStr)
        );

        const completionSnapshot = await getDocs(qCompletions);
        const newMap = new Map();
        completionSnapshot.forEach((doc) => {
          const data = doc.data();
          // Create the unique key: "YYYY-MM-DD_taskId"
          const key = `${data.dateCompleted}_${data.taskId}`;
          newMap.set(key, data.pointsEarned);
        });
        setCompletionsMap(newMap);
      } catch (error) {
        console.error("Error loading tracker:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // 4. THE CORE LOGIC: Handle checking/unchecking a box
  const handleToggleCompletion = async (dateDayjs, task) => {
    const dateStr = dateDayjs.format("YYYY-MM-DD");
    // Unique ID for the completion document and map key
    const completionId = `${dateStr}_${task.id}`;
    const points = Number(task.points);

    // Determine if currently checked based on map
    const isChecked = completionsMap.has(completionId);

    // --- Optimistic UI Update ---
    // Update state immediately before DB write for instant feedback
    const newMap = new Map(completionsMap);
    if (isChecked) {
      newMap.delete(completionId); // Unchecking
    } else {
      newMap.set(completionId, points); // Checking
    }
    setCompletionsMap(newMap);

    try {
      // References
      const studentRef = doc(db, "users", currentUser.uid);
      const completionDocRef = doc(
        db,
        "users",
        currentUser.uid,
        "completions",
        completionId
      );

      if (isChecked) {
        // --- UNCHECK OPERATION ---
        // 1. Delete completion document
        await deleteDoc(completionDocRef);
        // 2. Decrement student total points atomically
        await updateDoc(studentRef, {
          totalPoints: increment(-points),
        });
        console.log(`Unchecked: Removed ${points} points`);
      } else {
        // --- CHECK OPERATION ---
        // 1. Create completion document using setDoc with specific ID
        await setDoc(completionDocRef, {
          taskId: task.id,
          taskName: task.name, // Store name for easier historical reporting later
          dateCompleted: dateStr,
          pointsEarned: points,
          completedAt: serverTimestamp(),
        });
        // 2. Increment student total points atomically
        await updateDoc(studentRef, {
          totalPoints: increment(points),
        });
        console.log(`Checked: Added ${points} points`);
      }
    } catch (error) {
      console.error("Error toggling completion:", error);
      alert("Failed to save progress. Please check internet connection.");
      // Revert optimistic update on error
      setCompletionsMap(completionsMap);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!studentData || tasks.length === 0) {
    return <Typography>No tasks assigned yet.</Typography>;
  }

  const today = dayjs();

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5">
          Daily Tracker: {today.format("MMMM YYYY")}
        </Typography>
        <Chip
          label={`Total Points: ${studentData.totalPoints || 0}`}
          color="success"
          variant="outlined"
          sx={{ fontWeight: "bold", fontSize: "1rem" }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: "80vh" }}>
        <Table stickyHeader size="small" aria-label="sticky table">
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "#f5f5f5",
                  zIndex: 3,
                  position: "sticky",
                  left: 0,
                  minWidth: 150,
                }}
              >
                Task / Date
              </TableCell>
              {daysOfMonth.map((day) => (
                <TableCell
                  key={day.toString()}
                  align="center"
                  sx={{
                    minWidth: 50,
                    backgroundColor: day.isSame(today, "day")
                      ? "#e3f2fd"
                      : "inherit",
                    borderLeft: "1px solid #e0e0e0",
                  }}
                >
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Typography variant="caption" color="text.secondary">
                      {day.format("ddd")}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {day.format("D")}
                    </Typography>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id} hover>
                <TableCell
                  component="th"
                  scope="row"
                  sx={{
                    position: "sticky",
                    left: 0,
                    backgroundColor: "white",
                    zIndex: 1,
                    borderRight: "1px solid #e0e0e0",
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {task.name}
                    </Typography>
                    <Chip
                      label={`${task.points} pts`}
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ mt: 0.5, height: 20, fontSize: "0.7rem" }}
                    />
                  </Box>
                </TableCell>
                {daysOfMonth.map((day) => {
                  // 5. DETERMINE CELL STATE
                  const dateStr = day.format("YYYY-MM-DD");
                  const completionId = `${dateStr}_${task.id}`;
                  const isChecked = completionsMap.has(completionId);

                  // Check if task was active on this specific day
                  // Reset hours for accurate day comparison
                  const checkDate = day.toDate();
                  checkDate.setHours(0, 0, 0, 0);
                  const start = new Date(task.startDate);
                  start.setHours(0, 0, 0, 0);
                  const end = new Date(task.endDate);
                  end.setHours(23, 59, 59, 999);
                  const isTaskActiveOnDay =
                    checkDate >= start && checkDate <= end;

                  // Disable future dates OR inactive task dates
                  const isDisabled =
                    day.isAfter(today, "day") || !isTaskActiveOnDay;

                  return (
                    <TableCell
                      key={day.toString()}
                      align="center"
                      sx={{ borderLeft: "1px solid #e0e0e0", p: 0 }}
                    >
                      {/* 6. RENDER CHECKBOX */}
                      <Checkbox
                        checked={isChecked}
                        disabled={isDisabled}
                        onChange={() => handleToggleCompletion(day, task)}
                        color="success"
                        sx={{
                          "&.Mui-checked": { color: "success.main" },
                          "&.Mui-disabled": { color: "#bdbdbd" },
                        }}
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default StudentTrackerPage;
