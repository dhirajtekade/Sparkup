import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import {
  Box,
  Typography,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import ForumIcon from "@mui/icons-material/Forum";
// Import the shared feed component
import ClassForumFeed from "../../components/ClassForumFeed";

const StudentForumPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [myTeacherId, setMyTeacherId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!currentUser?.uid) return;
      setLoading(true);
      try {
        const studentDocRef = doc(db, "users", currentUser.uid);
        const studentDocSnap = await getDoc(studentDocRef);

        if (studentDocSnap.exists()) {
          const data = studentDocSnap.data();
          if (data.createdByTeacherId) {
            setMyTeacherId(data.createdByTeacherId);
          } else {
            setError("Your profile is missing a Teacher ID.");
          }
        } else {
          setError("Student profile not found.");
        }
      } catch (err) {
        console.error("Error fetching student data:", err);
        setError("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, [currentUser]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Check for error OR missing ID
  if (error || !myTeacherId) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          {error ||
            "Error: Could not determine your class forum. Please contact support."}
        </Alert>
      </Box>
    );
  }

  return (
    <Box maxWidth="md" sx={{ mx: "auto", pb: 4 }}>
      <Typography
        variant="h4"
        gutterBottom
        fontWeight="bold"
        sx={{ display: "flex", alignItems: "center", color: "primary.main" }}
      >
        <ForumIcon sx={{ mr: 2, fontSize: 40 }} /> Class Forum
      </Typography>
      <Divider sx={{ mb: 4 }} />

      {/* Here is the fix:
         We pass the ID we just found to the Feed component.
      */}
      {console.log("==> Loading forum for teacher ID:", myTeacherId)}
      <ClassForumFeed targetTeacherId={myTeacherId} />
    </Box>
  );
};

export default StudentForumPage;
