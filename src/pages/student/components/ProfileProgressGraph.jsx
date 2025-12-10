import { useState, useMemo } from "react";
import {
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
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth"; // Imported icon for new dropdown
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
// NEW IMPORTS FOR DATE HANDLING
import weekOfYear from "dayjs/plugin/weekOfYear";
import quarterOfYear from "dayjs/plugin/quarterOfYear";

// ACTIVATE DAYJS PLUGINS
dayjs.extend(weekOfYear);
dayjs.extend(quarterOfYear);

const ProfileProgressGraph = ({
  loading,
  rawCompletions,
  activeTasks,
  startingTotalPoints,
}) => {
  const theme = useTheme();
  // Existing task filter state
  const [selectedTaskId, setSelectedTaskId] = useState("all");
  // NEW: State for timeframe filter (default to 'day' for current behavior)
  const [selectedTimeframe, setSelectedTimeframe] = useState("day");

  // --- MAIN DATA PROCESSING LOGIC ---
  const chartData = useMemo(() => {
    if (loading) return [];

    const today = dayjs();
    let data = [];

    // 1. First, filter raw completions based on the selected task
    let filteredCompletions = rawCompletions;
    if (selectedTaskId !== "all") {
      filteredCompletions = rawCompletions.filter(
        (c) => c.taskId === selectedTaskId
      );
    }

    // 2. Logic for Daily view (Current behavior - last 30 days)
    if (selectedTimeframe === "day") {
      let runningTotal = selectedTaskId === "all" ? startingTotalPoints : 0;
      for (let i = 29; i >= 0; i--) {
        const dateObj = today.subtract(i, "day");
        const dateStr = dateObj.format("YYYY-MM-DD");
        const displayDate = dateObj.format("MMM D");

        const dailyPointsGained = filteredCompletions
          .filter((c) => c.dateCompleted === dateStr)
          .reduce((sum, c) => sum + (c.pointsEarned || 0), 0);

        runningTotal += dailyPointsGained;
        data.push({ date: displayDate, points: runningTotal });
      }
    }
    // 3. Logic for Aggregated views (Weekly, Monthly, Quarterly)
    else {
      // Group data based on timeframe
      const groupedData = {};
      let dateFormat, displayFormat, periodsToLookBack;

      // Configure formats based on selection
      switch (selectedTimeframe) {
        case "week":
          // Key format: "2023-W45", Display: "Wk 45"
          dateFormat = (d) => `${d.year()}-W${d.week()}`;
          displayFormat = (d) => `Wk ${d.week()}`;
          periodsToLookBack = 12; // Last 12 weeks
          break;
        case "month":
          // Key format: "2023-10", Display: "Oct"
          dateFormat = (d) => d.format("YYYY-MM");
          displayFormat = (d) => d.format("MMM");
          periodsToLookBack = 6; // Last 6 months
          break;
        case "quarter":
          // Key format: "2023-Q3", Display: "Q3"
          dateFormat = (d) => `${d.year()}-Q${d.quarter()}`;
          displayFormat = (d) => `Q${d.quarter()}`;
          periodsToLookBack = 4; // Last 4 quarters
          break;
        default:
          break;
      }

      // Initialize periods with 0 gain
      for (let i = periodsToLookBack - 1; i >= 0; i--) {
        const dateObj = today.subtract(i, selectedTimeframe);
        const key = dateFormat(dateObj);
        groupedData[key] = {
          display: displayFormat(dateObj),
          gain: 0,
        };
      }

      // Populate groups with completion data
      filteredCompletions.forEach((completion) => {
        const dateObj = dayjs(completion.dateCompleted);
        const key = dateFormat(dateObj);
        // Only add if this period is within our lookback range
        if (groupedData[key]) {
          groupedData[key].gain += completion.pointsEarned || 0;
        }
      });

      // Calculate running totals and finalize data array
      // Note: For aggregated views, startingTotalPoints is hard to apply accurately
      // across long timeframes without full historical data. For simplicity in
      // 'all' task view, we show cumulative gain over the selected periods.
      let runningTotal = 0;
      // Sort keys to ensure chronological order
      const sortedKeys = Object.keys(groupedData).sort();

      sortedKeys.forEach((key) => {
        runningTotal += groupedData[key].gain;
        data.push({
          date: groupedData[key].display, // Use friendly display format
          points: runningTotal,
        });
      });
    }

    return data;
  }, [
    loading,
    rawCompletions,
    selectedTaskId,
    selectedTimeframe,
    startingTotalPoints,
  ]);

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
        spacing={2} // Add spacing between grid items for better mobile layout
      >
        {/* Title */}
        <Grid item xs={12} md={4}>
          <Typography
            variant="h6"
            sx={{
              display: "flex",
              alignItems: "center",
              color: "success.dark",
            }}
          >
            <TrendingUpIcon sx={{ mr: 1 }} /> Progress Trend
          </Typography>
        </Grid>

        {/* FILTERS CONTAINER */}
        <Grid
          item
          xs={12}
          md={8}
          sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}
        >
          {/* 1. NEW TIMEFRAME DROPDOWN */}
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <Select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              displayEmpty
              inputProps={{ "aria-label": "Select timeframe" }}
              // Add an icon to the start for visual cue
              startAdornment={
                <CalendarMonthIcon
                  color="action"
                  fontSize="small"
                  sx={{ mr: 1, ml: -0.5 }}
                />
              }
            >
              <MenuItem value="day">Daily</MenuItem>
              <MenuItem value="week">Weekly</MenuItem>
              <MenuItem value="month">Monthly</MenuItem>
              <MenuItem value="quarter">Quarterly</MenuItem>
            </Select>
          </FormControl>

          {/* 2. EXISTING TASK DROPDOWN */}
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <Select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              displayEmpty
              inputProps={{ "aria-label": "Select task filter" }}
            >
              <MenuItem value="all" sx={{ fontWeight: "bold" }}>
                All Tasks (Total)
              </MenuItem>
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
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickMargin={10}
              // Don't skip ticks on bigger aggregations like Quarter
              interval={
                selectedTimeframe === "day" && chartData.length > 15 ? 2 : 0
              }
            />
            <YAxis tick={{ fontSize: 12 }} width={40} />
            <ChartTooltip
              contentStyle={{
                borderRadius: 8,
                borderColor: theme.palette.success.light,
              }}
              formatter={(value) => [
                `${value} pts`,
                // Dynamic Label based on task filter
                selectedTaskId === "all" ? "Total Score" : "Cumulative Gain",
              ]}
              // Dynamic Title based on timeframe filter
              labelFormatter={(label) => {
                let suffix = "";
                const todayYear = dayjs().format("YYYY");
                if (selectedTimeframe !== "day" && !label.includes(todayYear)) {
                  suffix = ` ${todayYear}`;
                }
                return `${label}${suffix}`;
              }}
            />
            <Area
              type="monotone"
              dataKey="points"
              stroke={theme.palette.success.main}
              fillOpacity={1}
              fill="url(#colorPoints)"
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default ProfileProgressGraph;
