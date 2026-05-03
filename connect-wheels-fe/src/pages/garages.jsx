import { useState, useRef } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import CloseIcon from "@mui/icons-material/Close";
import { useSearchGaragesQuery, useGetUserGaragesQuery, useCreateGarageMutation } from "../redux/slices/garageApiSlice";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { uploadGarageCover } from "../utils/uploadUtils";
import { resolveImageUrl } from "../utils/imageUrl";

export default function GaragesPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
  const [tab, setTab] = useState("mine");
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createData, setCreateData] = useState({
    garageName: "",
    description: "",
    location: "",
    coverImageUrl: "",
    coverImageFile: null,
  });
  const coverInputRef = useRef(null);

  const { data, isLoading: discoverLoading, isError: discoverError, refetch: refetchDiscover } = useSearchGaragesQuery({
    q: search,
    location: location || undefined,
    page: 1,
    limit: 20,
  });
  const {
    data: userGaragesData,
    isLoading: myGaragesLoading,
    isError: myGaragesError,
    refetch: refetchMyGarages,
  } = useGetUserGaragesQuery(
    { userId: user?.id, page: 1, limit: 20 },
    { skip: !user?.id }
  );
  const [createGarage, { isLoading: creating }] = useCreateGarageMutation();

  const garages = data?.garages ?? [];
  const myGarages = userGaragesData?.garages ?? [];
  const communityGarages = garages.filter((garage) => Number(garage.ownerId) !== Number(user?.id));
  const visibleGarages = tab === "mine" ? myGarages : communityGarages;
  const isLoading = tab === "mine" ? myGaragesLoading : discoverLoading;
  const isError = tab === "mine" ? myGaragesError : discoverError;

  const handleCreate = async () => {
    if (!createData.garageName.trim()) {
      toast.error("Garage name is required");
      return;
    }
    if (!user?.id) {
      toast.error("You must be logged in to create a garage");
      return;
    }
    try {
      let coverImageUrl = createData.coverImageUrl;
      if (createData.coverImageFile) {
        coverImageUrl = await uploadGarageCover(createData.coverImageFile);
      }
      await createGarage({
        garageName: createData.garageName,
        description: createData.description || undefined,
        location: createData.location || undefined,
        coverImageUrl: coverImageUrl || undefined,
        userID: user.id,
      }).unwrap();
      toast.success("Garage created successfully");
      setCreateOpen(false);
      setCreateData({ garageName: "", description: "", location: "", coverImageUrl: "", coverImageFile: null });
      setTab("mine");
      await Promise.all([refetchDiscover(), user?.id ? refetchMyGarages() : Promise.resolve()]);
    } catch (err) {
      toast.error(err?.message || err?.data?.message || "Failed to create garage");
    }
  };

  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPEG, PNG, WebP, GIF)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setCreateData((p) => ({
      ...p,
      coverImageFile: file,
      coverImageUrl: URL.createObjectURL(file),
    }));
  };

  const handleRemoveCover = () => {
    if (createData.coverImageUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(createData.coverImageUrl);
    }
    setCreateData((p) => ({ ...p, coverImageUrl: "", coverImageFile: null }));
  };

  return (
    <Box sx={{ py: 3, px: 2, background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)", minHeight: "100%" }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            mb: 3,
            p: { xs: 2, md: 2.5 },
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
              Garage Hub
            </Typography>
            <Typography variant="h4" sx={{ color: "white", fontWeight: 800, fontSize: { xs: "1.6rem", md: "2rem" } }}>
              Manage yours. Discover others.
            </Typography>
            <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5, maxWidth: 680 }}>
              Your garages are where you add cars and posts. Community garages are where you follow creators to build your feed.
            </Typography>
          </Box>
          {user && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateOpen(true)}
              sx={{ borderRadius: 2, textTransform: "none", whiteSpace: "nowrap", bgcolor: "#38bdf8", color: "#082f49", fontWeight: 800, "&:hover": { bgcolor: "#0ea5e9" } }}
            >
              Create Garage
            </Button>
          )}
        </Box>

        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          sx={{
            mb: 3,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            "& .MuiTab-root": { color: "rgba(255,255,255,0.55)", textTransform: "none", fontWeight: 700 },
            "& .Mui-selected": { color: "#38bdf8 !important" },
            "& .MuiTabs-indicator": { backgroundColor: "#38bdf8" },
          }}
        >
          <Tab label={`My garages (${myGarages.length})`} value="mine" />
          <Tab label="Discover garages" value="discover" />
        </Tabs>

        {tab === "discover" && (
          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
            <TextField
              placeholder="Search community garages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{
                flex: { xs: 1, sm: "initial" },
                minWidth: { xs: 0, sm: 260 },
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "rgba(255,255,255,0.08)",
                  color: "white",
                  borderRadius: 2,
                  "& fieldset": { borderColor: "rgba(255,255,255,0.16)" },
                  "&:hover fieldset": { borderColor: "rgba(56,189,248,0.45)" },
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
            <TextField
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              size="small"
              sx={{
                flex: { xs: 1, sm: "initial" },
                minWidth: { xs: 0, sm: 170 },
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "rgba(255,255,255,0.08)",
                  color: "white",
                  borderRadius: 2,
                  "& fieldset": { borderColor: "rgba(255,255,255,0.16)" },
                  "&:hover fieldset": { borderColor: "rgba(56,189,248,0.45)" },
                  "&.Mui-focused fieldset": { borderColor: "#38bdf8" },
                },
                "& .MuiInputBase-input::placeholder": { color: "#64748b" },
              }}
            />
          </Box>
        )}

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress sx={{ color: "white" }} />
          </Box>
        ) : isError ? (
          <Typography sx={{ color: "#f87171", textAlign: "center", py: 4 }}>
            Failed to load garages. Make sure the API is running.
          </Typography>
        ) : tab === "mine" && !user ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <DirectionsCarIcon sx={{ fontSize: 64, color: "rgba(255,255,255,0.18)", mb: 2 }} />
            <Typography sx={{ color: "#94a3b8", mb: 2 }}>
              Log in to create and manage your garages.
            </Typography>
            <Button variant="contained" onClick={() => navigate("/login")} sx={{ borderRadius: 2, textTransform: "none" }}>
              Go to login
            </Button>
          </Box>
        ) : visibleGarages.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <DirectionsCarIcon sx={{ fontSize: 64, color: "rgba(255,255,255,0.18)", mb: 2 }} />
            <Typography sx={{ color: "#94a3b8", mb: 2 }}>
              {tab === "mine" ? "You have not created a garage yet." : "No community garages found."}
            </Typography>
            {tab === "mine" && user && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)} sx={{ borderRadius: 2, textTransform: "none" }}>
                Create your first garage
              </Button>
            )}
          </Box>
        ) : (
          <Grid container spacing={3}>
            {visibleGarages.map((g) => {
              const isOwnGarage = Number(g.ownerId) === Number(user?.id);

              return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={g.id}>
                <Card
                  sx={{
                    borderRadius: 2,
                    overflow: "hidden",
                    cursor: "pointer",
                    "&:hover": { boxShadow: "0 10px 32px rgba(0,0,0,0.35)", transform: "translateY(-2px)" },
                    transition: "all 0.2s",
                    background: "linear-gradient(145deg, #243247 0%, #1e293b 100%)",
                    color: "white",
                    border: isOwnGarage ? "1px solid rgba(56,189,248,0.35)" : "1px solid rgba(255,255,255,0.08)",
                  }}
                  onClick={() => navigate(`/garages/${g.id}`)}
                >
                  <Box sx={{ position: "relative" }}>
                    <CardMedia
                      component="img"
                      image={resolveImageUrl(g.coverImageUrl, "https://images.unsplash.com/photo-1492144654654-21b3c0398737?w=400")}
                      sx={{ height: 150, objectFit: "cover" }}
                      alt={g.name}
                      onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1492144654654-21b3c0398737?w=400"; }}
                    />
                    <Chip
                      label={isOwnGarage ? "Your garage" : "Community"}
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        bgcolor: isOwnGarage ? "rgba(8,47,73,0.9)" : "rgba(15,23,42,0.82)",
                        color: isOwnGarage ? "#7dd3fc" : "#cbd5e1",
                        fontWeight: 800,
                        border: "1px solid rgba(255,255,255,0.14)",
                      }}
                    />
                  </Box>
                  <CardContent>
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                      {g.name}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, mb: 1 }}>
                      {g.description || "No description"}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.6 }}>
                      {g.followersCount} followers · {g.postsCount} posts · {g.carsCount} cars
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" sx={{ color: "#38bdf8", textTransform: "none" }}>
                      {isOwnGarage ? "Manage Garage" : "View Garage"}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              );
            })}
          </Grid>
        )}
      </Container>

      <Dialog
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          handleRemoveCover();
        }}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        slotProps={{
          paper: { sx: { backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.08)" } },
        }}
      >
        <DialogTitle sx={{ color: "white" }}>Create Garage</DialogTitle>
        <DialogContent>
          {/* Cover image upload */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: "#94a3b8", mb: 1 }}>
              Cover Image (optional)
            </Typography>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              hidden
              onChange={handleCoverSelect}
            />
            {createData.coverImageUrl ? (
              <Box sx={{ position: "relative", borderRadius: 2, overflow: "hidden" }}>
                <Box
                  component="img"
                  src={createData.coverImageUrl}
                  alt="Cover preview"
                  sx={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
                />
                <IconButton
                  size="small"
                  onClick={handleRemoveCover}
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    bgcolor: "rgba(0,0,0,0.6)",
                    color: "white",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ) : (
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PhotoCameraIcon />}
                onClick={() => coverInputRef.current?.click()}
                sx={{
                  py: 2,
                  borderStyle: "dashed",
                  borderColor: "rgba(255,255,255,0.3)",
                  color: "#94a3b8",
                  "&:hover": { borderColor: "#38bdf8", color: "#38bdf8" },
                }}
              >
                Add cover image
              </Button>
            )}
          </Box>
          <TextField
            autoFocus
            margin="dense"
            label="Garage Name"
            fullWidth
            required
            value={createData.garageName}
            onChange={(e) => setCreateData((p) => ({ ...p, garageName: e.target.value }))}
            sx={{ "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "rgba(255,255,255,0.2)" } }, "& .MuiInputLabel-root": { color: "#94a3b8" } }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={createData.description}
            onChange={(e) => setCreateData((p) => ({ ...p, description: e.target.value }))}
            sx={{ "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "rgba(255,255,255,0.2)" } }, "& .MuiInputLabel-root": { color: "#94a3b8" } }}
          />
          <TextField
            margin="dense"
            label="Location"
            fullWidth
            value={createData.location}
            onChange={(e) => setCreateData((p) => ({ ...p, location: e.target.value }))}
            sx={{ "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "rgba(255,255,255,0.2)" } }, "& .MuiInputLabel-root": { color: "#94a3b8" } }}
          />
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <Button onClick={() => setCreateOpen(false)} sx={{ color: "#94a3b8" }}>Cancel</Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={creating}
            sx={{
              backgroundColor: "#38bdf8",
              color: "#082f49",
              fontWeight: 800,
              "&:hover": { backgroundColor: "#0ea5e9" },
              "&.Mui-disabled": { backgroundColor: "#475569", color: "#cbd5e1" },
            }}
          >
            {creating ? <CircularProgress size={24} /> : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
