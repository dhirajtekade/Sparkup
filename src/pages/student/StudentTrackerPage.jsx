import { useState, useEffect, useMemo, useRef } from "react"; // Added useRef
import { db } from "../../firebase";
// Added updateDoc here
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
  writeBatch,
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
  LinearProgress,
  Alert,
  Snackbar,
  useTheme,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import StarsIcon from "@mui/icons-material/Stars";
import dayjs from "dayjs";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import InfoIcon from "@mui/icons-material/Info";

// HELPER FUNCTION FOR GEOLOCATION
const getGeoLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported by browser"));
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 } // Lower accuracy needed for just city level
      );
    }
  });
};

const StudentTrackerPage = () => {
  const { currentUser } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [studentData, setStudentData] = useState(null);
  const [completionsMap, setCompletionsMap] = useState(new Map());
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [currentViewDate, setCurrentViewDate] = useState(dayjs());

  // Ref to ensure location capture only runs once per mount
  const locationCapturedRef = useRef(false);

  // --- NEW: CAPTURE LOCATION ON PAGE LOAD ---
  useEffect(() => {
    const captureLocationOnLoad = async () => {
      // Basic checks to ensure we only run this once and when user is ready
      if (!currentUser?.uid || locationCapturedRef.current) return;

      // Mark as attempted so it doesn't run again on re-renders
      locationCapturedRef.current = true;

      if ("geolocation" in navigator) {
        try {
          console.log("Attempting to capture location on page load...");
          const coords = await getGeoLocation();

          // Update the main user document with the latest location
          const userRef = doc(db, "users", currentUser.uid);
          await updateDoc(userRef, {
            latestLocation: {
              lat: coords.lat,
              lng: coords.lng,
              updatedAt: serverTimestamp(),
            },
          });
          console.log("Location updated on profile successfully.");
        } catch (error) {
          // Fail silently. Don't annoy the student with alerts if they denied permission.
          // Teacher just won't see them on the map.
          console.warn("Could not capture auto-location:", error.message);
        }
      }
    };

    captureLocationOnLoad();
  }, [currentUser]);
  // -----------------------------------------

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
        const studentDocRef = doc(db, "users", currentUser.uid);
        const studentDocSnap = await getDoc(studentDocRef);
        if (!studentDocSnap.exists())
          throw new Error("Student profile not found");
        const sData = studentDocSnap.data();
        setStudentData(sData);
        const teacherId = sData.createdByTeacherId;

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

        taskList.sort((a, b) => {
          const dateA = a.startDate || new Date(0);
          const dateB = b.startDate || new Date(0);
          return dateA - dateB;
        });

        setTasks(taskList);

        const completionsRef = collection(
          db,
          "users",
          currentUser.uid,
          "completions"
        );
        const completionSnapshot = await getDocs(completionsRef);

        const newMap = new Map();
        completionSnapshot.forEach((doc) => {
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

  const streakProgressMap = useMemo(() => {
    const map = new Map();
    tasks.forEach((task) => {
      if (task.recurrenceType === "streak") {
        let count = 0;
        const start = dayjs(task.startDate);
        const end = dayjs(task.endDate);
        completionsMap.forEach((_, completionId) => {
          if (
            completionId.endsWith(`_${task.id}`) &&
            !completionId.startsWith("STREAK_BONUS")
          ) {
            const dateStr = completionId.split("_")[0];
            const completionDate = dayjs(dateStr);
            if (
              (completionDate.isAfter(start, "day") ||
                completionDate.isSame(start, "day")) &&
              (completionDate.isBefore(end, "day") ||
                completionDate.isSame(end, "day"))
            ) {
              count++;
            }
          }
        });
        map.set(task.id, count);
      }
    });
    return map;
  }, [tasks, completionsMap]);

  const handleToggleCompletion = async (dateDayjs, task) => {
    const dateStr = dateDayjs.format("YYYY-MM-DD");
    const taskPointsValue = Number(task.points);
    const recurrenceType = task.recurrenceType || "daily";
    const isStreak = recurrenceType === "streak";

    let dailyCompletionId;
    let dateStrForRecord = dateStr;

    if (recurrenceType === "once") {
      dailyCompletionId = `ONCE_${task.id}`;
      dateStrForRecord = today.format("YYYY-MM-DD");
    } else {
      dailyCompletionId = `${dateStr}_${task.id}`;
    }

    const isCurrentlyChecked = completionsMap.has(dailyCompletionId);
    const isTurningOn = !isCurrentlyChecked;

    const previousCompletionsMap = new Map(completionsMap);
    const previousStudentData = { ...studentData };

    let newCompletionsMap = new Map(completionsMap);
    let newTotalPoints = studentData.totalPoints || 0;
    let pointsChangeForFirestore = 0;

    const userRef = doc(db, "users", currentUser.uid);
    const dailyCompletionRef = doc(
      db,
      "users",
      currentUser.uid,
      "completions",
      dailyCompletionId
    );
    const streakBonusId = `STREAK_BONUS_${task.id}`;
    const streakBonusRef = doc(
      db,
      "users",
      currentUser.uid,
      "completions",
      streakBonusId
    );
    const batch = writeBatch(db);

    if (isTurningOn) {
      // === CHECKING A BOX ===
      // NOTE: Location logic removed from here.

      const pointsForDaily = isStreak ? 0 : taskPointsValue;

      newCompletionsMap.set(dailyCompletionId, pointsForDaily);
      newTotalPoints += pointsForDaily;

      batch.set(dailyCompletionRef, {
        taskId: task.id,
        taskName: task.name,
        recurrenceType: recurrenceType,
        dateCompleted: dateStrForRecord,
        pointsEarned: pointsForDaily,
        completedAt: serverTimestamp(),
      });
      pointsChangeForFirestore += pointsForDaily;

      if (isStreak) {
        let currentCount = 0;
        const start = dayjs(task.startDate);
        const end = dayjs(task.endDate);
        newCompletionsMap.forEach((_, completionId) => {
          if (
            completionId.endsWith(`_${task.id}`) &&
            !completionId.startsWith("STREAK_BONUS")
          ) {
            const cDateStr = completionId.split("_")[0];
            const cDate = dayjs(cDateStr);
            if (
              (cDate.isAfter(start, "day") || cDate.isSame(start, "day")) &&
              (cDate.isBefore(end, "day") || cDate.isSame(end, "day"))
            ) {
              currentCount++;
            }
          }
        });

        if (currentCount === (task.requiredDays || 1)) {
          newCompletionsMap.set(streakBonusId, taskPointsValue);
          newTotalPoints += taskPointsValue;
          setSnackbarMessage(
            `🎉 Congratulations! You completed the ${task.name} and earned ${taskPointsValue} bonus points!`
          );
          setSnackbarOpen(true);

          batch.set(streakBonusRef, {
            taskId: task.id,
            taskName: task.name + " (Bonus)",
            recurrenceType: "streak_bonus",
            dateCompleted: today.format("YYYY-MM-DD"),
            pointsEarned: taskPointsValue,
            completedAt: serverTimestamp(),
          });
          pointsChangeForFirestore += taskPointsValue;
        }
      }
    } else {
      // === UN-CHECKING A BOX ===
      const pointsForDaily = isStreak ? 0 : taskPointsValue;

      newCompletionsMap.delete(dailyCompletionId);
      newTotalPoints -= pointsForDaily;

      batch.delete(dailyCompletionRef);
      pointsChangeForFirestore -= pointsForDaily;

      if (isStreak) {
        if (newCompletionsMap.has(streakBonusId)) {
          newCompletionsMap.delete(streakBonusId);
          newTotalPoints -= taskPointsValue;

          batch.delete(streakBonusRef);
          pointsChangeForFirestore -= taskPointsValue;
        }
      }
    }

    setCompletionsMap(newCompletionsMap);
    setStudentData({ ...studentData, totalPoints: newTotalPoints });

    try {
      batch.update(userRef, {
        totalPoints: increment(pointsChangeForFirestore),
        lastActivityAt: serverTimestamp(),
      });

      await batch.commit();
    } catch (error) {
      console.error("Error toggling completion:", error);
      alert("Failed to save progress. Check connection.");
      setCompletionsMap(previousCompletionsMap);
      setStudentData(previousStudentData);
    }
  };

  const handlePrevWeek = () =>
    setCurrentViewDate(currentViewDate.subtract(1, "week"));
  const handleNextWeek = () =>
    setCurrentViewDate(currentViewDate.add(1, "week"));

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );
  if (!studentData || tasks.length === 0)
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
          <Chip
            label={`Total Points: ${studentData.totalPoints || 0}`}
            color="success"
            sx={{ fontWeight: "bold", fontSize: "1rem" }}
          />
        </Grid>
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
      </Grid>

      <TableContainer
        component={Paper}
        sx={{
          height: "calc(100vh - 220px)",
          overflow: "auto",
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Table stickyHeader size="small" aria-label="weekly tracker table">
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontWeight: "bold",
                  backgroundColor: "#f5f5f5",
                  position: "sticky",
                  left: 0,
                  zIndex: 10,
                  minWidth: 180,
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
                  ? "action.hover"
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
              const recurrenceType = task.recurrenceType || "daily";
              const isChallenge = recurrenceType === "once";
              const isStreak = recurrenceType === "streak";
              const isNegative = Number(task.points) < 0;

              let isOnceTaskCompleted = false;
              if (isChallenge) {
                isOnceTaskCompleted = completionsMap.has(`ONCE_${task.id}`);
              }

              let rowBgColor = "inherit";
              // if (isNegative) rowBgColor = "#ffebee";
              // else if (isChallenge) rowBgColor = "#fff8e1";
              // else if (isStreak) rowBgColor = "#e3f2fd";

              let themeColor = "success";
              if (isNegative) themeColor = "error";
              else if (isChallenge) themeColor = "warning";
              else if (isStreak) themeColor = "primary";

              const currentStreakCount = streakProgressMap.get(task.id) || 0;
              const requiredStreakDays = task.requiredDays || 1;
              const streakProgressPercent = Math.min(
                (currentStreakCount / requiredStreakDays) * 100,
                100
              );
              const isBonusAwarded = completionsMap.has(
                `STREAK_BONUS_${task.id}`
              );

              const PointsChip = () => (
                <Chip
                  icon={
                    isNegative ? (
                      <RemoveCircleIcon fontSize="small" />
                    ) : isChallenge ? (
                      <StarsIcon fontSize="small" />
                    ) : undefined
                  }
                  label={`${task.points} pts`}
                  size="small"
                  color={themeColor}
                  variant={
                    isChallenge && isOnceTaskCompleted ? "filled" : "outlined"
                  }
                  sx={{ height: 20, fontSize: "0.65rem", fontWeight: "bold" }}
                />
              );

              return (
                <TableRow
                  key={task.id}
                  hover
                  sx={{
                    backgroundColor: rowBgColor,
                    "&:hover": {
                      backgroundColor: `${theme.palette.action.hover} !important`,
                    },
                  }}
                >
                  <TableCell
                    component="th"
                    scope="row"
                    sx={{
                      position: "sticky",
                      left: 0,
                      zIndex: 5,
                      backgroundColor: rowBgColor,
                      borderRight: "2px solid #e0e0e0",
                      py: 1.5,
                    }}
                  >
                    <Box sx={{ pl: 1 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 0.5 }}
                      >
                        {isNegative && (
                          <Tooltip title="Penalty Task">
                            <RemoveCircleIcon
                              color="error"
                              fontSize="small"
                              sx={{ mr: 0.5 }}
                            />
                          </Tooltip>
                        )}
                        {!isNegative && isChallenge && (
                          <Tooltip title="One-time Bonus">
                            <StarsIcon
                              color="warning"
                              fontSize="small"
                              sx={{ mr: 0.5 }}
                            />
                          </Tooltip>
                        )}
                        {!isNegative && isStreak && (
                          <Tooltip title="Multi-Day Streak">
                            <EmojiEventsIcon
                              color="info"
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

                        {task.description && task.description.trim() !== "" && (
                          <Tooltip
                            title={
                              <Typography variant="body2">
                                {task.description}
                              </Typography>
                            }
                            arrow
                            placement="right"
                          >
                            <InfoIcon
                              color="action"
                              sx={{
                                fontSize: "1.1rem",
                                opacity: 0.7,
                                cursor: "help",
                              }}
                            />
                          </Tooltip>
                        )}
                      </Box>

                      {isStreak ? (
                        <Box sx={{ width: "100%", mt: 0.5, pr: 1 }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mb: 0.2,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: "bold",
                                color: "primary.dark",
                                fontSize: "0.65rem",
                              }}
                            >
                              {isBonusAwarded
                                ? "Completed!"
                                : `Progress: ${currentStreakCount}/${requiredStreakDays} Days`}
                            </Typography>
                            {isBonusAwarded ? (
                              <Chip
                                label="Bonus Awarded!"
                                size="small"
                                color="primary"
                                sx={{
                                  height: 16,
                                  fontSize: "0.6rem",
                                  fontWeight: "bold",
                                }}
                              />
                            ) : (
                              <Chip
                                label={`${task.points} Bonus Pts`}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{
                                  height: 16,
                                  fontSize: "0.6rem",
                                  fontWeight: "bold",
                                }}
                              />
                            )}
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={streakProgressPercent}
                            color="primary"
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: "#bbdefb",
                            }}
                          />
                        </Box>
                      ) : isNegative ? (
                        <Tooltip title="Penalty Points">
                          <Box display="inline-block">
                            <PointsChip />
                          </Box>
                        </Tooltip>
                      ) : (
                        <PointsChip />
                      )}
                    </Box>
                  </TableCell>

                  {visibleWeekDays.map((day) => {
                    const dateStr = day.format("YYYY-MM-DD");

                    let completionId;
                    let isChecked = false;

                    if (isChallenge) {
                      completionId = `ONCE_${task.id}`;
                      isChecked = completionsMap.has(completionId);
                    } else {
                      completionId = `${dateStr}_${task.id}`;
                      isChecked = completionsMap.has(completionId);
                    }

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
                    let cellBgColor = isToday
                      ? "#f0f7ff"
                      : isWeekend
                      ? "inherit"
                      : "inherit";
                    if (!isToday && (isStreak || isChallenge || isNegative))
                      cellBgColor = rowBgColor;

                    return (
                      <TableCell
                        key={day.toString()}
                        align="center"
                        sx={{
                          backgroundColor: cellBgColor,
                          borderLeft: "1px solid #f0f0f0",
                          p: 0,
                          height: 50,
                        }}
                      >
                        <Checkbox
                          checked={isChecked}
                          disabled={isDisabled}
                          onChange={() => handleToggleCompletion(day, task)}
                          color={themeColor}
                          sx={{
                            "&.Mui-checked": { color: `${themeColor}.main` },
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

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: "100%", fontWeight: "bold" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StudentTrackerPage;
