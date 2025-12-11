import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  TextField,
  Button,
  Alert,
  Avatar,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
// --- 1. NEW IMPORT: Lightbulb Icon ---
import LightbulbCircleIcon from "@mui/icons-material/LightbulbCircle";
// ------------------------------------
import PostCard from "../pages/student/components/PostCard";

// --- 2. NEW: List of encouraging prompts ---
const encouragingPrompts = [
  "What's a cool fact you learned this week?",
  "Stuck on something? Ask your classmates for a hint!",
  "Have a project idea? Pitch it here.",
  "Found a great video or article? Share the link!",
  "What's the most interesting question you have right now?",
  "Share a 'lightbulb moment' you had recently.",
  "Don't worry about being perfect. Just share your thought!",
];
// -------------------------------------------

const ClassForumFeed = ({ targetTeacherId }) => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loadingCtx, setLoadingCtx] = useState(true);

  const [newPostContent, setNewPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  // --- 3. NEW STATE for placeholder ---
  const [activePlaceholder, setActivePlaceholder] = useState(
    "What's on your mind?"
  );
  // ------------------------------------

  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // --- 4. NEW EFFECT: Pick random prompt on load ---
  useEffect(() => {
    // Pick a random prompt from the list
    const randomIndex = Math.floor(Math.random() * encouragingPrompts.length);
    setActivePlaceholder(encouragingPrompts[randomIndex]);
  }, []);
  // --------------------------------------------------

  // 1. Fetch current user's details
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser?.uid) return;
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserData(userDocSnap.data());
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoadingCtx(false);
      }
    };
    fetchUserData();
  }, [currentUser]);

  // 2. Real-time Post Listener
  useEffect(() => {
    if (!targetTeacherId) return;
    setLoadingPosts(true);

    const postsRef = collection(db, "posts");
    const q = query(
      postsRef,
      where("teacherId", "==", targetTeacherId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedPosts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(fetchedPosts);
        setLoadingPosts(false);
      },
      (err) => {
        console.error("Error fetching posts:", err);
        setError(
          "Failed to load feed. You might not have permission or the forum doesn't exist."
        );
        setLoadingPosts(false);
      }
    );

    return () => unsubscribe();
  }, [targetTeacherId]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !targetTeacherId || !currentUser) return;

    setPosting(true);
    setError("");
    try {
      await addDoc(collection(db, "posts"), {
        content: newPostContent.trim(),
        teacherId: targetTeacherId,
        authorId: currentUser.uid,
        authorName:
          userData?.displayName || currentUser.email.split("@")[0] || "User",
        authorPhotoUrl: userData?.photoUrl || currentUser.photoURL || null,
        createdAt: serverTimestamp(),
        likeCount: 0,
        commentCount: 0,
        authorRole: userData?.role || "student",
        isHidden: false,
      });
      setNewPostContent("");
      // Optionally pick a new prompt after posting
      const randomIndex = Math.floor(Math.random() * encouragingPrompts.length);
      setActivePlaceholder(encouragingPrompts[randomIndex]);
    } catch (err) {
      console.error("Error creating post:", err);
      setError("Failed to post message.");
    } finally {
      setPosting(false);
    }
  };

  if (loadingCtx && !userData)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );
  if (!targetTeacherId)
    return (
      <Typography sx={{ p: 5, color: "error.main" }}>
        Error: No forum ID provided.
      </Typography>
    );

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper
        elevation={3}
        sx={{ p: 3, mb: 4, borderRadius: 2, bgcolor: "#fff" }}
      >
        {/* --- UPDATED HEADER SECTION --- */}
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              color: "primary.main",
            }}
          >
            <LightbulbCircleIcon sx={{ mr: 1, color: "#fdd835" }} />{" "}
            {/* Yellowish lightbulb */}
            Motivate your friends!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Questions, cool facts, and half-baked ideas are all welcome here!
          </Typography>
        </Box>
        {/* ------------------------------- */}

        <Box sx={{ display: "flex", mb: 2 }}>
          <Avatar
            src={userData?.photoUrl || currentUser?.photoURL}
            sx={{ mr: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={3} // Increased rows slightly
            variant="outlined"
            // --- UPDATED PLACEHOLDER ---
            placeholder={activePlaceholder}
            // ---------------------------
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            disabled={posting}
            sx={{
              bgcolor: "#fafafa",
              "& .MuiOutlinedInput-root": {
                "&.Mui-focused fieldset": {
                  borderColor: "primary.main", // Highlight on focus
                },
              },
            }}
          />
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            endIcon={
              posting ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SendIcon />
              )
            }
            onClick={handleCreatePost}
            disabled={!newPostContent.trim() || posting}
            sx={{
              borderRadius: 5,
              textTransform: "none",
              fontWeight: "bold",
              px: 3,
            }}
          >
            {posting ? "Posting..." : "Post Idea"}
          </Button>
        </Box>
      </Paper>

      <Typography
        variant="h6"
        sx={{ mb: 2, fontWeight: "bold", color: "text.secondary" }}
      >
        Recent Class Activity
      </Typography>

      {loadingPosts ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress />
        </Box>
      ) : posts.length === 0 ? (
        <Paper
          sx={{
            p: 5,
            textAlign: "center",
            bgcolor: "#f0f2f5",
            borderRadius: 2,
            borderStyle: "dashed",
            borderColor: "divider",
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            It's quiet in here...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Be the first to spark a conversation!
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {posts
            // --- NEW FILTERING LOGIC ---
            .filter((post) => {
              // If viewer is a teacher, show everything.
              // If student, only show if NOT hidden.
              if (userData?.role === "teacher") return true;
              return !post.isHidden;
            })
            .map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserUserId={currentUser.uid}
                studentData={userData}
                viewerRole={userData?.role}
              />
            ))}
        </Box>
      )}
    </Box>
  );
};

export default ClassForumFeed;
