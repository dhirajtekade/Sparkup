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
  Tooltip,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
// 1. NEW IMPORT for challenge icon
import StarsIcon from "@mui/icons-material/Stars";
import dayjs from "dayjs";

const StudentTrackerPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [studentData, setStudentData] = useState(null);
  const [completionsMap, setCompletionsMap] = useState(new Map());

  // State for weekly view navigation
  const [currentViewDate, setCurrentViewDate] = useState(dayjs());

  // Helper to get visible days
  const getVisibleWeekDays = () => {
    const startOfWeek = currentViewDate.startOf("week");
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

        // B. Fetch Active Tasks (Sorted so challenges might appear at top if desired, currently name asc)
        const tasksRef = collection(db, "task_templates");
        const qTasks = query(
          tasksRef,
          where("createdByTeacherId", "==", teacherId),
          where("isActive", "==", true)
          // You could add orderBy('recurrenceType', 'desc') here to put 'once' tasks first
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

        // C. CHANGED: Fetch ALL Completions for this student.
        // We removed the date range filters to ensure we catch past "one-time" tasks.
        const completionsRef = collection(
          db,
          "users",
          currentUser.uid,
          "completions"
        );
        // No date filters here anymore
        const completionSnapshot = await getDocs(completionsRef);

        const newMap = new Map();
        completionSnapshot.forEach((doc) => {
          // The doc ID is the key (e.g., "2023-11-01_taskID" or "ONCE_taskID")
          newMap.set(doc.id, doc.data().pointsEarned);
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

  // 2. UPDATED HANDLE TOGGLE LOGIC
  const handleToggleCompletion = async (dateDayjs, task) => {
    const dateStr = dateDayjs.format("YYYY-MM-DD");
    const points = Number(task.points);
    let completionId;
    let dateStrForRecord = dateStr;

    // DETERMINE ID BASED ON RECURRENCE TYPE
    if (task.recurrenceType === "once") {
      completionId = `ONCE_${task.id}`;
      // Crucial: If a one-time task is already done, do not allow un-checking it.
      if (completionsMap.has(completionId)) {
        return;
      }
      // For the record, mark it as completed 'today' even if clicked on a past/future date column
      dateStrForRecord = today.format("YYYY-MM-DD");
    } else {
      // Daily/Weekly tasks use date-specific ID
      completionId = `${dateStr}_${task.id}`;
    }

    const isChecked = completionsMap.has(completionId);

    // Optimistic Updates
    const newMap = new Map(completionsMap);
    if (isChecked) {
      newMap.delete(completionId);
    } else {
      newMap.set(completionId, points);
    }
    setCompletionsMap(newMap);

    const previousStudentData = { ...studentData };
    const newTotalPoints =
      (studentData.totalPoints || 0) + (isChecked ? -points : points);
    setStudentData({ ...studentData, totalPoints: newTotalPoints });

    try {
      const studentRef = doc(db, "users", currentUser.uid);
      // Use the determined completionId for the document ID
      const completionDocRef = doc(
        db,
        "users",
        currentUser.uid,
        "completions",
        completionId
      );

      if (isChecked) {
        await deleteDoc(completionDocRef);
        await updateDoc(studentRef, { totalPoints: increment(-points) });
      } else {
        await setDoc(completionDocRef, {
          taskId: task.id,
          taskName: task.name,
          recurrenceType: task.recurrenceType, // Save this for future reference
          dateCompleted: dateStrForRecord, // Use the calculated date string
          pointsEarned: points,
          completedAt: serverTimestamp(),
        });
        await updateDoc(studentRef, { totalPoints: increment(points) });
      }
    } catch (error) {
      console.error("Error toggling completion:", error);
      alert("Failed to save progress. Check connection.");
      setCompletionsMap(completionsMap); // Revert
      setStudentData(previousStudentData); // Revert
    }
  };

  // Navigation Handlers (unchanged)
  const handlePrevWeek = () =>
    setCurrentViewDate(currentViewDate.subtract(1, "week"));
  const handleNextWeek = () =>
    setCurrentViewDate(currentViewDate.add(1, "week"));

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
          Your teacher hasn't assigned any tasks yet.
        </Typography>
      </Paper>
    );
  }

  const weekRangeTitle = `${visibleWeekDays[0].format(
    "MMM D"
  )} - ${visibleWeekDays[6].format("MMM D, YYYY")}`;

  return (
    <Box>
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

      <TableContainer
        component={Paper}
        sx={{ maxHeight: "80vh", borderRadius: 2, boxShadow: 3 }}
      >
        <Table stickyHeader size="small" aria-label="weekly tracker table">
          <TableHead>
            <TableRow>
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
              {visibleWeekDays.map((day) => {
                const isToday = day.isSame(today, "day");
                const isWeekend = day.day() === 0 || day.day() === 6;
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
            {tasks.map((task) => {
              // 3. Determine visuals based on recurrence type
              const isChallenge = task.recurrenceType === "once";
              const chipColor = isChallenge ? "warning" : "success"; // Orange for challenges, green for daily
              const chipIcon = isChallenge ? (
                <StarsIcon fontSize="small" />
              ) : undefined;

              return (
                <TableRow
                  key={task.id}
                  hover
                  sx={{
                    "&:hover": { backgroundColor: "#f5f5f5 !important" },
                    ...(isChallenge && { backgroundColor: "#fff8e1" }),
                  }}
                >
                  {/* Task Name Cell */}
                  <TableCell
                    component="th"
                    scope="row"
                    sx={{
                      position: "sticky",
                      left: 0,
                      backgroundColor: isChallenge ? "#fff8e1" : "white",
                      zIndex: 5,
                      borderRight: "2px solid #e0e0e0",
                    }}
                  >
                    <Box sx={{ pl: 1 }}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        {isChallenge && (
                          <Tooltip title="One-time Challenge">
                            <StarsIcon
                              color="warning"
                              fontSize="small"
                              sx={{ mr: 0.5 }}
                            />
                          </Tooltip>
                        )}
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ lineHeight: 1.2 }}
                        >
                          {task.name}
                        </Typography>
                      </Box>
                      <Chip
                        icon={chipIcon}
                        label={`${task.points} pts`}
                        size="small"
                        color={chipColor}
                        variant="outlined"
                        sx={{
                          mt: 0.5,
                          height: 20,
                          fontSize: "0.65rem",
                          fontWeight: "bold",
                        }}
                      />
                    </Box>
                  </TableCell>

                  {/* Checkbox Cells */}
                  {visibleWeekDays.map((day) => {
                    const dateStr = day.format("YYYY-MM-DD");

                    // 4. DETERMINE COMPLETION ID AND STATUS BASED ON TYPE
                    let completionId;
                    let isChecked = false;

                    if (isChallenge) {
                      // For challenges, check for the single, date-independent ID
                      completionId = `ONCE_${task.id}`;
                      isChecked = completionsMap.has(completionId);
                    } else {
                      // For daily tasks, check for the date-specific ID
                      completionId = `${dateStr}_${task.id}`;
                      isChecked = completionsMap.has(completionId);
                    }

                    // Date validation logic (same as before)
                    const checkDate = day.toDate();
                    checkDate.setHours(0, 0, 0, 0);
                    const start = new Date(task.startDate);
                    start.setHours(0, 0, 0, 0);
                    const end = new Date(task.endDate);
                    end.setHours(23, 59, 59, 999);
                    const isTaskActiveOnDay =
                      checkDate >= start && checkDate <= end;
                    // Disable future dates, inactive dates, OR if it's a completed challenge
                    const isDisabled =
                      day.isAfter(today, "day") ||
                      !isTaskActiveOnDay ||
                      (isChallenge && isChecked);

                    const isToday = day.isSame(today, "day");
                    const isWeekend = day.day() === 0 || day.day() === 6;
                    // Slight background highlight for challenge rows
                    const bgColor = isToday
                      ? "#f0f7ff"
                      : isChallenge
                      ? "#fff8e1"
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
                          // 5. Pass day and task to handler
                          onChange={() => handleToggleCompletion(day, task)}
                          color={isChallenge ? "warning" : "success"} // Different Checkbox color for challenges
                          sx={{
                            "&.Mui-checked": {
                              color: isChallenge
                                ? "warning.main"
                                : "success.main",
                            },
                            "&.Mui-disabled": { color: "#e0e0e0" },
                            ...(isDisabled &&
                              !isChecked && { visibility: "hidden" }),
                          }}
                        />
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default StudentTrackerPage;
