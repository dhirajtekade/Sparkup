import { useState, useEffect } from "react";
import { db } from "../../../firebase";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import {
  // Added Collapse to imports
  Typography,
  Avatar,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  IconButton,
  Box,
  Collapse,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
// Import the new CommentSection
import CommentSection from "./CommentSection";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";

dayjs.extend(relativeTime);

// Added studentData to props
const PostCard = ({ post, currentUserUserId, studentData, viewerRole }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  // New state for toggling comment section
  const [showComments, setShowComments] = useState(false);

  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const likeDocRef = doc(db, "posts", post.id, "likes", currentUserUserId);
  const postRef = doc(db, "posts", post.id);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    const checkLikeStatus = async () => {
      try {
        const likeSnap = await getDoc(likeDocRef);
        if (likeSnap.exists()) setIsLiked(true);
      } catch (err) {
        console.error("Error checking like:", err);
      }
    };
    checkLikeStatus();
  }, [post.id, currentUserUserId]);

  const handleToggleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    const previousState = isLiked;
    setIsLiked(!isLiked);
    const batch = writeBatch(db);
    try {
      if (previousState === true) {
        batch.delete(likeDocRef);
        batch.update(postRef, { likeCount: increment(-1) });
      } else {
        batch.set(likeDocRef, { likedAt: serverTimestamp() });
        batch.update(postRef, { likeCount: increment(1) });
      }
      await batch.commit();
    } catch (err) {
      console.error("Error toggling like:", err);
      setIsLiked(previousState);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleToggleHide = async () => {
    handleMenuClose(); // Close menu first
    const postRef = doc(db, "posts", post.id);
    try {
      // Toggle the isHidden field
      await updateDoc(postRef, {
        isHidden: !post.isHidden,
      });
    } catch (err) {
      console.error("Error updating post visibility:", err);
      alert("Failed to update post status.");
    }
  };

  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 2,
        // Visual cue for hidden posts
        opacity: post.isHidden ? 0.7 : 1,
        bgcolor: post.isHidden ? "#f5f5f5" : "white",
        border: post.isHidden ? "1px dashed #ccc" : "none",
      }}
    >
      <CardHeader
        avatar={
          <Avatar src={post.authorPhotoUrl}>
            {post.authorName?.charAt(0)}
          </Avatar>
        }
        title={<Typography fontWeight="bold">{post.authorName}</Typography>}
        subheader={
          post.createdAt ? dayjs(post.createdAt.toDate()).fromNow() : "Just now"
        }
        action={
          viewerRole === "teacher" && (
            <IconButton aria-label="settings" onClick={handleMenuClick}>
              <MoreVertIcon />
            </IconButton>
          )
        }
      />
      <CardContent sx={{ py: 1 }}>
        <Typography
          variant="body1"
          sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
        >
          {post.content}
        </Typography>
      </CardContent>
      <CardActions disableSpacing sx={{ pt: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
          <IconButton onClick={handleToggleLike} disabled={likeLoading}>
            {isLiked ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
          </IconButton>
          <Typography variant="body2" fontWeight="medium">
            {post.likeCount || 0}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton onClick={() => setShowComments(!showComments)}>
            <ChatBubbleOutlineIcon
              color={showComments ? "primary" : "inherit"}
            />
          </IconButton>
          <Typography variant="body2" fontWeight="medium">
            {post.commentCount || 0}
          </Typography>
        </Box>
      </CardActions>

      {/* Collapsible Comment Section */}
      <Collapse in={showComments} timeout="auto" unmountOnExit>
        <CommentSection
          postId={post.id}
          currentUserUserId={currentUserUserId}
          studentData={studentData}
        />
      </Collapse>

      {/* --- NEW: Moderation Menu --- */}
      {/* This was missing in your file */}
      <Menu
        id="post-menu"
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
      >
        <MenuItem onClick={handleToggleHide}>
          <ListItemIcon>
            {post.isHidden ? (
              <VisibilityIcon fontSize="small" />
            ) : (
              <VisibilityOffIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>
            {post.isHidden ? "Unhide Post" : "Hide Post"}
          </ListItemText>
        </MenuItem>
      </Menu>
      {/* -------------------------- */}
    </Card>
  );
};

export default PostCard;
