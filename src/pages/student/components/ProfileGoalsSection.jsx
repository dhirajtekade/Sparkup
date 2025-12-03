import { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Skeleton,
  Chip,
  Divider,
  Avatar,
  Slider,
  Tooltip,
  useTheme,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FlagIcon from "@mui/icons-material/Flag";
import { SliderThumb } from "@mui/material/Slider";

// --- HELPER COMPONENTS ---

// 1. NEW: Student Avatar Pointer for the Slider
const StudentPositionAvatarThumb = (props) => {
  // We extract custom props we passed down (photoUrl, displayName) along with standard slider props
  const { children, style, photoUrl, displayName, ...other } = props;

  // Calculate initials for fallback
  const initials = displayName ? displayName.charAt(0).toUpperCase() : "You";

  return (
    // We must pass the 'style' and 'other' props to the root SliderThumb so MUI can position it
    <SliderThumb style={style} {...other}>
      {children}
      {/* Render Avatar inside the thumb */}
      <Avatar
        src={photoUrl}
        alt={displayName}
        sx={{
          width: "100%",
          height: "100%", // Fill the thumb container
          border: "3px solid white", // White border to make it pop against the line
          boxShadow: 3,
          bgcolor: "secondary.main", // Fallback color for initials
          fontWeight: "bold",
          fontSize: "0.9rem",
        }}
      >
        {!photoUrl && initials}
      </Avatar>
    </SliderThumb>
  );
};

// 2. NEW: Goal Avatar Marker for the "All" view timeline
const GoalMarkerAvatar = ({ goal, theme }) => {
  const isAchieved = goal.isAchieved;
  // Green border if achieved, grey if not
  const borderColor = isAchieved
    ? theme.palette.success.main
    : theme.palette.grey[400];
  const bgColor = isAchieved ? "#fffde7" : "#f5f5f5";

  return (
    <Tooltip
      title={`${goal.name}: ${goal.targetPoints} pts (${
        isAchieved ? "Achieved" : "Pending"
      })`}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          // Position so the bottom of the avatar sits just above the line
          transform: "translate(-50%, -55px)",
          cursor: "pointer",
          zIndex: 5,
          transition: "all 0.2s",
          "&:hover": {
            zIndex: 10,
            transform: "translate(-50%, -60px) scale(1.1)",
          },
        }}
      >
        <Avatar
          src={goal.imageUrl}
          sx={{
            width: 45,
            height: 45,
            border: `3px solid ${borderColor}`, // Colored border based on status
            bgcolor: bgColor,
            boxShadow: 2,
          }}
        >
          {/* Fallback icon if goal has no image URL */}
          <EmojiEventsIcon sx={{ color: isAchieved ? "#fbc02d" : "#bdbdbd" }} />
        </Avatar>
        {/* Point value label below the avatar */}
        <Typography
          variant="caption"
          sx={{
            mt: 0.5,
            color: theme.palette.text.secondary,
            fontWeight: "bold",
            whiteSpace: "nowrap",
            bgcolor: "rgba(255,255,255,0.8)",
            px: 0.5,
            borderRadius: 1,
          }}
        >
          {goal.targetPoints}
        </Typography>
        {/* Little stick pointing down to line */}
        <Box sx={{ width: 2, height: 10, bgcolor: borderColor, mt: -0.5 }} />
      </Box>
    </Tooltip>
  );
};

