import { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
} from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Divider,
  Avatar,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
// 1. Import our custom renderer for the main profile badge
import BadgeToken from "../../utils/badgeTokenRenderer";

const StudentProfilePage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [currentBadge, setCurrentBadge] = useState(null);
  const [nextBadge, setNextBadge] = useState(null);
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        // A. Fetch Student Data
        const studentDocRef = doc(db, "users", currentUser.uid);
        const studentDocSnap = await getDoc(studentDocRef);
        if (!studentDocSnap.exists())
          throw new Error("Student profile not found");
        const sData = studentDocSnap.data();
        setStudentData(sData);
        const currentPoints = sData.totalPoints || 0;
        const teacherId = sData.createdByTeacherId;

        // B. Fetch & Determine Current Badge based on points
        const badgesRef = collection(db, "badges");
        const qBadges = query(
          badgesRef,
          where("createdByTeacherId", "==", teacherId),
          // Ensure badges have minPoints field before sorting
          orderBy("minPoints", "asc")
        );

        // Note: If you get an index error here, click the link in console
        const badgeSnapshot = await getDocs(qBadges);
        const allBadges = [];
        badgeSnapshot.forEach((doc) =>
          allBadges.push({ id: doc.id, ...doc.data() })
        );

        let foundBadge = null;
        let foundNextBadge = null;

        // Logic to find where current points fall in badge ranges
        for (let i = 0; i < allBadges.length; i++) {
          const badge = allBadges[i];
          // Check if points are within this badge's range
          if (
            currentPoints >= badge.minPoints &&
            currentPoints <= badge.maxPoints
          ) {
            foundBadge = badge;
            // The next badge in the sorted list is the target
            if (i + 1 < allBadges.length) {
              foundNextBadge = allBadges[i + 1];
            }
            break;
          }
        }
        setCurrentBadge(foundBadge);
        setNextBadge(foundNextBadge);

        // C. Fetch Goals
        const goalsRef = collection(db, "goals");
        const qGoals = query(
          goalsRef,
          where("createdByTeacherId", "==", teacherId),
          orderBy("targetPoints", "asc")
        );
        // Note: If you get an index error here, click the link in console
        const goalSnapshot = await getDocs(qGoals);
        const goalList = [];
        goalSnapshot.forEach((doc) => {
          const gData = doc.data();
          const isAchieved = currentPoints >= gData.targetPoints;
          let progress = 0;
          if (!isAchieved && gData.targetPoints > 0) {
            progress = (currentPoints / gData.targetPoints) * 100;
          }

          goalList.push({
            id: doc.id,
            ...gData,
            isAchieved,
            progress: Math.min(progress, 100),
          });
        });
        setGoals(goalList);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!studentData) return <Typography>Profile not found.</Typography>;

  const currentPoints = studentData.totalPoints || 0;

  // Calculate progress bar width for next badge
  let badgeProgress = 0;
  if (currentBadge && nextBadge) {
    const pointsInTier = currentPoints - currentBadge.minPoints;
    const totalTierRange = nextBadge.minPoints - currentBadge.minPoints;
    badgeProgress = (pointsInTier / totalTierRange) * 100;
  } else if (!currentBadge && nextBadge) {
    // Hasn't reached first badge yet (e.g. negative points)
    // Prevent divide by zero if minPoints is 0
    const range = nextBadge.minPoints - (currentPoints < 0 ? currentPoints : 0);
    badgeProgress = (currentPoints / range) * 100;
    if (badgeProgress < 0) badgeProgress = 0;
  }

  return (
    <Box maxWidth="lg" sx={{ mx: "auto" }}>
      {/* --- TOP SECTION: OVERVIEW CARD --- */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 4,
          background: "linear-gradient(135deg, #e8f5e9 30%, #c8e6c9 90%)",
        }}
      >
        <Grid container spacing={4} alignItems="center">
          {/* Left: Current Badge Token & Points */}
          <Grid
            item
            xs={12}
            md={4}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <Box sx={{ position: "relative", display: "inline-flex", mb: 2 }}>
              {/* 2. Use the metallic token renderer */}
              <BadgeToken
                name={currentBadge?.name || "None"}
                minPoints={currentBadge?.minPoints || 0}
                maxPoints={currentBadge?.maxPoints || 0}
                size={140}
              />
            </Box>
            <Typography variant="h4" fontWeight="bold" color="success.dark">
              {currentPoints.toLocaleString()} Points
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Current Rank: <b>{currentBadge?.name || "Not Ranked"}</b>
            </Typography>
          </Grid>

          {/* Right: Progress Bar to Next Badge */}
          <Grid item xs={12} md={8}>
            <Box
              sx={{ p: 3, bgcolor: "rgba(255,255,255,0.6)", borderRadius: 3 }}
            >
              <Typography variant="h6" gutterBottom>
                Next Rank Goal: <b>{nextBadge?.name || "Max Rank Reached!"}</b>
              </Typography>

              {nextBadge ? (
                <>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Box sx={{ width: "100%", mr: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(badgeProgress, 100)}
                        sx={{
                          height: 15,
                          borderRadius: 5,
                          bgcolor: "#a5d6a7",
                          "& .MuiLinearProgress-bar": {
                            bgcolor: "success.main",
                          },
                        }}
                      />
                    </Box>
                    <Box sx={{ minWidth: 35 }}>
                      <Typography variant="body2" color="text.secondary">
                        {Math.round(badgeProgress)}%
                      </Typography>
                    </Box>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="right"
                  >
                    {nextBadge.minPoints - currentPoints} more points needed
                  </Typography>
                </>
              ) : (
                <Typography variant="body1" color="success.main">
                  Congratulations! You have reached the highest available rank.
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* --- BOTTOM SECTION: GOALS LIST --- */}
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
          goals.map((goal) => (
            <Grid item xs={12} sm={6} md={4} key={goal.id}>
              <Card
                elevation={goal.isAchieved ? 4 : 1}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  opacity: goal.isAchieved ? 1 : 0.9,
                  filter: goal.isAchieved ? "none" : "grayscale(30%)",
                }}
              >
                {goal.isAchieved && (
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

                {/* 3. CORRECTED Goal Image display (using basic Avatar/Icon for now) */}
                <Box
                  sx={{
                    height: 140,
                    bgcolor: goal.isAchieved ? "#fffde7" : "#f5f5f5",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {goal.imageUrl ? (
                    <Avatar
                      src={goal.imageUrl}
                      sx={{ width: 80, height: 80 }}
                      variant="rounded"
                    />
                  ) : (
                    <EmojiEventsIcon
                      sx={{
                        fontSize: 80,
                        color: goal.isAchieved ? "#fbc02d" : "#bdbdbd",
                      }}
                    />
                  )}
                </Box>

                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="div">
                    {goal.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2, minHeight: 40 }}
                  >
                    {goal.description}
                  </Typography>

                  <Box sx={{ mt: "auto" }}>
                    <Typography
                      variant="caption"
                      display="block"
                      gutterBottom
                      fontWeight="bold"
                    >
                      Target: {goal.targetPoints} Points
                    </Typography>
                    {goal.isAchieved ? (
                      <LinearProgress
                        variant="determinate"
                        value={100}
                        color="success"
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    ) : (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Box sx={{ width: "100%", mr: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={goal.progress}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {Math.round(goal.progress)}%
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
};

export default StudentProfilePage;
