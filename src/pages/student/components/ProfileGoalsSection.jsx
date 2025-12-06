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

// 1. Student Avatar Pointer for the Slider
const StudentPositionAvatarThumb = (props) => {
  const { children, style, photoUrl, displayName, ...other } = props;
  const initials = displayName ? displayName.charAt(0).toUpperCase() : "You";

  return (
    <SliderThumb style={style} {...other}>
      {children}
      <Avatar
        src={photoUrl}
        alt={displayName}
        sx={{
          width: "100%",
          height: "100%",
          border: "3px solid white",
          boxShadow: 3,
          bgcolor: "secondary.main",
          fontWeight: "bold",
          fontSize: "0.9rem",
        }}
      >
        {!photoUrl && initials}
      </Avatar>
    </SliderThumb>
  );
};

// 2. Goal Avatar Marker for the "All" view timeline
const GoalMarkerAvatar = ({ goal, theme }) => {
  const isAchieved = goal.isAchieved;
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
          transform: "translate(-50%, -80px)",
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
            border: `3px solid ${borderColor}`,
            bgcolor: bgColor,
            boxShadow: 2,
          }}
        >
          <EmojiEventsIcon sx={{ color: isAchieved ? "#fbc02d" : "#bdbdbd" }} />
        </Avatar>
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
        <Box sx={{ width: 2, height: 10, bgcolor: borderColor, mt: -0.5 }} />
      </Box>
    </Tooltip>
  );
};

// --- MAIN COMPONENT ---
const ProfileGoalsSection = ({
  loading,
  goals,
  currentPoints,
  studentPhotoUrl,
  studentDisplayName,
}) => {
  const theme = useTheme();
  const [selectedGoalId, setSelectedGoalId] = useState("all");

  // Define vibrant gradients for the progress bars
  const activeGradient = "linear-gradient(to right, #2196F3, #9C27B0)"; // Blue to Purple
  const successGradient = "linear-gradient(to right, #00b09b, #96c93d)"; // Green to Lime

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

  // --- CALCULATIONS FOR "ALL" VIEW ---
  const maxTargetFound = Math.max(...goals.map((g) => g.targetPoints), 0);
  const masterMin = -500;
  const masterMax = maxTargetFound > 500 ? maxTargetFound : 500;

  const getPositionPercentage = (value) => {
    const totalRange = masterMax - masterMin;
    const position = value - masterMin;
    return (position / totalRange) * 100;
  };

  const selectedGoalData =
    selectedGoalId === "all"
      ? null
      : goals.find((g) => g.id === selectedGoalId);

  const sliderThumbStyling = {
    height: 40,
    width: 40,
    backgroundColor: "transparent",
    border: "none",
    boxShadow: "none",
    "&:before": { display: "none" },
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
            pb: 12,
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
            {/* 1. Student Position Slider */}
            <Tooltip title={`Your Current Position: ${currentPoints} Points`}>
              <Slider
                value={Math.max(masterMin, Math.min(masterMax, currentPoints))}
                min={masterMin}
                max={masterMax}
                disabled
                components={{ Thumb: StudentPositionAvatarThumb }}
                componentsProps={{
                  thumb: {
                    photoUrl: studentPhotoUrl,
                    displayName: studentDisplayName,
                  },
                }}
                sx={{
                  height: 12,
                  // Removed solid color to allow gradient
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
                    // UPDATED: Use vibrant gradient
                    background: activeGradient,
                  },
                  "& .MuiSlider-thumb": sliderThumbStyling,
                  "& .MuiSlider-valueLabel": { display: "none" },
                }}
              />
            </Tooltip>

            {/* Labels below the slider */}
            <Typography
              variant="caption"
              display="flex"
              justifyContent="space-between"
              fontWeight="bold"
              color="text.secondary"
              sx={{ mt: 3 }}
            >
              <span>Start ({masterMin})</span>
              <span>Highest Target ({masterMax})</span>
            </Typography>

            {/* 2. Overlay Goal Avatar Markers (Above the line) */}
            {goals.map((goal) => (
              <Box
                key={goal.id}
                sx={{
                  position: "absolute",
                  top: 6,
                  left: `${getPositionPercentage(goal.targetPoints)}%`,
                }}
              >
                <GoalMarkerAvatar goal={goal} theme={theme} />
              </Box>
            ))}

            {/* Zero Marker */}
            <Box
              sx={{
                position: "absolute",
                top: 20,
                left: `${getPositionPercentage(0)}%`,
                transform: "translateX(-50%)",
                borderLeft: "2px dashed #ccc",
                height: 20,
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
            overflow: "visible",
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
          <Box sx={{ px: 2, mt: 4, position: "relative" }}>
            {(() => {
              const target = selectedGoalData.targetPoints;
              const minVal = -500;
              const maxVal = target > 0 ? target : 100;

              const getSinglePercentage = (value) => {
                const totalRange = maxVal - minVal;
                const position = value - minVal;
                return (position / totalRange) * 100;
              };

              const clampedCurrentVal = Math.max(
                minVal,
                Math.min(maxVal, currentPoints)
              );
              const isAchieved = selectedGoalData.isAchieved;

              // Determine which gradient to use based on achievement status
              const currentGradient = isAchieved
                ? successGradient
                : activeGradient;

              return (
                <>
                  {/* Zero Marker for Single View */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 25,
                      left: `${getSinglePercentage(0)}%`,
                      transform: "translateX(-50%)",
                      borderLeft: "2px dashed #ccc",
                      height: 20,
                      zIndex: 1,
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
                        // Removed solid color
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
                          // UPDATED: Use dynamic gradient background
                          background: currentGradient,
                        },
                        "& .MuiSlider-thumb": sliderThumbStyling,
                        zIndex: 2,
                      }}
                    />
                  </Tooltip>

                  {/* --- UPDATED: LABELS MOVED BELOW SLIDER --- */}
                  <Typography
                    variant="caption"
                    display="flex"
                    justifyContent="space-between"
                    fontWeight="bold"
                    color="text.secondary"
                    // Added margin top for spacing below the slider
                    sx={{ mb: 1, mt: 2 }}
                  >
                    <span>Start ({minVal})</span>
                    <span>Target ({maxVal})</span>
                  </Typography>
                  {/* ---------------------------------------- */}

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
