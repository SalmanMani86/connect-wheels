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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import CloseIcon from "@mui/icons-material/Close";
import { useSearchGaragesQuery, useCreateGarageMutation } from "../redux/slices/garageApiSlice";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { uploadGarageCover } from "../utils/uploadUtils";
import { resolveImageUrl } from "../utils/imageUrl";

export default function GaragesPage() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);
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

  const { data, isLoading, isError } = useSearchGaragesQuery({
    q: search,
    location: location || undefined,
    page: 1,
    limit: 20,
  });
  const [createGarage, { isLoading: creating }] = useCreateGarageMutation();

  const garages = data?.garages ?? [];
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
        <Typography variant="h4" sx={{ color: "white", mb: 3, fontWeight: 700 }}>
          Garages
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <TextField
            placeholder="Search garages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{
              minWidth: 240,
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(255,255,255,0.1)",
                color: "white",
                "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "rgba(255,255,255,0.7)" }} />
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
              minWidth: 180,
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(255,255,255,0.1)",
                color: "white",
                "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
              },
            }}
          />
          {user && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateOpen(true)}
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              Create Garage
            </Button>
          )}
        </Box>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress sx={{ color: "white" }} />
          </Box>
        ) : isError ? (
          <Typography sx={{ color: "#f87171", textAlign: "center", py: 4 }}>
            Failed to load garages. Make sure the API is running.
          </Typography>
        ) : garages.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <DirectionsCarIcon sx={{ fontSize: 64, color: "rgba(255,255,255,0.4)", mb: 2 }} />
            <Typography sx={{ color: "rgba(255,255,255,0.8)" }}>
              No garages found. Create one to get started!
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {garages.map((g) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={g.id}>
                <Card
                  sx={{
                    borderRadius: 2,
                    overflow: "hidden",
                    cursor: "pointer",
                    "&:hover": { boxShadow: 6 },
                    background: "linear-gradient(145deg, #334155 0%, #1e293b 100%)",
                    color: "white",
                  }}
                  onClick={() => navigate(`/garages/${g.id}`)}
                >
                  <CardMedia
                    component="img"
                    image={resolveImageUrl(g.coverImageUrl, "https://images.unsplash.com/photo-1492144654654-21b3c0398737?w=400")}
                    sx={{ height: 140, objectFit: "cover" }}
                    alt={g.name}
                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1492144654654-21b3c0398737?w=400"; }}
                  />
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
                      View Garage
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
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
          <Button onClick={handleCreate} variant="contained" disabled={creating} sx={{ backgroundColor: "#38bdf8", "&:hover": { backgroundColor: "#0ea5e9" } }}>
            {creating ? <CircularProgress size={24} /> : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
