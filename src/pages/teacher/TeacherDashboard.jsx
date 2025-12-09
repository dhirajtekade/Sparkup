import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";
// Added doc, getDoc, setDoc to imports
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  getCountFromServer,
  doc,
  getDoc,
  setDoc,
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
  Tooltip,
  // Added components for the switch switch
  Switch,
  FormGroup,
  FormControlLabel,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import AssignmentIcon from "@mui/icons-material/Assignment";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
// Added Settings Icon
import SettingsIcon from "@mui/icons-material/Settings";
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

// Helper: Calculate Health Status based on lastActivityAt (unchanged)
const getStudentHealthStatus = (lastActivityTimestamp) => {
  if (!lastActivityTimestamp) {
    return {
      status: "inactive",
      label: "No activity recorded yet",
      color: "text.disabled",
    };
  }
  const lastActivity = dayjs(lastActivityTimestamp.toDate());
  const now = dayjs();
  const diffInDays = now.diff(lastActivity, "day", true);

  if (diffInDays < 1) {
    return { status: "active", label: "Active today", color: "success.main" };
  } else if (diffInDays < 3) {
    return {
      status: "warning",
      label: "Active recently (1-3 days ago)",
      color: "warning.main",
    };
  } else {
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
    priorityStudents: [],
  });

  // --- NEW STATE FOR LEADERBOARD SETTING ---
  const [isLeaderboardEnabled, setIsLeaderboardEnabled] = useState(false);
  const [settingLoading, setSettingLoading] = useState(false);
  // -----------------------------------------

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        const teacherId = currentUser.uid;
        const studentsRef = collection(db, "users");
        const tasksRef = collection(db, "task_templates");

        // --- NEW: Fetch Teacher's Own Document for Settings ---
        const teacherDocRef = doc(db, "users", teacherId);
        const teacherDocSnap = await getDoc(teacherDocRef);
        if (teacherDocSnap.exists()) {
          // Default to false if the field doesn't exist yet
          setIsLeaderboardEnabled(
            teacherDocSnap.data().leaderboardEnabled || false
          );
        }
        // ------------------------------------------------------

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

        // Sort students by health status
        studentList.sort((a, b) => {
          const getScore = (student) => {
            const { status } = getStudentHealthStatus(student.lastActivityAt);
            if (status === "at-risk") return 0;
            if (status === "warning") return 1;
            if (status === "inactive") return 2;
            return 3;
          };
          return getScore(a) - getScore(b);
        });

        // 2. Get Active Task Count
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
          priorityStudents: studentList.slice(0, 5),
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // --- NEW HANDLER: Toggle Leaderboard Setting ---
  const handleToggleLeaderboard = async (event) => {
    const newValue = event.target.checked;
    setSettingLoading(true);
    // Optimistic UI update
    setIsLeaderboardEnabled(newValue);

    try {
      const teacherRef = doc(db, "users", currentUser.uid);
      // Use setDoc with merge: true to create/update the field safely
      await setDoc(
        teacherRef,
        { leaderboardEnabled: newValue },
        { merge: true }
      );
    } catch (error) {
      console.error("Error updating leaderboard setting:", error);
      // Rollback on error
      setIsLeaderboardEnabled(!newValue);
      alert("Failed to update setting. Please check your connection.");
    } finally {
      setSettingLoading(false);
    }
  };
  // -----------------------------------------------

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

      {/* Bottom Row: Reports & Settings */}
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
                  const health = getStudentHealthStatus(student.lastActivityAt);
                  return (
                    <ListItem
                      key={student.id}
                      divider={index < stats.priorityStudents.length - 1}
                      secondaryAction={
                        <Tooltip title={health.label}>
                          <FiberManualRecordIcon sx={{ color: health.color }} />
                        </Tooltip>
                      }
                    >
                      <ListItemAvatar>
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

        {/* --- NEW SECTION: Class Settings (Leaderboard Toggle) --- */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{ p: 3, height: "100%", bgcolor: "#f5f7fa" }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                color: "text.secondary",
                display: "flex",
                alignItems: "center",
              }}
            >
              <SettingsIcon sx={{ mr: 1 }} /> Class Settings
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Box sx={{ bgcolor: "white", p: 3, borderRadius: 2, boxShadow: 1 }}>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isLeaderboardEnabled}
                      onChange={handleToggleLeaderboard}
                      disabled={settingLoading}
                    />
                  }
                  label={
                    <Typography fontWeight="bold">
                      Enable Class Leaderboard
                    </Typography>
                  }
                />
              </FormGroup>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1, ml: 1 }}
              >
                When enabled, students will be able to see a ranked list of top
                students in their student portal based on total points.
              </Typography>
            </Box>
          </Paper>
        </Grid>
        {/* ------------------------------------------------------- */}
      </Grid>
    </Box>
  );
};

export default TeacherDashboard;
