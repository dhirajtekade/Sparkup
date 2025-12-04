import { useState, useEffect } from "react";
import { db } from "../../firebase";
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
  Checkbox,
  IconButton,
  Grid,
  Container,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
// 1. NEW IMPORTS for navigation icons
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import dayjs from "dayjs";

const StudentTrackerPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  // Note: We still fetch the whole month's data for simplicity in tracking completions
  const [studentData, setStudentData] = useState(null);
  const [completionsMap, setCompletionsMap] = useState(new Map());

  // 2. NEW STATE used to navigate weeks. Defaults to today.
  const [currentViewDate, setCurrentViewDate] = useState(dayjs());

  // Helper to get the 7 days starting from the beginning of the week of the view date
  const getVisibleWeekDays = () => {
    const startOfWeek = currentViewDate.startOf("week"); // Usually Sunday
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(startOfWeek.add(i, "day"));
    }
    return days;
  };

  const visibleWeekDays = getVisibleWeekDays();
  const today = dayjs();

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        // A. Fetch Student Data
        const studentDocRef = doc(db, "users", currentUser.uid);
        const studentDocSnap = await getDoc(studentDocRef);
        if (!studentDocSnap.exists())
          throw new Error("Student profile not found");
        const sData = studentDocSnap.data();
        setStudentData(sData);
        const teacherId = sData.createdByTeacherId;

        // B. Fetch Active Tasks
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
            startDate: data.startDate?.toDate(),
            endDate: data.endDate?.toDate(),
          });
        });
        setTasks(taskList);

        // C. Fetch Completions (Still fetching whole current month for simplicity)
        const startOfMonthStr = today.startOf("month").format("YYYY-MM-DD");
        const endOfMonthStr = today.endOf("month").format("YYYY-MM-DD");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]); // Only run on mount/user change, not date change

  const handleToggleCompletion = async (dateDayjs, task) => {
    const dateStr = dateDayjs.format("YYYY-MM-DD");
    const completionId = `${dateStr}_${task.id}`;
    const points = Number(task.points);
    const isChecked = completionsMap.has(completionId);

    // --- 1. Optimistic Update for Checkboxes ---
    const newMap = new Map(completionsMap);
    if (isChecked) {
      newMap.delete(completionId);
    } else {
      newMap.set(completionId, points);
    }
    setCompletionsMap(newMap);

    // --- 2. NEW: Optimistic Update for Total Points Header ---
    // Create a copy of previous data to revert if needed
    const previousStudentData = { ...studentData };
    // Calculate new total
    const newTotalPoints =
      (studentData.totalPoints || 0) + (isChecked ? -points : points);
    // Update state immediately
    setStudentData({ ...studentData, totalPoints: newTotalPoints });

    try {
      const studentRef = doc(db, "users", currentUser.uid);
      const completionDocRef = doc(
        db,
        "users",
        currentUser.uid,
        "completions",
        completionId
      );

      if (isChecked) {
        // Unchecking: Delete record & decrement
        await deleteDoc(completionDocRef);
        await updateDoc(studentRef, { totalPoints: increment(-points) });
      } else {
        // Checking: Create record & increment
        await setDoc(completionDocRef, {
          taskId: task.id,
          taskName: task.name,
          dateCompleted: dateStr,
          pointsEarned: points,
          completedAt: serverTimestamp(),
        });
        await updateDoc(studentRef, { totalPoints: increment(points) });
      }
    } catch (error) {
      console.error("Error toggling completion:", error);
      alert("Failed to save progress. Check connection.");
      // --- 3. Revert BOTH states on error ---
      setCompletionsMap(completionsMap); // Revert checkboxes
      setStudentData(previousStudentData); // Revert points header
    }
  };

  // 3. NEW NAVIGATION HANDLERS
  const handlePrevWeek = () => {
    // Optional: Don't allow going back past the start of the month
    // const startOfMonth = today.startOf('month');
    // if (currentViewDate.subtract(1, 'week').isBefore(startOfMonth)) return;
    setCurrentViewDate(currentViewDate.subtract(1, "week"));
  };

  const handleNextWeek = () => {
    // Optional: Don't allow going forward past end of month
    // const endOfMonth = today.endOf('month');
    // if (currentViewDate.add(1, 'week').isAfter(endOfMonth)) return;
    setCurrentViewDate(currentViewDate.add(1, "week"));
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!studentData || tasks.length === 0) {
    return (
      <Paper
        sx={{
          p: 5,
          textAlign: "center",
          borderRadius: 4,
          bgcolor: "#f0f7f0",
          mt: 4,
        }}
      >
        <EmojiEventsIcon sx={{ fontSize: 60, color: "#a5d6a7", mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          No Tasks Assigned
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Your teacher hasn't assigned any daily tasks yet. Check back later!
        </Typography>
      </Paper>
    );
  }

  // Format the date range for the header title (e.g., "Oct 22 - Oct 28, 2023")
  const weekRangeTitle = `${visibleWeekDays[0].format(
    "MMM D"
  )} - ${visibleWeekDays[6].format("MMM D, YYYY")}`;

  return (
    <Container maxWidth="md" sx={{ ml: 0 }}>
    <Box>
      {/* 4. UPDATED HEADER with Navigation controls */}
      <Grid
        container
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Grid item>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              onClick={handlePrevWeek}
              size="small"
              sx={{ bgcolor: "#e8f5e9" }}
            >
              <ChevronLeftIcon color="success" />
            </IconButton>
            <Typography
              variant="h6"
              component="h2"
              sx={{
                fontWeight: "bold",
                color: "success.dark",
                minWidth: 180,
                textAlign: "center",
              }}
            >
              {weekRangeTitle}
            </Typography>
            <IconButton
              onClick={handleNextWeek}
              size="small"
              sx={{ bgcolor: "#e8f5e9" }}
            >
              <ChevronRightIcon color="success" />
            </IconButton>
            {/* Button to jump back to today if we navigated away */}
            {!currentViewDate.isSame(today, "week") && (
              <Chip
                label="Jump to Today"
                onClick={() => setCurrentViewDate(today)}
                color="success"
                variant="outlined"
                size="small"
                sx={{ ml: 1 }}
                clickable
              />
            )}
          </Box>
        </Grid>
        <Grid item>
          <Chip
            label={`Total Points: ${studentData.totalPoints || 0}`}
            color="success"
            sx={{ fontWeight: "bold", fontSize: "1rem" }}
          />
        </Grid>
      </Grid>

      {/* 5. SIMPLIFIED TABLE CONTAINER - Removed complex sticky CSS */}
      <TableContainer
        component={Paper}
        sx={{ maxHeight: "80vh", borderRadius: 2, boxShadow: 3 }}
      >
        <Table stickyHeader size="small" aria-label="weekly tracker table">
          <TableHead>
            <TableRow>
              {/* Task Column Header - Simplified CSS */}
              <TableCell
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "#f5f5f5",
                  zIndex: 10,
                  position: "sticky",
                  left: 0,
                  minWidth: 150,
                  borderRight: "2px solid #e0e0e0",
                }}
              >
                Task
              </TableCell>
              {/* 6. LOOP OVER VISIBLE WEEK DAYS ONLY */}
              {visibleWeekDays.map((day) => {
                const isToday = day.isSame(today, "day");
                const isWeekend = day.day() === 0 || day.day() === 6;
                // Highlight today with blue, weekends with gray
                const bgColor = isToday
                  ? "#e3f2fd"
                  : isWeekend
                  ? "#fafafa"
                  : "inherit";

                return (
                  <TableCell
                    key={day.toString()}
                    align="center"
                    sx={{
                      minWidth: 50,
                      backgroundColor: bgColor,
                      borderLeft: "1px solid #f0f0f0",
                      borderBottom: isToday
                        ? "2px solid #1976d2"
                        : "1px solid #e0e0e0",
                    }}
                  >
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Typography
                        variant="caption"
                        color={isToday ? "primary" : "text.secondary"}
                        sx={{
                          fontWeight: isToday ? "bold" : "normal",
                          textTransform: "uppercase",
                        }}
                      >
                        {day.format("ddd")}
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight={isToday ? "bold" : "normal"}
                      >
                        {day.format("D")}
                      </Typography>
                    </Box>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => (
              <TableRow
                key={task.id}
                hover
                sx={{ "&:hover": { backgroundColor: "#f5f5f5 !important" } }}
              >
                {/* Task Name Cell - Simplified CSS */}
                <TableCell
                  component="th"
                  scope="row"
                  sx={{
                    position: "sticky",
                    left: 0,
                    backgroundColor: "white",
                    zIndex: 5,
                    borderRight: "2px solid #e0e0e0",
                  }}
                >
                  <Box sx={{ pl: 1 }}>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ lineHeight: 1.2 }}
                    >
                      {task.name}
                    </Typography>
                    <Chip
                      label={`${task.points} pts`}
                      size="small"
                      sx={{
                        mt: 0.5,
                        height: 20,
                        fontSize: "0.65rem",
                        bgcolor: "#e8f5e9",
                        color: "success.dark",
                        fontWeight: "bold",
                      }}
                    />
                  </Box>
                </TableCell>
                {/* 7. LOOP OVER VISIBLE WEEK DAYS ONLY */}
                {visibleWeekDays.map((day) => {
                  const dateStr = day.format("YYYY-MM-DD");
                  const completionId = `${dateStr}_${task.id}`;
                  const isChecked = completionsMap.has(completionId);

                  const checkDate = day.toDate();
                  checkDate.setHours(0, 0, 0, 0);
                  const start = new Date(task.startDate);
                  start.setHours(0, 0, 0, 0);
                  const end = new Date(task.endDate);
                  end.setHours(23, 59, 59, 999);
                  const isTaskActiveOnDay =
                    checkDate >= start && checkDate <= end;

                  const isDisabled =
                    day.isAfter(today, "day") || !isTaskActiveOnDay;

                  const isToday = day.isSame(today, "day");
                  const isWeekend = day.day() === 0 || day.day() === 6;
                  const bgColor = isToday
                    ? "#f0f7ff"
                    : isWeekend
                    ? "#fafafa"
                    : "inherit";

                  return (
                    <TableCell
                      key={day.toString()}
                      align="center"
                      sx={{
                        backgroundColor: bgColor,
                        borderLeft: "1px solid #f0f0f0",
                        p: 0,
                        height: 50,
                      }}
                    >
                      <Checkbox
                        checked={isChecked}
                        disabled={isDisabled}
                        onChange={() => handleToggleCompletion(day, task)}
                        color="success"
                        sx={{
                          "&.Mui-checked": { color: "success.main" },
                          "&.Mui-disabled": { color: "#e0e0e0" },
                          // Hide if disabled and unchecked for cleaner look
                          ...(isDisabled &&
                            !isChecked && { visibility: "hidden" }),
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
    </Container>
  );
};

export default StudentTrackerPage;
