import { useState, useEffect, useMemo } from "react";
import { db } from "../firebase"; // Adjusted path for components folder
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  getDoc,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext"; // Adjusted path
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Divider,
  Alert,
  useTheme,
  TextField,
  MenuItem,
} from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";
import BlockIcon from "@mui/icons-material/Block";
import FilterListIcon from "@mui/icons-material/FilterList";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const TASK_COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#a05195",
  "#d45087",
];

// Renamed component to act as a shared component
const LeaderboardChart = () => {
  // Get userRole from auth context to determine behavior
  const { currentUser, userRole } = useAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const [rawChartData, setRawChartData] = useState([]);
  const [taskNamesList, setTaskNamesList] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.uid || !userRole) return;
      setLoading(true);
      try {
        let teacherIdToQuery = null;
        let leaderboardShouldBeVisible = false;

        // --- ROLE-BASED INITIALIZATION ---
        if (userRole === "teacher") {
          // If Teacher: They query their own ID, and it's always visible
          teacherIdToQuery = currentUser.uid;
          leaderboardShouldBeVisible = true;
        } else if (userRole === "student") {
          // If Student: Find teacher ID and check setting
          const studentDocRef = doc(db, "users", currentUser.uid);
          const studentDocSnap = await getDoc(studentDocRef);
          if (!studentDocSnap.exists())
            throw new Error("Student profile not found");
          teacherIdToQuery = studentDocSnap.data().createdByTeacherId;

          const teacherDocRef = doc(db, "users", teacherIdToQuery);
          const teacherDocSnap = await getDoc(teacherDocRef);
          leaderboardShouldBeVisible = teacherDocSnap.exists()
            ? teacherDocSnap.data().leaderboardEnabled || false
            : false;
        }

        // Update state based on role checks
        setIsEnabled(leaderboardShouldBeVisible);

        // If student view and disabled, stop here
        if (!leaderboardShouldBeVisible) {
          setLoading(false);
          return;
        }

        // --- CORE DATA FETCHING (Shared Logic) ---
        // Fetch Top 10 Students for the determined teacherId
        const studentsRef = collection(db, "users");
        const qTopStudents = query(
          studentsRef,
          where("role", "==", "student"),
          where("createdByTeacherId", "==", teacherIdToQuery),
          orderBy("totalPoints", "desc"),
          limit(10)
        );
        const topStudentsSnap = await getDocs(qTopStudents);
        const topStudentsBasic = [];
        topStudentsSnap.forEach((doc) => {
          topStudentsBasic.push({ id: doc.id, ...doc.data() });
        });

        if (topStudentsBasic.length === 0) {
          setRawChartData([]);
          setLoading(false);
          return;
        }

        // Advanced Data Aggregation (Fetching breakdown for top 10)
        const chartDataPromises = topStudentsBasic.map(async (student) => {
          const studentRow = {
            studentId: student.id,
            displayName: (
              student.displayName || student.email.split("@")[0]
            ).split(" ")[0],
            fullDisplayName: student.displayName || student.email.split("@")[0],
            totalPoints: student.totalPoints || 0,
          };

          const completionsRef = collection(
            db,
            "users",
            student.id,
            "completions"
          );
          const completionsSnap = await getDocs(completionsRef);

          completionsSnap.forEach((cDoc) => {
            const cData = cDoc.data();
            const taskName = (cData.taskName || "Other Tasks").replace(
              " (Bonus)",
              ""
            );
            const points = cData.pointsEarned || 0;
            studentRow[taskName] = (studentRow[taskName] || 0) + points;
          });
          return studentRow;
        });

        const processedChartData = await Promise.all(chartDataPromises);

        const allTaskSet = new Set();
        processedChartData.forEach((row) => {
          Object.keys(row).forEach((key) => {
            if (
              ![
                "studentId",
                "displayName",
                "fullDisplayName",
                "totalPoints",
              ].includes(key)
            ) {
              allTaskSet.add(key);
            }
          });
        });

        setTaskNamesList(Array.from(allTaskSet).sort());
        setRawChartData(processedChartData);
      } catch (error) {
        console.error("Error fetching leaderboard chart data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Add userRole to dependency array
  }, [currentUser, userRole]);

  // Memoize color mapping
  const taskColorMap = useMemo(() => {
    const map = {};
    taskNamesList.forEach((taskName, index) => {
      map[taskName] = TASK_COLORS[index % TASK_COLORS.length];
    });
    return map;
  }, [taskNamesList]);

  // Filter data based on dropdown selection
  const filteredChartData = useMemo(() => {
    if (selectedFilter === "all") {
      return rawChartData;
    }
    return rawChartData.map((studentRow) => {
      const taskPoints = studentRow[selectedFilter] || 0;
      return {
        ...studentRow,
        totalPoints: taskPoints,
        [selectedFilter]: taskPoints,
      };
    });
  }, [rawChartData, selectedFilter]);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const studentData = payload[0].payload;
      const total = studentData.totalPoints;

      return (
        <Paper
          sx={{
            p: 2,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 3,
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            {studentData.fullDisplayName}
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2" fontWeight="bold" color="primary">
            {selectedFilter === "all" ? "Total Points:" : `${selectedFilter}:`}{" "}
            {total} pts
          </Typography>

          {selectedFilter === "all" && (
            <Box sx={{ mt: 1 }}>
              {payload.map(
                (entry, index) =>
                  entry.value > 0 && (
                    <Typography
                      key={index}
                      variant="caption"
                      display="block"
                      sx={{
                        color: entry.color,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          width: 10,
                          height: 10,
                          bgcolor: entry.color,
                          mr: 1,
                          borderRadius: "50%",
                        }}
                      />
                      {entry.name}: {entry.value} pts
                    </Typography>
                  )
              )}
            </Box>
          )}
        </Paper>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    // Changed max width to xl for better view on teacher dashboards
    <Box maxWidth="xl" sx={{ mx: "auto", mt: 4 }}>
      <Typography
        variant="h4"
        gutterBottom
        fontWeight="bold"
        sx={{ display: "flex", alignItems: "center", color: "primary.main" }}
      >
        <BarChartIcon sx={{ mr: 2, fontSize: 40, color: "primary.main" }} />{" "}
        Class Leaderboard Chart
      </Typography>
      <Divider sx={{ mb: 4 }} />

      {!isEnabled ? (
        // This view will only be seen by STUDENTS if the teacher disabled it.
        // Teachers will never see this.
        <Paper
          elevation={3}
          sx={{
            p: 5,
            textAlign: "center",
            borderRadius: 4,
            bgcolor: "#fcfcfc",
          }}
        >
          <BlockIcon sx={{ fontSize: 60, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Leaderboard Disabled
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your teacher has turned off the leaderboard for this class.
          </Typography>
        </Paper>
      ) : (
        // === ENABLED CHART VIEW (Seen by Teachers OR enabled Students) ===
        <>
          {taskNamesList.length > 0 && (
            <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-end" }}>
              <TextField
                select
                label="Filter by Task"
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                size="small"
                sx={{ width: 250 }}
                InputProps={{
                  startAdornment: (
                    <FilterListIcon color="action" sx={{ mr: 1 }} />
                  ),
                }}
              >
                <MenuItem value="all" sx={{ fontWeight: "bold" }}>
                  Show All Tasks (Combined)
                </MenuItem>
                <Divider />
                {taskNamesList.map((taskName) => (
                  <MenuItem key={taskName} value={taskName}>
                    {taskName}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          )}

          <Paper elevation={3} sx={{ p: 3, borderRadius: 4, height: 500 }}>
            {rawChartData.length === 0 ? (
              <Alert severity="info" sx={{ m: 2 }}>
                No points data available yet to chart.
              </Alert>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="displayName"
                    tick={{ fill: theme.palette.text.secondary }}
                    axisLine={{ stroke: theme.palette.divider }}
                  />
                  <YAxis
                    tick={{ fill: theme.palette.text.secondary }}
                    axisLine={{ stroke: theme.palette.divider }}
                    label={{
                      value: "Points",
                      angle: -90,
                      position: "insideLeft",
                      fill: theme.palette.text.secondary,
                    }}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                  />
                  {selectedFilter === "all" && (
                    <Legend wrapperStyle={{ paddingTop: 20 }} />
                  )}

                  {selectedFilter === "all" ? (
                    taskNamesList.map((taskName) => (
                      <Bar
                        key={taskName}
                        dataKey={taskName}
                        stackId="a"
                        fill={taskColorMap[taskName]}
                        name={taskName}
                      />
                    ))
                  ) : (
                    <Bar
                      dataKey={selectedFilter}
                      fill={taskColorMap[selectedFilter]}
                      name={selectedFilter}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
};

export default LeaderboardChart;
