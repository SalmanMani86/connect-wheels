import { useEffect, useState } from "react";
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
  useLikePostMutation,
  useBrowseCarsQuery,
} from "../redux/slices/garageApiSlice";
import { useCreateChatMutation } from "../redux/slices/chatApiSlice";
import { useSelector } from "react-redux";
import { resolveImageUrl } from "../utils/imageUrl";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// ─── Post Card ─────────────────────────────────────────────────────────────

function PostCard({ post, userId, onLike }) {
  const navigate = useNavigate();
  const isOwnGaragePost = Number(post.garage?.ownerId) === Number(userId);

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
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5, flexWrap: "wrap" }}>
          <Typography variant="caption" sx={{ color: "#38bdf8", display: "flex", alignItems: "center", gap: 0.5 }}>
            <GarageIcon sx={{ fontSize: 14 }} /> {post.garage?.name || "Garage"}
          </Typography>
          {isOwnGaragePost && (
            <Chip
              label="Your garage"
              size="small"
              sx={{ height: 18, fontSize: "0.65rem", bgcolor: "rgba(56,189,248,0.14)", color: "#7dd3fc" }}
            />
          )}
        </Box>
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

  const isOwnCar = Boolean(car.isOwnedByCurrentUser) || (
    car.garage && Number(car.garage.ownerId) === Number(currentUserId)
  );

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
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5, flexWrap: "wrap" }}>
          <Typography variant="caption" sx={{ color: "#fbbf24", display: "flex", alignItems: "center", gap: 0.5 }}>
            <GarageIcon sx={{ fontSize: 14 }} /> {car.garage?.name || "Garage"}
          </Typography>
          {isOwnCar && (
            <Chip
              label="Your car"
              size="small"
              sx={{
                height: 20,
                fontSize: "0.68rem",
                bgcolor: "#fbbf24",
                color: "#422006",
                fontWeight: 800,
              }}
            />
          )}
        </Box>
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
            borderColor: isOwnCar ? "rgba(251,191,36,0.45)" : "rgba(56,189,248,0.5)",
            color: isOwnCar ? "#fbbf24" : "#38bdf8",
            fontSize: "0.75rem",
            "&:hover": isOwnCar ? {} : { bgcolor: "rgba(56,189,248,0.08)" },
            "&.Mui-disabled": {
              borderColor: "rgba(251,191,36,0.45)",
              color: "#fbbf24",
              opacity: 1,
            },
            "&.Mui-disabled .MuiSvgIcon-root": {
              color: "#fbbf24",
            },
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

