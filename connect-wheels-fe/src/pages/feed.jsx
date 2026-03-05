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
  TextField,
  InputAdornment,
  Chip,
} from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import SearchIcon from "@mui/icons-material/Search";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import ChatIcon from "@mui/icons-material/Chat";
import GarageIcon from "@mui/icons-material/Garage";
import {
  useGetFeedQuery,
  useGetTrendingPostsQuery,
  useLikePostMutation,
  useUnlikePostMutation,
  useBrowseCarsQuery,
} from "../redux/slices/garageApiSlice";
import { useCreateChatMutation } from "../redux/slices/chatApiSlice";
import { useSelector } from "react-redux";
import { resolveImageUrl } from "../utils/imageUrl";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// ─── Post Card ─────────────────────────────────────────────────────────────

function PostCard({ post, userId, onLike, onUnlike }) {
  const navigate = useNavigate();

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!userId) { toast.info("Log in to like posts"); return; }
    try { await onLike(post.id).unwrap(); } catch { toast.error("Failed to like"); }
  };

  const media = post.media?.[0];
  return (
    <Card
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        cursor: "pointer",
        "&:hover": { boxShadow: "0 8px 30px rgba(0,0,0,0.4)", transform: "translateY(-2px)" },
        transition: "all 0.2s",
        backgroundColor: "#1e293b",
        color: "white",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
      onClick={() => navigate(`/posts/${post.id}`)}
    >
      <CardMedia
        component="img"
        image={resolveImageUrl(
          media?.mediaUrl,
          "https://images.unsplash.com/photo-1492144654654-21b3c0398737?w=600"
        )}
        alt=""
        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1492144654654-21b3c0398737?w=600"; }}
        sx={{ height: 200, objectFit: "cover" }}
      />
      <CardContent sx={{ flex: 1, pb: 0 }}>
        <Typography variant="caption" sx={{ color: "#38bdf8", display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
          <GarageIcon sx={{ fontSize: 14 }} /> {post.garage?.name || "Garage"}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3, mb: 0.5, fontSize: "1rem" }}>
          {post.title || "Untitled"}
        </Typography>
        <Typography variant="body2" sx={{ color: "#94a3b8", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {post.caption || post.content || "—"}
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: "space-between", px: 2, pt: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton size="small" onClick={handleLike} sx={{ color: "#f87171", p: 0.5 }}>
            <FavoriteBorderIcon fontSize="small" />
          </IconButton>
          <Typography variant="caption" sx={{ color: "#64748b" }}>{post.likesCount}</Typography>
          <IconButton
            size="small"
            sx={{ color: "#64748b", p: 0.5 }}
            onClick={(e) => { e.stopPropagation(); navigate(`/posts/${post.id}`); }}
          >
            <ChatBubbleOutlineIcon fontSize="small" />
          </IconButton>
          <Typography variant="caption" sx={{ color: "#64748b" }}>{post.commentsCount}</Typography>
        </Box>
        <Button size="small" sx={{ color: "#38bdf8", textTransform: "none", fontWeight: 600 }}>
          View →
        </Button>
      </CardActions>
    </Card>
  );
}

// ─── Car Feed Card ──────────────────────────────────────────────────────────

function CarFeedCard({ car, currentUserId }) {
  const navigate = useNavigate();
  const [createChat] = useCreateChatMutation();

  const images = car.media?.length
    ? car.media.map((m) => m.mediaUrl)
    : car.pictureUrl
    ? [car.pictureUrl]
    : [];
  const coverUrl = resolveImageUrl(
    images[0],
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600"
  );

  const isOwnCar = car.garage && Number(car.garage.ownerId) === Number(currentUserId);

  const handleContactOwner = async (e) => {
    e.stopPropagation();
    if (!currentUserId) { toast.info("Log in to contact the owner"); return; }
    if (isOwnCar) { toast.info("This is your own car"); return; }
    try {
      const result = await createChat({ receiverId: String(car.garage.ownerId) }).unwrap();
      const chat = result?.data || result;
      navigate("/chat", { state: { openChat: chat } });
    } catch {
      toast.error("Failed to open chat");
    }
  };

  return (
    <Card
      sx={{
        borderRadius: 2,
        overflow: "hidden",
        cursor: "pointer",
        "&:hover": { boxShadow: "0 8px 30px rgba(0,0,0,0.4)", transform: "translateY(-2px)" },
        transition: "all 0.2s",
        backgroundColor: "#1e293b",
        color: "white",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
      onClick={() => navigate(`/garages/${car.garageId}/cars/${car.id}`)}
    >
      <Box sx={{ position: "relative" }}>
        <CardMedia
          component="img"
          image={coverUrl}
          alt={`${car.make} ${car.model}`}
          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600"; }}
          sx={{ height: 200, objectFit: "cover" }}
        />
        {images.length > 1 && (
          <Chip
            label={`+${images.length - 1} photos`}
            size="small"
            sx={{
              position: "absolute",
              bottom: 8,
              right: 8,
              bgcolor: "rgba(0,0,0,0.65)",
              color: "white",
              fontSize: "0.7rem",
            }}
          />
        )}
      </Box>
      <CardContent sx={{ flex: 1, pb: 0 }}>
        <Typography variant="caption" sx={{ color: "#fbbf24", display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
          <GarageIcon sx={{ fontSize: 14 }} /> {car.garage?.name || "Garage"}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3, mb: 0.25, fontSize: "1rem" }}>
          {car.make} {car.model}
        </Typography>
        <Typography variant="body2" sx={{ color: "#94a3b8", mb: 1 }}>
          {car.year}{car.color ? ` · ${car.color}` : ""}
          {car.engineType ? ` · ${car.engineType}` : ""}
        </Typography>
        <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
          {car.color && (
            <Chip label={car.color} size="small" sx={{ bgcolor: "rgba(56,189,248,0.15)", color: "#38bdf8", height: 20, fontSize: "0.7rem" }} />
          )}
          {car.transmission && (
            <Chip label={car.transmission} size="small" sx={{ bgcolor: "rgba(251,191,36,0.15)", color: "#fbbf24", height: 20, fontSize: "0.7rem" }} />
          )}
        </Box>
      </CardContent>
      <CardActions sx={{ justifyContent: "space-between", px: 2, pt: 1, gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<ChatIcon />}
          onClick={handleContactOwner}
          sx={{
            borderRadius: 1.5,
            textTransform: "none",
            borderColor: isOwnCar ? "#475569" : "rgba(56,189,248,0.5)",
            color: isOwnCar ? "#475569" : "#38bdf8",
            fontSize: "0.75rem",
            "&:hover": isOwnCar ? {} : { bgcolor: "rgba(56,189,248,0.08)" },
          }}
          disabled={isOwnCar}
        >
          {isOwnCar ? "Your car" : "Contact"}
        </Button>
        <Button size="small" sx={{ color: "#fbbf24", textTransform: "none", fontWeight: 600, fontSize: "0.75rem" }}>
          View Details →
        </Button>
      </CardActions>
    </Card>
  );
}

// ─── Main Feed Page ──────────────────────────────────────────────────────────

export default function FeedPage({ trending = false }) {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);

  // tab: "posts" | "cars" | "trending"
  const [tab, setTab] = useState(trending ? "trending" : "posts");
  const [trendingTimeframe, setTrendingTimeframe] = useState("week");
  const [carSearch, setCarSearch] = useState("");
  const [carSearchInput, setCarSearchInput] = useState("");

  const [likePost] = useLikePostMutation();
  const [unlikePost] = useUnlikePostMutation();

  const { data: feedData, isLoading: feedLoading } = useGetFeedQuery(
    { page: 1, limit: 20 },
    { skip: tab !== "posts" || !user?.id }
  );
  const { data: trendingData, isLoading: trendingLoading } = useGetTrendingPostsQuery(
    { timeframe: trendingTimeframe, page: 1, limit: 20 },
    { skip: tab !== "trending" }
  );
  const { data: carsData, isLoading: carsLoading } = useBrowseCarsQuery(
    { page: 1, limit: 24, q: carSearch || undefined },
    { skip: tab !== "cars" }
  );

  const posts = tab === "trending" ? trendingData?.feed ?? [] : feedData?.feed ?? [];
  const cars = carsData?.cars ?? [];
  const isLoading = tab === "posts" ? feedLoading : tab === "trending" ? trendingLoading : carsLoading;

  const handleCarSearch = (e) => {
    e.preventDefault();
    setCarSearch(carSearchInput);
  };

  return (
    <Box sx={{ py: 3, px: 2, background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)", minHeight: "100%" }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 1 }}>
          <Typography variant="h5" sx={{ color: "white", fontWeight: 700 }}>
            {tab === "cars" ? "Browse Cars" : tab === "trending" ? "Trending" : "Feed"}
          </Typography>
        </Box>

        {/* Tab bar */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            mb: 3,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            "& .MuiTab-root": { color: "rgba(255,255,255,0.55)", textTransform: "none", fontWeight: 600, minWidth: 0, px: 2 },
            "& .Mui-selected": { color: "#38bdf8 !important" },
            "& .MuiTabs-indicator": { backgroundColor: "#38bdf8" },
          }}
        >
          <Tab label="My Feed" value="posts" icon={<ChatBubbleOutlineIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
          <Tab label="Cars" value="cars" icon={<DirectionsCarIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
          <Tab label="Trending" value="trending" />
        </Tabs>

        {/* ── CARS TAB ── */}
        {tab === "cars" && (
          <>
            {/* Search bar */}
            <Box
              component="form"
              onSubmit={handleCarSearch}
              sx={{ display: "flex", gap: 1.5, mb: 3 }}
            >
              <TextField
                fullWidth
                placeholder="Search by make, model, color… (e.g. Mustang, blue, turbo)"
                value={carSearchInput}
                onChange={(e) => setCarSearchInput(e.target.value)}
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "rgba(255,255,255,0.06)",
                    color: "white",
                    borderRadius: 2,
                    "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                    "&:hover fieldset": { borderColor: "rgba(56,189,248,0.4)" },
                    "&.Mui-focused fieldset": { borderColor: "#38bdf8" },
                  },
                  "& .MuiInputBase-input::placeholder": { color: "#64748b" },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "#64748b" }} />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                variant="contained"
                sx={{ borderRadius: 2, textTransform: "none", bgcolor: "#38bdf8", "&:hover": { bgcolor: "#0ea5e9" }, whiteSpace: "nowrap", px: 3 }}
              >
                Search
              </Button>
              {carSearch && (
                <Button
                  variant="outlined"
                  onClick={() => { setCarSearch(""); setCarSearchInput(""); }}
                  sx={{ borderRadius: 2, textTransform: "none", borderColor: "#475569", color: "#94a3b8", whiteSpace: "nowrap" }}
                >
                  Clear
                </Button>
              )}
            </Box>

            {carSearch && (
              <Typography variant="body2" sx={{ color: "#64748b", mb: 2 }}>
                {carsLoading ? "Searching…" : `${carsData?.total ?? 0} results for "${carSearch}"`}
              </Typography>
            )}
          </>
        )}

        {/* ── TRENDING TIMEFRAME ── */}
        {tab === "trending" && (
          <Tabs
            value={trendingTimeframe}
            onChange={(_, v) => setTrendingTimeframe(v)}
            sx={{
              mb: 3,
              "& .MuiTab-root": { color: "rgba(255,255,255,0.6)", textTransform: "none", minWidth: 64 },
              "& .Mui-selected": { color: "#f472b6 !important" },
              "& .MuiTabs-indicator": { backgroundColor: "#f472b6" },
            }}
          >
            <Tab label="This week" value="week" />
            <Tab label="This month" value="month" />
            <Tab label="All time" value="all" />
          </Tabs>
        )}

        {/* ── CONTENT ── */}
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#38bdf8" }} />
          </Box>
        ) : tab === "cars" ? (
          /* Cars grid */
          cars.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <DirectionsCarIcon sx={{ fontSize: 56, color: "rgba(255,255,255,0.15)", mb: 2 }} />
              <Typography sx={{ color: "#64748b" }}>
                {carSearch ? `No cars found for "${carSearch}"` : "No cars on the platform yet"}
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {cars.map((car) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={car.id}>
                  <CarFeedCard car={car} currentUserId={user?.id} />
                </Grid>
              ))}
            </Grid>
          )
        ) : (
          /* Posts grid (Feed + Trending) */
          tab === "posts" && !user ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography sx={{ color: "#94a3b8", mb: 2 }}>
                Log in to see posts from garages you follow
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate("/garages")}
                sx={{ borderRadius: 2, textTransform: "none", bgcolor: "#38bdf8", "&:hover": { bgcolor: "#0ea5e9" } }}
              >
                Explore Garages
              </Button>
            </Box>
          ) : posts.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <ChatBubbleOutlineIcon sx={{ fontSize: 56, color: "rgba(255,255,255,0.15)", mb: 2 }} />
              <Typography sx={{ color: "#64748b", mb: 1.5 }}>
                {tab === "trending" ? "No trending posts yet" : "Your feed is empty — follow some garages first"}
              </Typography>
              {tab === "posts" && (
                <Button
                  variant="outlined"
                  onClick={() => navigate("/garages")}
                  sx={{ borderRadius: 2, textTransform: "none", borderColor: "#38bdf8", color: "#38bdf8" }}
                >
                  Discover Garages
                </Button>
              )}
            </Box>
          ) : (
            <Grid container spacing={2}>
              {posts.map((post) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={post.id}>
                  <PostCard post={post} userId={user?.id} onLike={likePost} onUnlike={unlikePost} />
                </Grid>
              ))}
            </Grid>
          )
        )}
      </Container>
    </Box>
  );
}
