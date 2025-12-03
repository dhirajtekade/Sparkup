import {
  Box,
  Typography,
  Grid,
  Skeleton,
  Card,
  CardContent,
  Chip,
  Divider,
  Avatar,
  Slider,
  Tooltip,
  useTheme,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import FlagIcon from "@mui/icons-material/Flag";
import AdjustIcon from "@mui/icons-material/Adjust";
// Helper component required for customizing MUI Slider Thumb
import { SliderThumb } from "@mui/material/Slider";

// Custom renderer for the slider thumb (the student's position circle)
const StudentPositionThumb = (props) => {
  const { children, ...other } = props;
  return (
    <SliderThumb {...other}>
      {children}
      <AdjustIcon sx={{ color: "white", fontSize: 20 }} />
    </SliderThumb>
  );
};

const ProfileGoalsList = ({ loading, goals, currentPoints }) => {
  const theme = useTheme();

  if (loading) {
    return (
      <>
        <Skeleton variant="text" width="30%" height={40} sx={{ mb: 2 }} />
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          {[1, 2, 3].map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item}>
              <Card sx={{ height: 300, borderRadius: 2 }}>
                <Skeleton variant="rectangular" height={140} />
                <CardContent>
                  <Skeleton variant="text" height={30} width="80%" />
                  <Skeleton variant="text" height={20} width="100%" />
                  <Skeleton
                    variant="text"
                    height={20}
                    width="90%"
                    sx={{ mb: 2 }}
                  />
                  <Skeleton
                    variant="rectangular"
                    height={10}
                    borderRadius={4}
                    sx={{ mt: 3 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </>
    );
  }

  return (
    <>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ mt: 4, mb: 2, display: "flex", alignItems: "center" }}
      >
        <EmojiEventsIcon sx={{ mr: 1, color: "#fbc02d" }} /> My Journey Goals
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        {goals.length === 0 ? (
          <Typography sx={{ p: 3 }} color="text.secondary">
            No goals have been set by your teacher yet.
          </Typography>
        ) : (
          goals.map((goal) => {
            // --- NEW LOGIC ---
            const target = goal.targetPoints;
            // Safety check: Ensure we have a valid positive range boundary.
            // If target is 0 or negative due to bad data, default range to +/- 100.
            const rangeBoundary = target > 0 ? target : 100;

            // Set min as the negative equivalent of the target
            const minVal = -rangeBoundary;
            const maxVal = rangeBoundary;

            // Clamp current points so the slider thumb stays visually within bounds
            // even if their score is way higher than target or lower than min.
            const clampedCurrentVal = Math.max(
              minVal,
              Math.min(maxVal, currentPoints)
            );
            // -----------------

            const isAchieved = goal.isAchieved;

            return (
              <Grid item xs={12} sm={6} md={4} key={goal.id}>
                <Card
                  elevation={isAchieved ? 4 : 2}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    border: isAchieved
                      ? `2px solid ${theme.palette.success.main}`
                      : "none",
                  }}
                >
                  {isAchieved && (
                    <Chip
                      label="Achieved!"
                      color="success"
                      sx={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        fontWeight: "bold",
                        zIndex: 2,
                      }}
                    />
                  )}

                  <Box
                    sx={{
                      height: 120,
                      bgcolor: isAchieved ? "#fffde7" : "#f5f5f5",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    {goal.imageUrl ? (
                      <Avatar
                        src={goal.imageUrl}
                        sx={{ width: 70, height: 70 }}
                        variant="rounded"
                      />
                    ) : (
                      <EmojiEventsIcon
                        sx={{
                          fontSize: 70,
                          color: isAchieved ? "#fbc02d" : "#bdbdbd",
                        }}
                      />
                    )}
                  </Box>

                  <CardContent
                    sx={{
                      flexGrow: 1,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Typography gutterBottom variant="h6" component="div">
                      {goal.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 3, flexGrow: 1 }}
                    >
                      {goal.description}
                    </Typography>

                    {/* --- JOURNEY LINE VISUALIZATION --- */}
                    <Box sx={{ mt: "auto", px: 1 }}>
                      <Typography
                        variant="caption"
                        display="flex"
                        justifyContent="space-between"
                        gutterBottom
                        fontWeight="bold"
                        color="text.secondary"
                      >
                        <span>Start ({minVal})</span>
                        <span>Target ({maxVal})</span>
                      </Typography>

                      <Tooltip
                        title={`Current Position: ${currentPoints} Points`}
                      >
                        {/* We use a disabled Slider to visualize the range line */}
                        <Slider
                          value={clampedCurrentVal}
                          min={minVal}
                          max={maxVal}
                          disabled // Makes it read-only
                          components={{ Thumb: StudentPositionThumb }}
                          sx={{
                            height: 8,
                            // Color the active track based on achievement status
                            color: isAchieved
                              ? theme.palette.success.main
                              : theme.palette.primary.main,
                            "& .MuiSlider-rail": {
                              opacity: 0.5,
                              backgroundColor: "#bdbdbd", // Grey background track
                            },
                            "& .MuiSlider-track": {
                              border: "none",
                            },
                            // Style the thumb (the circle indicator)
                            "& .MuiSlider-thumb": {
                              height: 24,
                              width: 24,
                              backgroundColor: isAchieved
                                ? theme.palette.success.main
                                : theme.palette.primary.main,
                              border: "3px solid white",
                              boxShadow: 2,
                              "&.Mui-disabled": {
                                height: 24,
                                width: 24,
                                backgroundColor: isAchieved
                                  ? theme.palette.success.main
                                  : theme.palette.primary.main,
                                border: "3px solid white",
                                boxShadow: 2,
                              },
                            },
                            // Hide the default value label popup on hover
                            "& .MuiSlider-valueLabel": { display: "none" },
                          }}
                        />
                      </Tooltip>

                      {/* Labels below the line */}
                      <Box sx={{ position: "relative", height: 20, mt: 0.5 }}>
                        {/* Target Flag */}
                        <Box
                          sx={{
                            position: "absolute",
                            right: -10,
                            top: 0,
                            color: isAchieved
                              ? theme.palette.success.dark
                              : "text.secondary",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}
                        >
                          <FlagIcon fontSize="small" />
                        </Box>
                      </Box>
                    </Box>
                    {/* --------------------------------------- */}
                  </CardContent>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>
    </>
  );
};

export default ProfileGoalsList;