export default function FeedPage() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);

  // tab: "posts" | "cars"
  const [tab, setTab] = useState("posts");
  const [carSearch, setCarSearch] = useState("");
  const [carSearchInput, setCarSearchInput] = useState("");
  const [carOwnership, setCarOwnership] = useState("all");

  const [likePost] = useLikePostMutation();

  const { data: feedData, isLoading: feedLoading } = useGetFeedQuery(
    { page: 1, limit: 20 },
    { skip: tab !== "posts" || !user?.id }
  );
  const { data: carsData, isLoading: carsLoading } = useBrowseCarsQuery(
    {
      page: 1,
      limit: 24,
      q: carSearch || undefined,
      ownership: carOwnership,
    },
    { skip: tab !== "cars" }
  );

  const posts = feedData?.feed ?? [];
  const cars = carsData?.cars ?? [];
  const isLoading = tab === "posts" ? feedLoading : carsLoading;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCarSearch(carSearchInput.trim());
    }, 450);

    return () => clearTimeout(timeoutId);
  }, [carSearchInput]);

  return (
    <Box sx={{ py: 3, px: 2, background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)", minHeight: "100%" }}>
      <Container maxWidth="lg">
        {/* Home header */}
        <Box
          sx={{
            mb: 2.5,
            p: { xs: 1.5, md: 2 },
            borderRadius: 3,
            display: "flex",
            alignItems: { xs: "flex-start", md: "center" },
            justifyContent: "space-between",
            gap: 2,
            flexDirection: { xs: "column", md: "row" },
            background: "rgba(30,41,59,0.58)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Box>
            <Typography variant="overline" sx={{ color: "#38bdf8", fontWeight: 800, letterSpacing: 1 }}>
              Home
            </Typography>
            <Typography variant="h5" sx={{ color: "white", fontWeight: 800, fontSize: { xs: "1.25rem", md: "1.45rem" } }}>
              Your automotive feed
            </Typography>
            <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.25 }}>
              Posts come from garages you follow. Cars are browsed separately across the platform.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, width: { xs: "100%", md: "auto" } }}>
            <Button
              variant="contained"
              startIcon={<GarageIcon />}
              onClick={() => navigate("/garages")}
              size="small"
              sx={{ borderRadius: 2, textTransform: "none", bgcolor: "#38bdf8", color: "#082f49", fontWeight: 800, "&:hover": { bgcolor: "#0ea5e9" } }}
            >
              Garages
            </Button>
            <Button
              variant="outlined"
              startIcon={<DirectionsCarIcon />}
              onClick={() => setTab("cars")}
              size="small"
              sx={{ borderRadius: 2, textTransform: "none", borderColor: "rgba(251,191,36,0.5)", color: "#fbbf24" }}
            >
              Browse Cars
            </Button>
          </Box>
        </Box>

        <Box sx={{ maxWidth: 920, mx: "auto" }}>
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
            </Tabs>

            {/* ── CARS TAB ── */}
            {tab === "cars" && (
              <>
                <Box
                  sx={{
                    display: "flex",
                    gap: 1.5,
                    mb: 1.5,
                    flexDirection: { xs: "column", sm: "row" },
                  }}
                >
                  <TextField
                    fullWidth
                    placeholder="Search by make, model, color, engine..."
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
                  {(carSearchInput || carOwnership !== "all") && (
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setCarSearch("");
                        setCarSearchInput("");
                        setCarOwnership("all");
                      }}
                      sx={{ borderRadius: 2, textTransform: "none", borderColor: "#475569", color: "#94a3b8", whiteSpace: "nowrap" }}
                    >
                      Clear
                    </Button>
                  )}
                </Box>

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
                  {[
                    { value: "all", label: "All cars" },
                    { value: "own", label: "Owned by me" },
                    { value: "community", label: "Other users" },
                  ].map((filter) => {
                    const isActive = carOwnership === filter.value;

                    return (
                      <Button
                        key={filter.value}
                        size="small"
                        variant={isActive ? "contained" : "outlined"}
                        onClick={() => setCarOwnership(filter.value)}
                        sx={{
                          borderRadius: 999,
                          textTransform: "none",
                          bgcolor: isActive ? "#38bdf8" : "transparent",
                          color: isActive ? "#082f49" : "#94a3b8",
                          borderColor: isActive ? "#38bdf8" : "rgba(148,163,184,0.35)",
                          fontWeight: isActive ? 800 : 600,
                          "&:hover": isActive
                            ? { bgcolor: "#0ea5e9" }
                            : { borderColor: "#38bdf8", color: "#38bdf8" },
                        }}
                      >
                        {filter.label}
                      </Button>
                    );
                  })}
                </Box>

                {(carSearch || carOwnership !== "all") && (
                  <Typography variant="body2" sx={{ color: "#64748b", mb: 2 }}>
                    {carsLoading
                      ? "Searching..."
                      : `${carsData?.total ?? 0} ${carsData?.total === 1 ? "result" : "results"}${carSearch ? ` for "${carSearch}"` : ""}`}
                  </Typography>
                )}
              </>
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
                    {carSearch
                      ? `No cars found for "${carSearch}"`
                      : carOwnership === "own"
                      ? "You have not added any cars yet"
                      : carOwnership === "community"
                      ? "No community cars found"
                      : "No cars on the platform yet"}
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
              /* Posts grid */
              tab === "posts" && !user ? (
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <Typography sx={{ color: "#94a3b8", mb: 2 }}>
                    Log in to see posts from garages you follow
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => navigate("/garages")}
                    sx={{ borderRadius: 2, textTransform: "none", bgcolor: "#38bdf8", color: "#082f49", fontWeight: 800, "&:hover": { bgcolor: "#0ea5e9" } }}
                  >
                    Explore Garages
                  </Button>
                </Box>
              ) : posts.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 8 }}>
                  <ChatBubbleOutlineIcon sx={{ fontSize: 56, color: "rgba(255,255,255,0.15)", mb: 2 }} />
                  <Typography sx={{ color: "#64748b", mb: 1.5 }}>
                    Your feed is empty — follow some garages first
                  </Typography>
                  {tab === "posts" && (
                    <Button
                      variant="outlined"
                      onClick={() => navigate("/garages")}
                      sx={{ borderRadius: 2, textTransform: "none", borderColor: "#38bdf8", color: "#38bdf8", mb: 3 }}
                    >
                      Discover Garages
                    </Button>
                  )}
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {posts.map((post) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={post.id}>
                      <PostCard post={post} userId={user?.id} onLike={likePost} />
                    </Grid>
                  ))}
                </Grid>
              )
            )}
        </Box>
      </Container>
    </Box>
  );
}