// --- MAIN COMPONENT ---
// 3. Receive new props: studentPhotoUrl, studentDisplayName
const ProfileGoalsSection = ({
  loading,
  goals,
  currentPoints,
  studentPhotoUrl,
  studentDisplayName,
}) => {
  const theme = useTheme();
  const [selectedGoalId, setSelectedGoalId] = useState("all");

  // Loading Skeleton
  if (loading) {
    return (
      <>
        <Skeleton variant="text" width="30%" height={40} sx={{ mb: 2 }} />
        <Divider sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={60} sx={{ mb: 4 }} />
        <Paper sx={{ p: 4, height: 300 }}>
          <Skeleton variant="rectangular" height="100%" />
        </Paper>
      </>
    );
  }

  // Empty State
  if (goals.length === 0) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ display: "flex", alignItems: "center" }}
        >
          <EmojiEventsIcon sx={{ mr: 1, color: "#fbc02d" }} /> My Journey
          Milestones
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Typography sx={{ p: 3 }} color="text.secondary">
          No journey milestones have been set by your teacher yet.
        </Typography>
      </Box>
    );
  }

  // Calculations for "All" view
  const maxTargetFound = Math.max(...goals.map((g) => g.targetPoints), 0);
  const masterBoundary = maxTargetFound > 0 ? maxTargetFound : 100;
  const masterMin = -masterBoundary;
  const masterMax = masterBoundary;

  const getPositionPercentage = (value) => {
    const totalRange = masterMax - masterMin;
    const position = value - masterMin;
    return (position / totalRange) * 100;
  };

  const selectedGoalData =
    selectedGoalId === "all"
      ? null
      : goals.find((g) => g.id === selectedGoalId);

  // Common styling for the student's avatar slider thumb
  const sliderThumbStyling = {
    height: 40,
    width: 40, // Make it big enough for an avatar
    // We remove default background/border as the Avatar component handles it now
    backgroundColor: "transparent",
    border: "none",
    boxShadow: "none",
    "&:before": { display: "none" }, // Remove MUI hover halo effect
    "&.Mui-disabled": {
      height: 40,
      width: 40,
      backgroundColor: "transparent",
      border: "none",
    },
  };

  return (
    <Box sx={{ mt: 5, mb: 10 }}>
      {/* HEADER & FILTER */}
      <Grid
        container
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid item>
          <Typography
            variant="h5"
            sx={{ display: "flex", alignItems: "center" }}
          >
            <EmojiEventsIcon sx={{ mr: 1, color: "#fbc02d" }} /> My Journey
            Milestones
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel id="goal-filter-label">View Journey View</InputLabel>
            <Select
              labelId="goal-filter-label"
              value={selectedGoalId}
              label="View Journey View"
              onChange={(e) => setSelectedGoalId(e.target.value)}
            >
              <MenuItem value="all" sx={{ fontWeight: "bold" }}>
                🗺️ All Milestones Map
              </MenuItem>
              <Divider />
              {goals.map((goal) => (
                <MenuItem key={goal.id} value={goal.id}>
                  {goal.isAchieved ? "✅ " : "📍 "} {goal.name} (
                  {goal.targetPoints} pts)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <Divider sx={{ mb: 4 }} />

      {/* === VIEW 1: MASTER MAP ("ALL" SELECTED) === */}
      {selectedGoalId === "all" && (
        <Paper
          elevation={3}
          sx={{
            p: 5,
            pb: 10,
            bgcolor: "#fffcf0",
            borderRadius: 4,
            position: "relative",
            overflow: "visible",
          }}
        >
          <Typography
            variant="h6"
            align="center"
            gutterBottom
            sx={{ color: "text.secondary", mb: 8 }}
          >
            Full Journey Map
          </Typography>

          <Box sx={{ position: "relative", px: 2 }}>
            {/* Labels */}
            <Typography
              variant="caption"
              display="flex"
              justifyContent="space-between"
              fontWeight="bold"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              <span>Start ({masterMin})</span>
              <span>Highest Target ({masterMax})</span>
            </Typography>

            {/* 1. Student Position Slider with Avatar Thumb */}
            <Tooltip title={`Your Current Position: ${currentPoints} Points`}>
              <Slider
                value={Math.max(masterMin, Math.min(masterMax, currentPoints))}
                min={masterMin}
                max={masterMax}
                disabled
                // Pass custom component and its needed props
                components={{ Thumb: StudentPositionAvatarThumb }}
                componentsProps={{
                  thumb: {
                    photoUrl: studentPhotoUrl,
                    displayName: studentDisplayName,
                  },
                }}
                sx={{
                  height: 12,
                  color: theme.palette.primary.main,
                  "& .MuiSlider-rail": {
                    opacity: 0.6,
                    backgroundColor: "#bdbdbd",
                    height: 12,
                    borderRadius: 6,
                  },
                  "& .MuiSlider-track": {
                    border: "none",
                    height: 12,
                    borderRadius: 6,
                  },
                  // Apply our custom thumb styling
                  "& .MuiSlider-thumb": sliderThumbStyling,
                  "& .MuiSlider-valueLabel": { display: "none" },
                }}
              />
            </Tooltip>

            {/* 2. Overlay Goal Avatar Markers */}
            {goals.map((goal) => (
              <Box
                key={goal.id}
                sx={{
                  position: "absolute",
                  top: 6,
                  left: `${getPositionPercentage(goal.targetPoints)}%`,
                }}
              >
                {/* Use new Avatar marker component */}
                <GoalMarkerAvatar goal={goal} theme={theme} />
              </Box>
            ))}

            {/* Zero Marker */}
            <Box
              sx={{
                position: "absolute",
                top: 20,
                left: "50%",
                transform: "translateX(-50%)",
                borderLeft: "2px dashed #ccc",
                height: 30,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  position: "absolute",
                  bottom: -25,
                  left: -5,
                  color: "text.secondary",
                }}
              >
                0
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* === VIEW 2: SINGLE GOAL FOCUSED VIEW === */}
      {selectedGoalData && (
        <Paper
          elevation={selectedGoalData.isAchieved ? 4 : 2}
          sx={{
            p: 4,
            pb: 6,
            borderRadius: 4,
            border: selectedGoalData.isAchieved
              ? `2px solid ${theme.palette.success.main}`
              : "none",
            bgcolor: selectedGoalData.isAchieved ? "#f9fbe7" : "white",
          }}
        >
          <Grid container spacing={4} alignItems="center">
            <Grid item>
              {selectedGoalData.isAchieved && (
                <Chip
                  label="Achieved!"
                  color="success"
                  sx={{ fontWeight: "bold", mb: 2 }}
                />
              )}
              <Box
                sx={{
                  height: 100,
                  width: 100,
                  bgcolor: selectedGoalData.isAchieved ? "#fffde7" : "#f5f5f5",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 4,
                  border: "1px solid #eee",
                }}
              >
                {selectedGoalData.imageUrl ? (
                  <Avatar
                    src={selectedGoalData.imageUrl}
                    sx={{ width: 80, height: 80 }}
                    variant="rounded"
                  />
                ) : (
                  <EmojiEventsIcon
                    sx={{
                      fontSize: 60,
                      color: selectedGoalData.isAchieved
                        ? "#fbc02d"
                        : "#bdbdbd",
                    }}
                  />
                )}
              </Box>
            </Grid>
            <Grid item xs>
              <Typography variant="h5" gutterBottom>
                {selectedGoalData.name}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {selectedGoalData.description}
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 5 }} />

          {/* Single Goal Journey Line with Avatar Thumb */}
          <Box sx={{ px: 2, mt: 4 }}>
            {(() => {
              const target = selectedGoalData.targetPoints;
              const rangeBoundary = target > 0 ? target : 100;
              const minVal = -rangeBoundary;
              const maxVal = rangeBoundary;
              const clampedCurrentVal = Math.max(
                minVal,
                Math.min(maxVal, currentPoints)
              );
              const isAchieved = selectedGoalData.isAchieved;
              const lineColor = isAchieved
                ? theme.palette.success.main
                : theme.palette.primary.main;

              return (
                <>
                  <Typography
                    variant="caption"
                    display="flex"
                    justifyContent="space-between"
                    fontWeight="bold"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    <span>Start ({minVal})</span>
                    <span>Target ({maxVal})</span>
                  </Typography>
                  <Tooltip
                    title={`Your Current Position: ${currentPoints} Points`}
                  >
                    <Slider
                      value={clampedCurrentVal}
                      min={minVal}
                      max={maxVal}
                      disabled
                      components={{ Thumb: StudentPositionAvatarThumb }}
                      componentsProps={{
                        thumb: {
                          photoUrl: studentPhotoUrl,
                          displayName: studentDisplayName,
                        },
                      }}
                      sx={{
                        height: 16,
                        color: lineColor,
                        "& .MuiSlider-rail": {
                          opacity: 0.5,
                          backgroundColor: "#bdbdbd",
                          height: 16,
                          borderRadius: 8,
                        },
                        "& .MuiSlider-track": {
                          border: "none",
                          height: 16,
                          borderRadius: 8,
                        },
                        // Use custom Avatar thumb styling
                        "& .MuiSlider-thumb": sliderThumbStyling,
                      }}
                    />
                  </Tooltip>
                  <Box sx={{ position: "relative", height: 20, mt: 0.5 }}>
                    <Box
                      sx={{
                        position: "absolute",
                        right: -10,
                        top: 2,
                        color: isAchieved
                          ? theme.palette.success.dark
                          : "text.secondary",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <FlagIcon fontSize="large" />
                      <Typography variant="caption" fontWeight="bold">
                        {target} pts
                      </Typography>
                    </Box>
                  </Box>
                </>
              );
            })()}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default ProfileGoalsSection;
