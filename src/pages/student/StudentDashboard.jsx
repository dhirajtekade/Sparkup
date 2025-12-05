import { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
  // limit,
  // getCountFromServer,
} from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Chip,
  Button,
  Skeleton,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AssignmentIcon from "@mui/icons-material/Assignment";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import BadgeToken from "../../utils/badgeTokenRenderer";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

// Helper component for summary cards (unchanged)
const SummaryCard = ({ title, value, icon, color, loading }) => (
  <Paper
    elevation={2}
    sx={{
      p: 3,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      bgcolor: color,
      color: "white",
      height: "100%",
      borderRadius: 3,
    }}
  >
    <Box>
      {loading ? (
        <Skeleton variant="text" width={60} height={40} />
      ) : (
        <Typography variant="h4" fontWeight="bold">
          {value}
        </Typography>
      )}
      <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
        {title}
      </Typography>
    </Box>
    <Box
      sx={{
        opacity: 0.8,
        bgcolor: "rgba(255,255,255,0.2)",
        p: 1,
        borderRadius: 2,
        display: "flex",
      }}
    >
      {icon}
    </Box>
  </Paper>
);

const StudentDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [teacherName, setTeacherName] = useState(""); // 1. NEW STATE for teacher name
  const [nextBadge, setNextBadge] = useState(null);
  const [todaysTasks, setTodaysTasks] = useState([]);
  const [stats, setStats] = useState({
    pointsEarnedToday: 0,
    completedTodayCount: 0,
    totalActiveTasks: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.uid) return;
      setLoading(true);
      // Artificial delay removed for faster loading
      // await new Promise(resolve => setTimeout(resolve, 800));

      try {
        const todayStr = dayjs().format("YYYY-MM-DD");

        // A. Fetch Student Data
        const studentDocRef = doc(db, "users", currentUser.uid);
        const studentDocSnap = await getDoc(studentDocRef);
        if (!studentDocSnap.exists())
          throw new Error("Student profile not found");
        const sData = studentDocSnap.data();
        setStudentData(sData);
        const currentTotalPoints = sData.totalPoints || 0;
        const teacherId = sData.createdByTeacherId;

        // --- 2. NEW: Fetch Teacher's Name using the ID we just found ---
        if (teacherId) {
          const teacherDocRef = doc(db, "users", teacherId);
          const teacherDocSnap = await getDoc(teacherDocRef);
          if (teacherDocSnap.exists()) {
            // Fallback to a generic name if displayName is missing
            setTeacherName(teacherDocSnap.data().displayName || "your Teacher");
          }
        }
        // --------------------------------------------------------------

        // B. Determine Next Badge (Logic unchanged)
        const badgesRef = collection(db, "badges");
        const qBadges = query(
          badgesRef,
          where("createdByTeacherId", "==", teacherId),
          orderBy("minPoints", "asc")
        );
        const badgeSnapshot = await getDocs(qBadges);
        let foundNextBadge = null;
        for (const doc of badgeSnapshot.docs) {
          const badge = doc.data();
          if (badge.minPoints > currentTotalPoints) {
            foundNextBadge = { id: doc.id, ...badge };
            break;
          }
        }
        setNextBadge(foundNextBadge);

        // C. Get Today's Tasks & Stats (Parallel Fetching for speed)
        const tasksRef = collection(db, "task_templates");
        const completionsRef = collection(
          db,
          "users",
          currentUser.uid,
          "completions"
        );

        const [activeTasksSnap, todaysCompletionsSnap] = await Promise.all([
          // 1. Get all active tasks for this student's teacher
          getDocs(
            query(
              tasksRef,
              where("createdByTeacherId", "==", teacherId),
              where("isActive", "==", true)
            )
          ),
          // 2. Get completions explicitly done TODAY
          getDocs(
            query(completionsRef, where("dateCompleted", "==", todayStr))
          ),
        ]);

        // Process Completions for Stats
        let pointsEarnedToday = 0;
        const completedTaskIds = new Set();
        todaysCompletionsSnap.forEach((doc) => {
          const data = doc.data();
          pointsEarnedToday += data.pointsEarned || 0;
          completedTaskIds.add(data.taskId);
        });

        // Process Tasks for list
        const taskList = [];
        activeTasksSnap.forEach((doc) => {
          const task = { id: doc.id, ...doc.data() };
          // Basic check if task is active today based on dates
          const todayDate = dayjs();
          const start = dayjs(task.startDate.toDate());
          const end = dayjs(task.endDate.toDate());

          if (
            (todayDate.isAfter(start, "day") ||
              todayDate.isSame(start, "day")) &&
            (todayDate.isBefore(end, "day") || todayDate.isSame(end, "day"))
          ) {
            // Mark if completed today
            task.isCompletedToday = completedTaskIds.has(task.id);
            taskList.push(task);
          }
        });

        setTodaysTasks(taskList);
        setStats({
          pointsEarnedToday,
          completedTodayCount: completedTaskIds.size,
          totalActiveTasks: taskList.length,
        });
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  if (loading) {
    // Use a simple loading spinner for the whole page state
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!studentData) return <Typography>Error loading profile.</Typography>;

  // Calculate progress to next badge
  let progressToNextBadge = 0;
  if (nextBadge) {
    // Simple calculation: current / target * 100
    progressToNextBadge = Math.min(
      (studentData.totalPoints / nextBadge.minPoints) * 100,
      100
    );
  }

  return (
    <Box maxWidth="lg" sx={{ mx: "auto" }}>
      {/* Welcome Header Banner */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 4,
          background: "linear-gradient(135deg, #2e7d32 30%, #43a047 90%)",
          color: "white",
          display: "flex",
          alignItems: "center",
        }}
      >
        {/* 3. UPDATED AVATAR: Use photoUrl if available */}
        <Avatar
          src={studentData.photoUrl}
          sx={{
            width: 80,
            height: 80,
            mr: 3,
            border: "3px solid white",
            boxShadow: 2,
            bgcolor: "success.light",
            fontSize: "2rem",
          }}
        >
          {studentData.displayName?.charAt(0)}
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Welcome,{" "}
            {studentData.displayName
              ? studentData.displayName.split(" ")[0]
              : "Student"}
            !
          </Typography>
          {/* 4. NEW: Display Teacher Name */}
          <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
            Class of {teacherName || "..."} | Let's have a great day!
          </Typography>
        </Box>
      </Paper>

      {/* Stats Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <SummaryCard
            title="Total Points"
            value={studentData.totalPoints?.toLocaleString()}
            icon={<EmojiEventsIcon />}
            color="#fbc02d" // Gold color
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <SummaryCard
            title="Earned Today"
            value={`+${stats.pointsEarnedToday}`}
            icon={<TrendingUpIcon />}
            color="#4caf50" // Green color
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <SummaryCard
            title="Today's Progress"
            value={`${stats.completedTodayCount} / ${stats.totalActiveTasks}`}
            icon={<AssignmentIcon />}
            color="#0288d1" // Blue color
            loading={loading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Today's Tasks List */}
        <Grid item xs={12} md={7}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, height: "100%" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" fontWeight="bold">
                Today's Tasks
              </Typography>
              <Button
                variant="text"
                endIcon={<ChevronRightIcon />}
                onClick={() => navigate("/student/tracker")}
              >
                Go to Tracker
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {todaysTasks.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2 }}>
                No tasks scheduled for today.
              </Typography>
            ) : (
              <List dense>
                {todaysTasks.slice(0, 5).map((task) => (
                  <ListItem key={task.id}>
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: task.isCompletedToday
                            ? "success.main"
                            : "grey.300",
                          color: "white",
                        }}
                      >
                        <AssignmentIcon fontSize="small" />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={task.name}
                      secondary={
                        <Chip
                          label={`${task.points} pts`}
                          size="small"
                          sx={{ mt: 0.5, height: 20, fontSize: "0.65rem" }}
                        />
                      }
                      // === ADD THIS LINE ===
                      // This tells MUI to render the secondary container as a 'div' instead of a 'p'
                      secondaryTypographyProps={{ component: "div" }}
                      // =====================
                    />
                    {task.isCompletedToday && (
                      <Chip label="Done" color="success" size="small" />
                    )}
                  </ListItem>
                ))}
                {todaysTasks.length > 5 && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 1, textAlign: "center" }}
                  >
                    And {todaysTasks.length - 5} more...
                  </Typography>
                )}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Next Badge Goal */}
        <Grid item xs={12} md={5}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 3,
              height: "100%",
              bgcolor: "#fffde7",
              border: "2px solid #fff9c4",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <Typography
              variant="h6"
              fontWeight="bold"
              gutterBottom
              color="#f57f17"
            >
              Next Goal
            </Typography>
            {nextBadge ? (
              <>
                <Box sx={{ my: 3, transform: "scale(1.2)" }}>
                  <BadgeToken
                    name={nextBadge.name}
                    minPoints={nextBadge.minPoints}
                    maxPoints={nextBadge.maxPoints}
                  />
                </Box>
                <Typography variant="h5" fontWeight="bold">
                  {nextBadge.name}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {nextBadge.minPoints - studentData.totalPoints} more points
                  needed
                </Typography>
                {/* Simple Progress Bar */}
                <Box
                  sx={{
                    width: "100%",
                    height: 10,
                    bgcolor: "#fff176",
                    borderRadius: 5,
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      width: `${progressToNextBadge}%`,
                      height: "100%",
                      bgcolor: "#fbc02d",
                      transition: "width 0.5s ease-in-out",
                    }}
                  />
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  {Math.round(progressToNextBadge)}% to goal
                </Typography>
              </>
            ) : (
              <Box sx={{ py: 4 }}>
                <EmojiEventsIcon
                  sx={{ fontSize: 60, color: "#fbc02d", mb: 2 }}
                />
                <Typography variant="h6">Max Level Reached!</Typography>
                <Typography variant="body2">
                  You have earned all available badges.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentDashboard;
