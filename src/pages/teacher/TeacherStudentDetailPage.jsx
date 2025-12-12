import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore";
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Avatar,
  CircularProgress,
  Alert,
  Card,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import StarsIcon from "@mui/icons-material/Stars";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
// NEW: Import Leaflet components directly here for a single marker map
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

dayjs.extend(relativeTime);

// Note: Leaflet CSS/icon fixes are assumed to be in main.jsx/index.html

const TeacherStudentDetailPage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [studentProfile, setStudentProfile] = useState(null);
  const [completionHistory, setCompletionHistory] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) return;
      setLoading(true);
      setError("");

      try {
        // 1. Define references
        const studentDocRef = doc(db, "users", studentId);
        const completionsRef = collection(
          db,
          "users",
          studentId,
          "completions"
        );
        // Query for history: newest first
        const historyQuery = query(
          completionsRef,
          orderBy("completedAt", "desc")
        );

        // 2. Run fetches in parallel
        const [studentSnap, historySnap] = await Promise.all([
          getDoc(studentDocRef),
          getDocs(historyQuery),
        ]);

        // 3. Process Student Profile
        if (!studentSnap.exists()) {
          throw new Error("Student profile not found in database.");
        }
        // The profile now contains the 'latestLocation' field if it exists
        setStudentProfile({ id: studentSnap.id, ...studentSnap.data() });

        // 4. Process History
        const historyList = historySnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCompletionHistory(historyList);
      } catch (err) {
        console.error("Error fetching student details:", err);
        setError(err.message || "Failed to load student data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          sx={{ mt: 2 }}
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/teacher/students")}
        >
          Back
        </Button>
      </Box>
    );
  }

  // Check if the student profile has location data
  const hasLocationData =
    studentProfile?.latestLocation?.lat && studentProfile?.latestLocation?.lng;
  const mapCenter = hasLocationData
    ? [studentProfile.latestLocation.lat, studentProfile.latestLocation.lng]
    : [0, 0];

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      {/* Header Navigation */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/teacher/students")}
        sx={{ mb: 2 }}
      >
        Back to Student List
      </Button>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* LEFT COLUMN: Student Profile Summary */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={3}
            sx={{ borderRadius: 2, textAlign: "center", p: 2 }}
          >
            <Avatar
              src={studentProfile.photoUrl}
              sx={{
                width: 100,
                height: 100,
                mx: "auto",
                mb: 2,
                bgcolor: "primary.main",
              }}
            >
              {studentProfile.displayName?.charAt(0) || <PersonIcon />}
            </Avatar>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              {studentProfile.displayName || studentProfile.email.split("@")[0]}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {studentProfile.email}
            </Typography>
            {hasLocationData && (
              <Chip
                icon={<LocationOnIcon fontSize="small" />}
                label="Location Enabled"
                size="small"
                color="success"
                variant="outlined"
                sx={{ mt: 1 }}
              />
            )}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "flex", justifyContent: "space-around" }}>
              <Box>
                <Typography variant="h6" color="primary.main" fontWeight="bold">
                  {studentProfile.totalPoints || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Points
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  color="secondary.main"
                  fontWeight="bold"
                >
                  {completionHistory.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Tasks Completed
                </Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* RIGHT COLUMN: Map & History */}
        <Grid item xs={12} md={8}>
          {/* --- NEW SINGLE LOCATION MAP SECTION --- */}
          <Paper
            elevation={3}
            sx={{
              height: 400,
              width: "100%",
              mb: 3,
              borderRadius: 2,
              overflow: "hidden",
              position: "relative",
              zIndex: 0,
              bgcolor: "#e3f2fd",
            }}
          >
            {hasLocationData ? (
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={mapCenter}>
                  <Popup>
                    <Typography variant="subtitle2" fontWeight="bold">
                      Last Known Location
                    </Typography>
                    <Typography variant="caption">
                      Updated{" "}
                      {studentProfile.latestLocation.updatedAt
                        ? dayjs(
                            studentProfile.latestLocation.updatedAt.toDate()
                          ).fromNow()
                        : "recently"}
                    </Typography>
                  </Popup>
                </Marker>
              </MapContainer>
            ) : (
              // Fallback if no location data
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  flexDirection: "column",
                  p: 2,
                }}
              >
                <LocationOnIcon
                  color="disabled"
                  sx={{ fontSize: 60, mb: 2, opacity: 0.5 }}
                />
                <Typography variant="h6" color="text.secondary">
                  Location Unknown
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This student has not reported a location yet.
                </Typography>
              </Box>
            )}
          </Paper>
          {/* --------------------------------------- */}

          {/* Recent Activity List */}
          <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, px: 2 }}>
              Recent Activity History
            </Typography>
            <Divider />
            <List sx={{ maxHeight: 400, overflow: "auto" }}>
              {completionHistory.length === 0 ? (
                <Typography sx={{ p: 2 }} color="text.secondary">
                  No activity yet.
                </Typography>
              ) : (
                completionHistory.map((item) => (
                  <ListItem key={item.id} divider>
                    <ListItemAvatar>
                      {item.recurrenceType === "streak_bonus" ? (
                        <Avatar sx={{ bgcolor: "secondary.main" }}>
                          <StarsIcon />
                        </Avatar>
                      ) : (
                        <Avatar sx={{ bgcolor: "success.main" }}>
                          <CheckCircleIcon />
                        </Avatar>
                      )}
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography fontWeight="medium">
                          {item.taskName}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          variant="caption"
                          component="span"
                          display="block"
                        >
                          {item.completedAt
                            ? dayjs(item.completedAt.toDate()).format(
                                "MMM D, YYYY h:mm A"
                              )
                            : item.dateCompleted}
                        </Typography>
                      }
                    />
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color="success.main"
                    >
                      +{item.pointsEarned} pts
                    </Typography>
                  </ListItem>
                ))
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeacherStudentDetailPage;
