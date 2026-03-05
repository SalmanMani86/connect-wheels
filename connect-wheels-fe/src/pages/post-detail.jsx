import { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  IconButton,
  TextField,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import SendIcon from "@mui/icons-material/Send";
import {
  useGetPostQuery,
  useGetPostCommentsQuery,
  useLikePostMutation,
  useAddCommentMutation,
  useLikeCommentMutation,
  useUpdatePostMutation,
} from "../redux/slices/garageApiSlice";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { resolveImageUrl } from "../utils/imageUrl";

function CommentItem({ c, userId, onLike }) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [addReply, { isLoading }] = useAddCommentMutation();

  const handleReply = async () => {
    if (!replyText.trim() || !userId) return;
    try {
      await addReply({ postId: c.postId, content: replyText, parentCommentId: c.id }).unwrap();
      setReplyText("");
      setShowReply(false);
    } catch {
      toast.error("Failed to reply");
    }
  };

  return (
    <Box sx={{ ml: c.parentCommentId ? 4 : 0, mb: 2 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" sx={{ color: "#38bdf8" }}>
            User #{c.userId}
          </Typography>
          <Typography variant="body2" sx={{ color: "#e2e8f0" }}>
            {c.content}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
            <IconButton size="small" sx={{ color: "#94a3b8" }} onClick={() => onLike(c.id)}>
              <FavoriteBorderIcon fontSize="small" />
            </IconButton>
            <Typography variant="caption" sx={{ color: "#94a3b8" }}>
              {c.likesCount}
            </Typography>
            {!c.parentCommentId && userId && (
              <Button size="small" sx={{ color: "#94a3b8", textTransform: "none", minWidth: "auto" }} onClick={() => setShowReply(!showReply)}>
                Reply
              </Button>
            )}
          </Box>
        </Box>
      </Box>
      {showReply && (
        <Box sx={{ mt: 1, display: "flex", gap: 1, alignItems: "center" }}>
          <TextField
            size="small"
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            sx={{
              flex: 1,
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(255,255,255,0.05)",
                color: "white",
                "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
              },
            }}
          />
          <Button size="small" onClick={handleReply} disabled={isLoading} sx={{ color: "#38bdf8" }}>
            {isLoading ? <CircularProgress size={20} /> : "Post"}
          </Button>
        </Box>
      )}
      {c.replies?.map((r) => (
        <CommentItem key={r.id} c={r} userId={userId} onLike={onLike} />
      ))}
    </Box>
  );
}

export default function PostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const id = parseInt(postId, 10);
  const { user } = useSelector((state) => state.user);
  const [commentText, setCommentText] = useState("");

  const { data: postData, isLoading, isError } = useGetPostQuery(id, { skip: !id || isNaN(id) });
  const { data: commentsData } = useGetPostCommentsQuery({ postId: id, page: 1, limit: 50 }, { skip: !id });

  const [likePost] = useLikePostMutation();
  const [addComment, { isLoading: commentLoading }] = useAddCommentMutation();
  const [likeComment] = useLikeCommentMutation();
  const [updatePost, { isLoading: updateLoading }] = useUpdatePostMutation();
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [editContent, setEditContent] = useState("");

  const post = postData?.post;
  const isOwner = post?.garage && user && Number(post.garage.ownerId) === Number(user.id);
  const comments = commentsData?.comments ?? [];

  const handleLikePost = async () => {
    if (!user) {
      toast.info("Log in to like");
      return;
    }
    try {
      await likePost(id).unwrap();
    } catch {
      toast.error("Failed to like");
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    if (!user) {
      toast.info("Log in to comment");
      return;
    }
    try {
      await addComment({ postId: id, content: commentText }).unwrap();
      setCommentText("");
    } catch {
      toast.error("Failed to add comment");
    }
  };

  const handleOpenEdit = () => {
    setEditTitle(post.title || "");
    setEditCaption(post.caption || "");
    setEditContent(post.content || "");
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      await updatePost({
        postId: id,
        title: editTitle.trim() || undefined,
        caption: editCaption.trim() || undefined,
        content: editContent.trim() || undefined,
      }).unwrap();
      toast.success("Post updated");
      setEditOpen(false);
    } catch {
      toast.error("Failed to update post");
    }
  };

  if (isLoading || isError || !post) {
    return (
      <Box sx={{ py: 6, display: "flex", justifyContent: "center", minHeight: "50vh" }}>
        {isLoading ? <CircularProgress sx={{ color: "white" }} /> : <Typography sx={{ color: "#f87171" }}>Post not found</Typography>}
      </Box>
    );
  }

  const media = post.media?.[0];

  return (
    <Box sx={{ py: 3, px: 2, background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)", minHeight: "100%" }}>
      <Container maxWidth="md">
        <Button sx={{ color: "#38bdf8", textTransform: "none", mb: 2 }} onClick={() => navigate(-1)}>
          ← Back
        </Button>

        <Card sx={{ borderRadius: 2, overflow: "hidden", backgroundColor: "#1e293b", color: "white", mb: 3 }}>
          <CardMedia
            component="img"
            image={resolveImageUrl(media?.mediaUrl, "https://images.unsplash.com/photo-1492144654654-21b3c0398737?w=800")}
            alt=""
            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1492144654654-21b3c0398737?w=800"; }}
            sx={{ height: 360, maxHeight: "50vh", objectFit: "cover" }}
          />
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: "#94a3b8", mb: 0.5 }}>
                  {post.garage?.name || "Garage"}
                </Typography>
                <Typography variant="h5" gutterBottom fontWeight={600}>
                  {post.title || "Untitled"}
                </Typography>
              </Box>
              {isOwner && (
                <IconButton onClick={handleOpenEdit} sx={{ color: "#94a3b8" }} size="small" title="Edit post">
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
            <Typography variant="body1" sx={{ color: "#cbd5e1", whiteSpace: "pre-wrap" }}>
              {post.caption || post.content || "—"}
            </Typography>
            <Box sx={{ display: "flex", gap: 3, mt: 2 }}>
              <IconButton onClick={handleLikePost} sx={{ color: "#f87171" }}>
                <FavoriteBorderIcon />
              </IconButton>
              <Typography sx={{ alignSelf: "center", color: "#94a3b8" }}>{post.likesCount} likes</Typography>
              <Typography sx={{ alignSelf: "center", color: "#94a3b8" }}>{post.commentsCount} comments</Typography>
            </Box>
          </CardContent>
        </Card>

        <Typography variant="h6" sx={{ color: "white", mb: 2 }}>
          Comments
        </Typography>

        {user && (
          <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "rgba(255,255,255,0.05)",
                  color: "white",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleAddComment}
              disabled={commentLoading || !commentText.trim()}
              sx={{ borderRadius: 2, minWidth: 100 }}
            >
              {commentLoading ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
            </Button>
          </Box>
        )}

        <Box sx={{ pl: 1 }}>
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              c={{ ...c, postId: id }}
              userId={user?.id}
              onLike={(commentId) => likeComment(commentId).catch(() => toast.error("Failed to like comment"))}
            />
          ))}
          {comments.length === 0 && (
            <Typography sx={{ color: "#64748b", py: 4 }}>No comments yet. Be the first!</Typography>
          )}
        </Box>
      </Container>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.08)" } } }}>
        <DialogTitle sx={{ color: "white" }}>Edit Post</DialogTitle>
        <DialogContent>
          <TextField margin="dense" label="Title" fullWidth value={editTitle} onChange={(e) => setEditTitle(e.target.value)} sx={{ "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "rgba(255,255,255,0.2)" } }, "& .MuiInputLabel-root": { color: "#94a3b8" } }} />
          <TextField margin="dense" label="Caption" fullWidth multiline value={editCaption} onChange={(e) => setEditCaption(e.target.value)} sx={{ "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "rgba(255,255,255,0.2)" } }, "& .MuiInputLabel-root": { color: "#94a3b8" } }} />
          <TextField margin="dense" label="Content" fullWidth multiline rows={3} value={editContent} onChange={(e) => setEditContent(e.target.value)} sx={{ "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "rgba(255,255,255,0.2)" } }, "& .MuiInputLabel-root": { color: "#94a3b8" } }} />
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <Button onClick={() => setEditOpen(false)} sx={{ color: "#94a3b8" }}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={updateLoading} sx={{ backgroundColor: "#38bdf8", "&:hover": { backgroundColor: "#0ea5e9" } }}>
            {updateLoading ? <CircularProgress size={24} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
