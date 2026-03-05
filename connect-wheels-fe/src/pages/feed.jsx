import { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  IconButton,
} from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { useGetFeedQuery, useGetTrendingPostsQuery, useLikePostMutation, useUnlikePostMutation } from "../redux/slices/garageApiSlice";
import { useSelector } from "react-redux";
import { resolveImageUrl } from "../utils/imageUrl";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function PostCard({ post, userId, onLike, onUnlike }) {
  const navigate = useNavigate();
  const isLiked = false; // Would need isLiked from backend - optimistic for now
  const handleLike = async (e) => {
    e.stopPropagation();
    if (!userId) {
      toast.info("Log in to like posts");
      return;
    }
    try {
      await onLike(post.id).unwrap();
    } catch {
      toast.error("Failed to like");
    }
  };
  const handleUnlike = async (e) => {
    e.stopPropagation();
    if (!userId) return;
    try {
      await onUnlike(post.id).unwrap();
    } catch {
      toast.error("Failed to unlike");
    }
  };

  const media = post.media?.[0];
  return (
    <Card
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        cursor: "pointer",
        "&:hover": { boxShadow: 4 },
        backgroundColor: "#1e293b",
        color: "white",
      }}
      onClick={() => navigate(`/posts/${post.id}`)}
    >
      <CardMedia
        component="img"
        image={resolveImageUrl(media?.mediaUrl, "https://images.unsplash.com/photo-1492144654654-21b3c0398737?w=600")}
        alt=""
        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1492144654654-21b3c0398737?w=600"; }}
        sx={{ height: 220, objectFit: "cover" }}
      />
      <CardContent>
        <Typography variant="subtitle2" sx={{ color: "#94a3b8", mb: 0.5 }}>
          {post.garage?.name || "Garage"}
        </Typography>
        <Typography variant="h6" gutterBottom>
          {post.title || "Untitled"}
        </Typography>
        <Typography variant="body2" sx={{ color: "#cbd5e1" }}>
          {post.caption || post.content || "—"}
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: "space-between", px: 2 }}>
        <Box>
          <IconButton size="small" onClick={handleLike} sx={{ color: "#f87171" }}>
            <FavoriteBorderIcon />
          </IconButton>
          <Typography component="span" variant="body2" sx={{ color: "#94a3b8", ml: 0.5 }}>
            {post.likesCount}
          </Typography>
          <IconButton size="small" sx={{ color: "#94a3b8", ml: 2 }} onClick={(e) => { e.stopPropagation(); navigate(`/posts/${post.id}`); }}>
            <ChatBubbleOutlineIcon />
          </IconButton>
          <Typography component="span" variant="body2" sx={{ color: "#94a3b8", ml: 0.5 }}>
            {post.commentsCount}
          </Typography>
        </Box>
        <Button size="small" sx={{ color: "#38bdf8", textTransform: "none" }}>
          View
        </Button>
      </CardActions>
    </Card>
  );
}

export default function FeedPage({ trending = false }) {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const [timeframe, setTimeframe] = useState("week");
  const [likePost] = useLikePostMutation();
  const [unlikePost] = useUnlikePostMutation();

  const { data: feedData, isLoading: feedLoading } = useGetFeedQuery(
    { page: 1, limit: 20 },
    { skip: trending || !user?.id }
  );
  const { data: trendingData, isLoading: trendingLoading } = useGetTrendingPostsQuery(
    { timeframe, page: 1, limit: 20 },
    { skip: !trending }
  );

  const posts = trending ? trendingData?.feed ?? [] : feedData?.feed ?? [];
  const isLoading = trending ? trendingLoading : feedLoading;

  return (
    <Box sx={{ py: 3, px: 2, background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)", minHeight: "100%" }}>
      <Container maxWidth="lg">
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Typography variant="h4" sx={{ color: "white", fontWeight: 700 }}>
            {trending ? "Trending" : "Feed"}
          </Typography>
          {trending && (
            <Tabs value={timeframe} onChange={(_, v) => setTimeframe(v)} sx={{ "& .MuiTab-root": { color: "rgba(255,255,255,0.8)" } }}>
              <Tab label="Week" value="week" />
              <Tab label="Month" value="month" />
              <Tab label="All" value="all" />
            </Tabs>
          )}
          {!trending && (
            <Button
              startIcon={<TrendingUpIcon />}
              sx={{ color: "#38bdf8", textTransform: "none" }}
              onClick={() => navigate("/feed/trending")}
            >
              Trending
            </Button>
          )}
          {trending && (
            <Button sx={{ color: "#38bdf8", textTransform: "none" }} onClick={() => navigate("/feed")}>
              My Feed
            </Button>
          )}
        </Box>

        {!user && !trending ? (
          <Typography sx={{ color: "#94a3b8", py: 4 }}>
            Log in to see your personalized feed from garages you follow.
          </Typography>
        ) : isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress sx={{ color: "#38bdf8" }} />
          </Box>
        ) : posts.length === 0 ? (
          <Typography sx={{ color: "#94a3b8", py: 6, textAlign: "center" }}>
            {trending ? "No trending posts yet." : "No posts yet. Follow some garages to see their posts!"}
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {posts.map((post) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={post.id}>
                <PostCard
                  post={post}
                  userId={user?.id}
                  onLike={likePost}
                  onUnlike={unlikePost}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
