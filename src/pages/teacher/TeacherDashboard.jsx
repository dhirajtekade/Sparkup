import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  getCountFromServer,
} from "firebase/firestore";
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
  Tooltip, // Added Tooltip
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import AssignmentIcon from "@mui/icons-material/Assignment";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
// import { FiberManualRecord } from '@mui/icons-material';
import dayjs from "dayjs";

// Helper component for summary cards (unchanged)
const SummaryCard = ({ title, value, icon, color }) => (
  <Paper
    elevation={3}
    sx={{
      p: 3,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      bgcolor: color,
      color: "white",
      height: "100%",
    }}
  >
    <Box>
      <Typography variant="h4" fontWeight="bold">
        {value}
      </Typography>
      <Typography variant="subtitle1">{title}</Typography>
    </Box>
    <Box sx={{ opacity: 0.8 }}>{icon}</Box>
  </Paper>
);

// --- NEW HELPER: Calculate Health Status based on lastActivityAt ---
const getStudentHealthStatus = (lastActivityTimestamp) => {
  // If no activity ever recorded
  if (!lastActivityTimestamp) {
    return {
      status: "inactive",
      label: "No activity recorded yet",
      color: "text.disabled",
    };
  }

  const lastActivity = dayjs(lastActivityTimestamp.toDate());
  const now = dayjs();
  // Calculate difference in days (using float for precision)
  const diffInDays = now.diff(lastActivity, "day", true);

  if (diffInDays < 1) {
    // Active in the last 24 hours
    return { status: "active", label: "Active today", color: "success.main" };
  } else if (diffInDays < 3) {
    // Active between 1 and 3 days ago
    return {
      status: "warning",
      label: "Active recently (1-3 days ago)",
      color: "warning.main",
    };
  } else {
    // Inactive for 3 or more days
    return {
      status: "at-risk",
      label: "At risk (3+ days inactive)",
      color: "error.main",
    };
  }
};

const TeacherDashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    studentCount: 0,
    activeTaskCount: 0,
    totalPointsEarned: 0,
    // Renamed state to reflect it's now sorted by health priority
    priorityStudents: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        const teacherId = currentUser.uid;
        const studentsRef = collection(db, "users");
        const tasksRef = collection(db, "task_templates");

        // 1. Fetch ALL Students to calculate health and total points
        const qAllStudents = query(
          studentsRef,
          where("role", "==", "student"),
          where("createdByTeacherId", "==", teacherId)
        );
        const allStudentsSnap = await getDocs(qAllStudents);

        const studentList = [];
        let totalPoints = 0;

        allStudentsSnap.forEach((doc) => {
          const data = doc.data();
          studentList.push({ id: doc.id, ...data });
          totalPoints += data.totalPoints || 0;
        });

        const studentCount = studentList.length;

        // --- NEW: SORT STUDENTS BY HEALTH STATUS ---
        // Priority: At-Risk (Red) -> Warning (Yellow) -> Inactive (Grey) -> Active (Green)
        studentList.sort((a, b) => {
          const getScore = (student) => {
            const { status } = getStudentHealthStatus(student.lastActivityAt);
            if (status === "at-risk") return 0; // Highest priority
            if (status === "warning") return 1;
            if (status === "inactive") return 2;
            return 3; // Lowest priority (Active)
          };
          return getScore(a) - getScore(b);
        });
        // -----------------------------------------------------------

        // 2. Get Active Task Count (optimized)
        const taskSnap = await getCountFromServer(
          query(
            tasksRef,
            where("isActive", "==", true),
            where("createdByTeacherId", "==", teacherId)
          )
        );
        const activeTaskCount = taskSnap.data().count;

        setStats({
          studentCount,
          activeTaskCount,
          totalPointsEarned: totalPoints,
          // Show top 5 students based on the health priority sort
          priorityStudents: studentList.slice(0, 5),
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ mb: 4, fontWeight: "bold", color: "primary.main" }}
      >
        Class Overview
      </Typography>

      {/* Top Row: Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <SummaryCard
            title="Total Students"
            value={stats.studentCount}
            icon={<PeopleIcon sx={{ fontSize: 60 }} />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <SummaryCard
            title="Active Tasks"
            value={stats.activeTaskCount}
            icon={<AssignmentIcon sx={{ fontSize: 60 }} />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <SummaryCard
            title="Class Total Points"
            value={stats.totalPointsEarned.toLocaleString()}
            icon={<EmojiEventsIcon sx={{ fontSize: 60 }} />}
            color="#ed6c02"
          />
        </Grid>
      </Grid>

      {/* Bottom Row: Reports */}
      <Grid container spacing={3}>
        {/* Report 1: Class Health Priority */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: "100%" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  color: "primary.main",
                }}
              >
                <EmojiEventsIcon color="inherit" sx={{ mr: 1 }} /> Class Health
                Priority
              </Typography>
              <Chip
                label="At-Risk First"
                size="small"
                color="error"
                variant="outlined"
              />
            </Box>
            <Divider sx={{ mb: 2 }} />

            {stats.priorityStudents.length === 0 ? (
              <Typography sx={{ p: 2 }} color="text.secondary">
                No students enrolled yet.
              </Typography>
            ) : (
              <List dense>
                {stats.priorityStudents.map((student, index) => {
                  // --- NEW: Get Health Status ---
                  const health = getStudentHealthStatus(student.lastActivityAt);

                  return (
                    <ListItem
                      key={student.id}
                      divider={index < stats.priorityStudents.length - 1}
                      // --- NEW: Add status icon as secondary action ---
                      secondaryAction={
                        <Tooltip title={health.label}>
                          <FiberManualRecordIcon sx={{ color: health.color }} />
                        </Tooltip>
                      }
                    >
                      <ListItemAvatar>
                        {/* Used a standard primary color for the avatar background instead of the ranking colors */}
                        <Avatar
                          sx={{
                            bgcolor: "primary.light",
                            color: "white",
                            fontWeight: "bold",
                          }}
                        >
                          {student.displayName
                            ? student.displayName.charAt(0).toUpperCase()
                            : student.email.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      {/* Using email as fallback for name */}
                      <ListItemText
                        primary={student.displayName || student.email}
                        primaryTypographyProps={{ fontWeight: "medium" }}
                        secondary={`${student.totalPoints || 0} pts`}
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Placeholder for future report or quick actions */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{ p: 3, height: "100%", bgcolor: "#f5f7fa" }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: "text.secondary" }}
            >
              Quick Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Select a tab from the sidebar to manage students, tasks, badges,
              and goals.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeacherDashboard;
