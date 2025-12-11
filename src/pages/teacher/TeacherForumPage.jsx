import { useAuth } from "../../contexts/AuthContext";
import {
  Box,
  Typography,
  Divider,
  Paper,
  CircularProgress,
} from "@mui/material";
import ForumIcon from "@mui/icons-material/Forum";
import ClassForumFeed from "../../components/ClassForumFeed";

const TeacherForumPage = () => {
  const { currentUser } = useAuth();

  // 1. Safety Check: Ensure currentUser exists
  if (!currentUser) {
    return (
      <Box sx={{ p: 5, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  // 2. Safety Check: Ensure UID is available
  const teacherId = currentUser.uid;
  if (!teacherId) {
    return (
      <Typography sx={{ p: 5, color: "error.main" }}>
        Error: User ID missing.
      </Typography>
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

      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 4,
          bgcolor: "primary.light",
          color: "primary.contrastText",
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold">
          Teacher View
        </Typography>
        <Typography variant="body2">
          This is the forum for your class. You can view student posts, announce
          updates, and moderate discussions.
        </Typography>
      </Paper>

      {/* CRITICAL: We pass the 'teacherId' to the 'targetTeacherId' prop.
          This tells the feed to load posts where teacherId == current user's ID.
      */}
      <ClassForumFeed targetTeacherId={teacherId} />
    </Box>
  );
};

export default TeacherForumPage;
