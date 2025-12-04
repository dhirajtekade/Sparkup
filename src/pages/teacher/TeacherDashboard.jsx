import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  getCountFromServer,
  collectionGroup,
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
  Alert,
  Button,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import AssignmentIcon from "@mui/icons-material/Assignment";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

// Helper component for summary cards
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

const TeacherDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    studentCount: 0,
    activeTaskCount: 0,
    topStudents: [],
    atRiskStudents: [], // NEW STATE for report
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        const studentsRef = collection(db, "users");
        const tasksRef = collection(db, "task_templates");

        // 1. Basic Counts (Parallel fetching)
        const [studentSnap, taskSnap] = await Promise.all([
          getCountFromServer(
            query(
              studentsRef,
              where("role", "==", "student"),
              where("createdByTeacherId", "==", currentUser.uid)
            )
          ),
          getCountFromServer(
            query(
              tasksRef,
              where("isActive", "==", true),
              where("createdByTeacherId", "==", currentUser.uid)
            )
          ),
        ]);

        const studentCount = studentSnap.data().count;
        const activeTaskCount = taskSnap.data().count;

        // 2. Get Top 5 Students (Leaderboard)
        const qTopStudents = query(
          studentsRef,
          where("role", "==", "student"),
          where("createdByTeacherId", "==", currentUser.uid),
          orderBy("totalPoints", "desc"),
          limit(5)
        );
        const topStudentsSnapshot = await getDocs(qTopStudents);
        const topStudents = [];
        topStudentsSnapshot.forEach((doc) =>
          topStudents.push({ id: doc.id, ...doc.data() })
        );

        // --- NEW REPORT LOGIC: Find "At-Risk" Students Today ---
        let atRiskList = [];
        // Only run this report if there are actually students and active tasks
        if (studentCount > 0 && activeTaskCount > 0) {
          // A. Get all my students first
          const qAllMyStudents = query(
            studentsRef,
            where("role", "==", "student"),
            where("createdByTeacherId", "==", currentUser.uid)
          );
          const allStudentsSnap = await getDocs(qAllMyStudents);
          const allMyStudentIds = new Set();
          const studentMap = new Map(); // Map ID to student data for easy lookup later
          allStudentsSnap.forEach((doc) => {
            allMyStudentIds.add(doc.id);
            studentMap.set(doc.id, doc.data());
          });

          // B. Find who completed a task TODAY
          const todayStart = dayjs().startOf("day").format("YYYY-MM-DD");
          const todayEnd = dayjs().endOf("day").format("YYYY-MM-DD");

          // Use collectionGroup to query all 'completions' subcollections across the DB
          const completionsQuery = query(
            collectionGroup(db, "completions"),
            where("dateCompleted", ">=", todayStart),
            where("dateCompleted", "<=", todayEnd)
          );

          const completionsSnap = await getDocs(completionsQuery);
          const studentsWhoCompletedToday = new Set();

          // Filter completions to only count those done by MY students
          completionsSnap.forEach((doc) => {
            // The parent document of a completion is the user document.
            const studentId = doc.ref.parent.parent.id;
            if (allMyStudentIds.has(studentId)) {
              studentsWhoCompletedToday.add(studentId);
            }
          });

          // C. Find the difference: Students in my list who are NOT in the completion list
          allMyStudentIds.forEach((studentId) => {
            if (!studentsWhoCompletedToday.has(studentId)) {
              atRiskList.push({ id: studentId, ...studentMap.get(studentId) });
            }
          });
        }
        // -------------------------------------------------------

        setStats({
          studentCount,
          activeTaskCount,
          topStudents,
          atRiskStudents: atRiskList,
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
        {/* Placeholder for future stat */}
        <Grid item xs={12} sm={6} md={4}>
          <SummaryCard
            title="Class Total Points"
            value={
              stats.topStudents.reduce(
                (acc, curr) => acc + (curr.totalPoints || 0),
                0
              ) + "+"
            }
            icon={<EmojiEventsIcon sx={{ fontSize: 60 }} />}
            color="#ed6c02"
          />
        </Grid>
      </Grid>

      {/* Bottom Row: Reports */}
      <Grid container spacing={3}>
        {/* Report 1: Leaderboard */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: "100%" }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                display: "flex",
                alignItems: "center",
                color: "primary.main",
              }}
            >
              <EmojiEventsIcon color="inherit" sx={{ mr: 1 }} /> Top Performing
              Students
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {stats.topStudents.length === 0 ? (
              <Typography sx={{ p: 2 }} color="text.secondary">
                No student data yet.
              </Typography>
            ) : (
              <List dense>
                {stats.topStudents.map((student, index) => (
                  <ListItem
                    key={student.id}
                    divider={index < stats.topStudents.length - 1}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor:
                            index === 0
                              ? "#FFD700"
                              : index === 1
                              ? "#C0C0C0"
                              : index === 2
                              ? "#CD7F32"
                              : "primary.light",
                          color: index < 3 ? "black" : "white",
                          fontWeight: "bold",
                          width: 32,
                          height: 32,
                          fontSize: "0.9rem",
                        }}
                      >
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        student.displayName || student.email.split("@")[0]
                      }
                      primaryTypographyProps={{ fontWeight: "medium" }}
                    />
                    <Chip
                      label={`${student.totalPoints || 0} pts`}
                      color="primary"
                      size="small"
                      variant={index === 0 ? "filled" : "outlined"}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Report 2: NEW At-Risk Report */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{ p: 3, height: "100%", borderTop: "4px solid #ef5350" }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                display: "flex",
                alignItems: "center",
                color: "error.main",
              }}
            >
              <WarningAmberIcon color="inherit" sx={{ mr: 1 }} /> Today's
              Non-Completers
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {stats.activeTaskCount === 0 ? (
              <Alert severity="info">
                No active tasks assigned. Students cannot complete work.
              </Alert>
            ) : stats.studentCount === 0 ? (
              <Alert severity="info">No students in class.</Alert>
            ) : stats.atRiskStudents.length === 0 ? (
              <Alert severity="success" variant="outlined" sx={{ mt: 2 }}>
                All students have completed at least one task today!
              </Alert>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  These students have earned <b>0 points</b> today (
                  {dayjs().format("MMM D")}).
                </Typography>
                <List dense sx={{ maxHeight: 300, overflow: "auto" }}>
                  {stats.atRiskStudents.map((student, index) => (
                    <ListItem
                      key={student.id}
                      divider={index < stats.atRiskStudents.length - 1}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: "error.light",
                            color: "white",
                            width: 32,
                            height: 32,
                          }}
                        >
                          {(student.displayName || student.email)
                            .charAt(0)
                            .toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={student.displayName || student.email}
                        secondary="0 tasks completed today"
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => navigate("/teacher/students")}
                      >
                        View Profile
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeacherDashboard;
