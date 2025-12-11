import { useState, useEffect } from "react";
import { db } from "../../../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  increment,
  writeBatch,
} from "firebase/firestore";
import {
  Box,
  TextField,
  Button,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  CircularProgress,
  IconButton,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const CommentSection = ({ postId, currentUserUserId, studentData }) => {
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newCommentText, setNewCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 1. Real-time listener for comments on this post
  useEffect(() => {
    const commentsRef = collection(db, "posts", postId, "comments");
    // Order by oldest first so conversation reads down
    const q = query(commentsRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedComments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setComments(fetchedComments);
        setLoadingComments(false);
      },
      (error) => {
        console.error("Error fetching comments:", error);
        setLoadingComments(false);
      }
    );

    return () => unsubscribe();
  }, [postId]);

  // 2. Handle adding a new comment
  const handleAddComment = async () => {
    if (!newCommentText.trim()) return;
    setSubmitting(true);

    try {
      const batch = writeBatch(db);

      // Ref for new comment doc (auto-ID)
      const newCommentRef = doc(collection(db, "posts", postId, "comments"));

      // Ref for parent post to update count
      const postRef = doc(db, "posts", postId);

      // 1. Set data for new comment
      batch.set(newCommentRef, {
        content: newCommentText.trim(),
        authorId: currentUserUserId,
        authorName: studentData?.displayName || "Student",
        authorPhotoUrl: studentData?.photoUrl || null,
        createdAt: serverTimestamp(),
      });

      // 2. Increment comment count on parent post
      batch.update(postRef, { commentCount: increment(1) });

      await batch.commit();
      setNewCommentText(""); // Clear input on success
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ bgcolor: "#fafafa", p: 2, borderTop: "1px solid #eee" }}>
      {/* Comment Input */}
      <Box sx={{ display: "flex", alignItems: "flex-start", mb: 3 }}>
        <Avatar
          src={studentData?.photoUrl}
          sx={{ mr: 2, width: 32, height: 32 }}
        />
        <TextField
          fullWidth
          multiline
          variant="outlined"
          size="small"
          placeholder="Write a comment..."
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          disabled={submitting}
          sx={{ bgcolor: "white" }}
        />
        <Button
          variant="contained"
          sx={{ ml: 1, minWidth: 50, height: 40 }}
          onClick={handleAddComment}
          disabled={!newCommentText.trim() || submitting}
        >
          {submitting ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <SendIcon fontSize="small" />
          )}
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Comments List */}
      {loadingComments ? (
        <Typography variant="caption">Loading comments...</Typography>
      ) : comments.length === 0 ? (
        <Typography variant="caption" color="text.secondary">
          No comments yet.
        </Typography>
      ) : (
        <List dense sx={{ p: 0 }}>
          {comments.map((comment, index) => (
            <ListItem
              key={comment.id}
              alignItems="flex-start"
              sx={{ px: 0, py: 1 }}
            >
              <ListItemAvatar>
                <Avatar
                  alt={comment.authorName}
                  src={comment.authorPhotoUrl}
                  sx={{ width: 32, height: 32 }}
                >
                  {comment.authorName?.charAt(0)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      fontWeight="bold"
                      component="span"
                    >
                      {comment.authorName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {comment.createdAt
                        ? dayjs(comment.createdAt.toDate()).fromNow()
                        : "Just now"}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.primary"
                    sx={{ whiteSpace: "pre-wrap", display: "block", mt: 0.5 }}
                  >
                    {comment.content}
                  </Typography>
                }
              />
              {/* Optional: Add delete button if current user is author */}
              {comment.authorId === currentUserUserId && (
                <IconButton
                  size="small"
                  sx={{ mt: 1 }}
                  onClick={() =>
                    alert("Delete functionality not implemented in this phase.")
                  }
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              )}
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default CommentSection;
