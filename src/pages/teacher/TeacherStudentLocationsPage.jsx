import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Avatar,
} from "@mui/material";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonIcon from "@mui/icons-material/Person";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

// Note: Leaflet CSS/icon fixes are assumed to be in main.jsx/index.html

const TeacherStudentLocationsPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentsWithLocation, setStudentsWithLocation] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStudentLocations = async () => {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        // 1. Query all students belonging to this teacher
        const usersRef = collection(db, "users");
        const q = query(
          usersRef,
          where("role", "==", "student"),
          where("createdByTeacherId", "==", currentUser.uid)
        );
        const querySnapshot = await getDocs(q);

        // 2. Filter results in memory to keep only those with valid latestLocation
        const locatedStudents = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (
            data.latestLocation &&
            data.latestLocation.lat &&
            data.latestLocation.lng
          ) {
            locatedStudents.push({
              id: doc.id,
              ...data,
            });
          }
        });

        setStudentsWithLocation(locatedStudents);
      } catch (err) {
        console.error("Error fetching student locations:", err);
        setError("Failed to load student locations.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentLocations();
  }, [currentUser]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Default center of India approximately
  const defaultCenter = [20.5937, 78.9629];
  const defaultZoom = 5; // Zoomed out view of India

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <Typography
        variant="h4"
        gutterBottom
        fontWeight="bold"
        sx={{ display: "flex", alignItems: "center", color: "primary.main" }}
      >
        <LocationOnIcon sx={{ mr: 2, fontSize: 40 }} /> Student Locations
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Map showing the last known location of your students who have enabled
        location access.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={3}
        sx={{
          height: 600,
          width: "100%",
          borderRadius: 2,
          overflow: "hidden",
          position: "relative",
          zIndex: 0,
        }}
      >
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {studentsWithLocation.map((student) => (
            <Marker
              key={student.id}
              position={[
                student.latestLocation.lat,
                student.latestLocation.lng,
              ]}
            >
              <Popup>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    p: 1,
                    minWidth: 150,
                  }}
                >
                  <Avatar
                    src={student.photoUrl}
                    sx={{ width: 40, height: 40, mr: 2 }}
                  >
                    {student.displayName?.charAt(0) || <PersonIcon />}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {student.displayName || student.email.split("@")[0]}
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      color="text.secondary"
                    >
                      Last seen:{" "}
                      {student.latestLocation.updatedAt
                        ? dayjs(
                            student.latestLocation.updatedAt.toDate()
                          ).fromNow()
                        : "Unknown"}
                    </Typography>
                  </Box>
                </Box>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {studentsWithLocation.length > 0 && (
          <Typography
            variant="caption"
            sx={{
              position: "absolute",
              bottom: 5,
              left: 5,
              bgcolor: "rgba(255,255,255,0.8)",
              px: 1,
              py: 0.5,
              borderRadius: 1,
              zIndex: 1000,
              pointerEvents: "none",
              fontWeight: "bold",
            }}
          >
            Showing {studentsWithLocation.length} students
          </Typography>
        )}

        {studentsWithLocation.length === 0 && !loading && (
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              bgcolor: "rgba(255,255,255,0.9)",
              p: 4,
              borderRadius: 2,
              textAlign: "center",
              zIndex: 1000,
            }}
          >
            <LocationOnIcon
              color="disabled"
              sx={{ fontSize: 50, mb: 1, opacity: 0.5 }}
            />
            <Typography variant="h6" color="text.secondary">
              No Locations Found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              None of your students have reported a location yet.
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default TeacherStudentLocationsPage;
