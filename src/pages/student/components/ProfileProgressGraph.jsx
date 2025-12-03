import { useState, useMemo } from "react";
import {
  // Added Divider to this import list
  Box,
  Typography,
  Paper,
  Skeleton,
  useTheme,
  FormControl,
  Select,
  MenuItem,
  Grid,
  Divider,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";

// Receive new props containing raw data
const ProfileProgressGraph = ({
  loading,
  rawCompletions,
  activeTasks,
  startingTotalPoints,
}) => {
  const theme = useTheme();
  // State for the dropdown filter
  const [selectedTaskId, setSelectedTaskId] = useState("all");

  // --- CORE LOGIC: Recalculate chart data whenever filter or raw data changes ---
  const chartData = useMemo(() => {
    if (loading) return [];

    const today = dayjs();
    const data = [];

    // Determine starting baseline value based on filter
    // If 'all', start with the calculated total from 30 days ago.
    // If specific task, start at 0 (cumulative gain for just that task).
    let runningTotal = selectedTaskId === "all" ? startingTotalPoints : 0;

    // Iterate forward from 30 days ago up to today
    for (let i = 29; i >= 0; i--) {
      const dateObj = today.subtract(i, "day");
      const dateStr = dateObj.format("YYYY-MM-DD");
      const displayDate = dateObj.format("MMM D");

      // 1. Filter completions for this specific date
      let dailyCompletions = rawCompletions.filter(
        (c) => c.dateCompleted === dateStr
      );

      // 2. If a specific task is selected, further filter by task ID
      if (selectedTaskId !== "all") {
        dailyCompletions = dailyCompletions.filter(
          (c) => c.taskId === selectedTaskId
        );
      }

      // 3. Sum points gained on this day based on filters
      const dailyPointsGained = dailyCompletions.reduce(
        (sum, c) => sum + (c.pointsEarned || 0),
        0
      );

      // 4. Add to running total
      runningTotal += dailyPointsGained;

      // 5. Push to chart array
      data.push({
        date: displayDate,
        points: runningTotal,
      });
    }

    return data;
  }, [loading, rawCompletions, selectedTaskId, startingTotalPoints]);

  if (loading) {
    return (
      <Skeleton
        variant="rectangular"
        height={250}
        sx={{ mb: 4, borderRadius: 3 }}
      />
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{ p: 3, mb: 4, borderRadius: 3, bgcolor: "white" }}
    >
      <Grid
        container
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid item>
          <Typography
            variant="h6"
            sx={{
              display: "flex",
              alignItems: "center",
              color: "success.dark",
            }}
          >
            <TrendingUpIcon sx={{ mr: 1 }} /> 30-Day Progress Trend
          </Typography>
        </Grid>
        <Grid item>
          {/* DROPDOWN FILTER */}
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              displayEmpty
              inputProps={{ "aria-label": "Select trend view" }}
            >
              <MenuItem value="all" sx={{ fontWeight: "bold" }}>
                View Total Points History
              </MenuItem>
              {/* This Divider was causing the error because it wasn't imported */}
              {activeTasks.length > 0 && <Divider />}
              {activeTasks.map((task) => (
                <MenuItem key={task.id} value={task.id}>
                  Task: {task.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Box sx={{ width: "100%", height: 250 }}>
        <ResponsiveContainer>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={theme.palette.success.main}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={theme.palette.success.main}
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            {/* Adjust tick interval based on data length */}
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickMargin={10}
              interval={chartData.length > 15 ? 2 : 0}
            />
            <YAxis tick={{ fontSize: 12 }} width={40} />
            <ChartTooltip
              contentStyle={{
                borderRadius: 8,
                borderColor: theme.palette.success.light,
              }}
              formatter={(value) => [
                `${value} pts`,
                selectedTaskId === "all" ? "Total Score" : "Cumulative Gain",
              ]}
            />
            <Area
              type="monotone"
              dataKey="points"
              stroke={theme.palette.success.main}
              fillOpacity={1}
              fill="url(#colorPoints)"
              animationDuration={500} // Add animation for smooth transitions when filtering
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default ProfileProgressGraph;
