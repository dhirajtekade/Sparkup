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
} from "firebase/firestore";
// CORRECT
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
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import AssignmentIcon from "@mui/icons-material/Assignment";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

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
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    studentCount: 0,
    activeTaskCount: 0,
    topStudents: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        // 1. Count Students created by this teacher
        // Note: getCountFromServer is a cheaper way to just get the number
        const studentsRef = collection(db, "users");
        const qStudents = query(
          studentsRef,
          where("role", "==", "student"),
          where("createdByTeacherId", "==", currentUser.uid)
        );
        const studentSnapshot = await getCountFromServer(qStudents);
        const studentCount = studentSnapshot.data().count;

        // 2. Count Active Tasks created by this teacher
        const tasksRef = collection(db, "task_templates");
        const qTasks = query(
          tasksRef,
          where("isActive", "==", true),
          where("createdByTeacherId", "==", currentUser.uid)
        );
        const taskSnapshot = await getCountFromServer(qTasks);
        const activeTaskCount = taskSnapshot.data().count;

        // 3. Get Top 5 Students by points
        const qTopStudents = query(
          studentsRef,
          where("role", "==", "student"),
          where("createdByTeacherId", "==", currentUser.uid),
          orderBy("totalPoints", "desc"),
          limit(5)
        );
        // Note: If you get an index error here, click the link in console
        const topStudentsSnapshot = await getDocs(qTopStudents);
        const topStudents = [];
        topStudentsSnapshot.forEach((doc) => {
          topStudents.push({ id: doc.id, ...doc.data() });
        });

        setStats({
          studentCount,
          activeTaskCount,
          topStudents,
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
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Class Overview
      </Typography>

      {/* Top Row: Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <SummaryCard
            title="Total Students"
            value={stats.studentCount}
            icon={<PeopleIcon sx={{ fontSize: 60 }} />}
            color="#1976d2" // Blue
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <SummaryCard
            title="Active Tasks"
            value={stats.activeTaskCount}
            icon={<AssignmentIcon sx={{ fontSize: 60 }} />}
            color="#2e7d32" // Green
          />
        </Grid>
        {/* Placeholder for future stat (e.g., total points awarded today) */}
        <Grid item xs={12} sm={6} md={4}>
          <SummaryCard
            title="Class Total Points"
            // Calculate total points of top 5 just as a placeholder example
            value={
              stats.topStudents.reduce(
                (acc, curr) => acc + (curr.totalPoints || 0),
                0
              ) + "+"
            }
            icon={<EmojiEventsIcon sx={{ fontSize: 60 }} />}
            color="#ed6c02" // Orange
          />
        </Grid>
      </Grid>

      {/* Bottom Row: Leaderboard */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center" }}
            >
              <EmojiEventsIcon color="primary" sx={{ mr: 1 }} /> Top Performing
              Students
            </Typography>
            <Divider />
            {stats.topStudents.length === 0 ? (
              <Typography sx={{ p: 2 }} color="text.secondary">
                No student data yet.
              </Typography>
            ) : (
              <List>
                {stats.topStudents.map((student, index) => (
                  <ListItem
                    key={student.id}
                    divider={index < stats.topStudents.length - 1}
                  >
                    <ListItemAvatar>
                      {/* Highlight top 3 with different colors */}
                      <Avatar
                        sx={{
                          bgcolor:
                            index === 0
                              ? "gold"
                              : index === 1
                              ? "silver"
                              : index === 2
                              ? "#cd7f32"
                              : "primary.main",
                          color: index < 3 ? "black" : "white",
                          fontWeight: "bold",
                        }}
                      >
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={student.displayName || student.email}
                      primaryTypographyProps={{ fontWeight: "bold" }}
                    />
                    <Chip
                      label={`${student.totalPoints || 0} pts`}
                      color="primary"
                      variant={index === 0 ? "filled" : "outlined"}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        {/* Add another panel here later (e.g., Recent Activity) */}
      </Grid>
    </Box>
  );
};

export default TeacherDashboard;
