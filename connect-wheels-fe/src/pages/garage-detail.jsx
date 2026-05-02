import { useState, useRef, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Tab,
  Tabs,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import ChatIcon from "@mui/icons-material/Chat";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import CloseIcon from "@mui/icons-material/Close";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  useGetGarageQuery,
  useGetGarageCarsQuery,
  useGetGaragePostsQuery,
  useFollowGarageMutation,
  useUnfollowGarageMutation,
  useCreatePostMutation,
  useAddCarMutation,
  useUpdateCarMutation,
  useDeleteCarMutation,
  useUpdateGarageMutation,
  useDeleteGarageMutation,
  useDeletePostMutation,
  useGetFollowingQuery,
} from "../redux/slices/garageApiSlice";
import { useCreateChatMutation } from "../redux/slices/chatApiSlice";
import { useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { resolveImageUrl } from "../utils/imageUrl";

export default function GarageDetailPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { garageId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const id = parseInt(garageId, 10);
  const { user } = useSelector((state) => state.user);
  const [tab, setTab] = useState(0);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [carDialogOpen, setCarDialogOpen] = useState(false);
  const [postData, setPostData] = useState({
    title: "",
    caption: "",
    content: "",
    imageFiles: [],
    imagePreviews: [],
  });
  const postImageInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const carImageInputRef = useRef(null);
  const [carData, setCarData] = useState({ make: "", model: "", year: new Date().getFullYear(), color: "", imageFiles: [], imagePreviews: [] });
  const [editCarDialogOpen, setEditCarDialogOpen] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [editCarData, setEditCarData] = useState({ make: "", model: "", year: new Date().getFullYear(), color: "", imageFiles: [], imagePreviews: [] });
  const editCarImageInputRef = useRef(null);

  const [deleteCarConfirm, setDeleteCarConfirm] = useState(null);
  const [deletePostConfirm, setDeletePostConfirm] = useState(null);
  const [deleteGarageConfirm, setDeleteGarageConfirm] = useState(false);

  const { data, isLoading, isError } = useGetGarageQuery(id, { skip: !id || isNaN(id) });
  const { data: carsData } = useGetGarageCarsQuery({ garageId: id, page: 1, limit: 20 }, { skip: !id || tab !== 0 });
  const { data: followingData } = useGetFollowingQuery(
    { userId: user?.id, page: 1, limit: 100 },
    { skip: !user?.id }
  );

  const processedEditCarRef = useRef(null);
  useEffect(() => {
    const editCarId = location.state?.editCarId;
    if (!editCarId || !carsData?.cars) return;
    if (processedEditCarRef.current === editCarId) return;
    const car = carsData.cars.find((c) => c.id === editCarId);
    if (car) {
      processedEditCarRef.current = editCarId;
      setTab(0);
      handleOpenEditCar(car);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.editCarId, carsData?.cars]);
  const { data: postsData } = useGetGaragePostsQuery({ garageId: id, page: 1, limit: 20 }, { skip: !id || tab !== 1 });

  const [isFollowingLocal, setIsFollowingLocal] = useState(null);
  const [follow, { isLoading: followLoading }] = useFollowGarageMutation();
  const [unfollow, { isLoading: unfollowLoading }] = useUnfollowGarageMutation();
  const [createChat] = useCreateChatMutation();
  const [createPost, { isLoading: postCreating }] = useCreatePostMutation();
  const [addCar, { isLoading: carCreating }] = useAddCarMutation();
  const [updateCar, { isLoading: carUpdating }] = useUpdateCarMutation();
  const [deleteCar, { isLoading: carDeleting }] = useDeleteCarMutation();
  const [updateGarage, { isLoading: updatingCover }] = useUpdateGarageMutation();
  const [deleteGarage, { isLoading: garageDeleting }] = useDeleteGarageMutation();
  const [deletePost, { isLoading: postDeleting }] = useDeletePostMutation();

  const garage = data?.garage;
  const cars = carsData?.cars ?? [];
  const posts = postsData?.posts ?? [];
  const isOwner = garage && user && Number(user.id) === Number(garage.ownerId);

  useEffect(() => {
    if (!id || !followingData?.following) return;
    const isFollowing = followingData.following.some(
      (item) => Number(item.garageId || item.garage?.id) === Number(id)
    );
    setIsFollowingLocal(isFollowing);
  }, [id, followingData?.following]);

  const handleFollow = async () => {
    if (!user) {
      toast.info("Log in to follow");
      return;
    }
    try {
      await follow(id).unwrap();
      setIsFollowingLocal(true);
      toast.success("Following garage");
    } catch (err) {
      if (err?.data?.message?.includes("Already following")) setIsFollowingLocal(true);
      else toast.error(err?.data?.message || "Failed to follow");
    }
  };

  const handleUnfollow = async () => {
    if (!user) return;
    try {
      await unfollow(id).unwrap();
      setIsFollowingLocal(false);
      toast.success("Unfollowed garage");
    } catch {
      toast.error("Failed to unfollow");
    }
  };

  const showUnfollow = isFollowingLocal === true;

  const handleContactOwner = async () => {
    if (!garage?.ownerId) return;
    if (!user) {
      toast.info("Log in to message the garage owner");
      return;
    }
    if (Number(user.id) === Number(garage.ownerId)) {
      toast.info("You can't message yourself");
      return;
    }
    try {
      const result = await createChat({ receiverId: String(garage.ownerId) }).unwrap();
      const chat = result?.data || result;
      navigate("/chat", { state: { openChat: chat } });
    } catch (err) {
      toast.error(err?.data?.message || "Failed to start chat");
    }
  };

  const handleCreatePost = async () => {
    if (!postData.title?.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("title", postData.title);
      if (postData.caption) formData.append("caption", postData.caption);
      if (postData.content) formData.append("content", postData.content);
      for (const file of postData.imageFiles || []) {
        formData.append("images", file);
      }
      await createPost({ garageId: id, formData }).unwrap();
      toast.success("Post created");
      setPostDialogOpen(false);
      setPostData({ title: "", caption: "", content: "", imageFiles: [], imagePreviews: [] });
    } catch (err) {
      toast.error(err?.message || err?.data?.message || "Failed to create post");
    }
  };

  const handlePostImagesSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => f.type.startsWith("image/"));
    if (valid.length !== files.length) {
      toast.error("Only image files are allowed");
    }
    const limited = valid.slice(0, 5);
    if (valid.length > 5) {
      toast.info("Maximum 5 images. Only first 5 will be used.");
    }
    const previews = limited.map((f) => URL.createObjectURL(f));
    setPostData((p) => ({
      ...p,
      imageFiles: [...(p.imageFiles || []), ...limited].slice(0, 5),
      imagePreviews: [...(p.imagePreviews || []), ...previews].slice(0, 5),
    }));
  };

  const handleChangeCover = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !isOwner) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("coverImage", file);
      await updateGarage({ garageId: id, formData }).unwrap();
      toast.success("Cover image updated");
    } catch (err) {
      toast.error(err?.message || "Failed to update cover");
    }
    e.target.value = "";
  };

  const handleRemovePostImage = (index) => {
    setPostData((p) => {
      const newFiles = [...(p.imageFiles || [])];
      const newPreviews = [...(p.imagePreviews || [])];
      if (p.imagePreviews?.[index]?.startsWith("blob:")) {
        URL.revokeObjectURL(p.imagePreviews[index]);
      }
      newFiles.splice(index, 1);
      newPreviews.splice(index, 1);
      return { ...p, imageFiles: newFiles, imagePreviews: newPreviews };
    });
  };

  const handleAddCar = async () => {
    if (!carData.make?.trim() || !carData.model?.trim()) {
      toast.error("Make and model are required");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("make", carData.make);
      formData.append("model", carData.model);
      formData.append("year", String(carData.year));
      if (carData.color) formData.append("color", carData.color);
      for (const file of carData.imageFiles || []) {
        formData.append("images", file);
      }
      await addCar({ garageId: id, formData }).unwrap();
      toast.success("Car added");
      setCarDialogOpen(false);
      setCarData({ make: "", model: "", year: new Date().getFullYear(), color: "", imageFiles: [], imagePreviews: [] });
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to add car");
    }
  };

  const handleCarImagesSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => f.type.startsWith("image/"));
    if (valid.length !== files.length) {
      toast.error("Only image files are allowed");
    }
    const limited = valid.slice(0, 5);
    if (valid.length > 5) {
      toast.info("Maximum 5 images. Only first 5 will be used.");
    }
    const previews = limited.map((f) => URL.createObjectURL(f));
    setCarData((p) => ({
      ...p,
      imageFiles: [...(p.imageFiles || []), ...limited].slice(0, 5),
      imagePreviews: [...(p.imagePreviews || []), ...previews].slice(0, 5),
    }));
  };

  const handleRemoveCarImage = (index) => {
    setCarData((p) => {
      const newFiles = [...(p.imageFiles || [])];
      const newPreviews = [...(p.imagePreviews || [])];
      if (p.imagePreviews?.[index]?.startsWith("blob:")) {
        URL.revokeObjectURL(p.imagePreviews[index]);
      }
      newFiles.splice(index, 1);
      newPreviews.splice(index, 1);
      return { ...p, imageFiles: newFiles, imagePreviews: newPreviews };
    });
  };

  const handleOpenEditCar = (car) => {
    setEditingCar(car);
    setEditCarData({
      make: car.make || "",
      model: car.model || "",
      year: car.year || new Date().getFullYear(),
      color: car.color || "",
      imageFiles: [],
      imagePreviews: (car.media || []).map((m) => m.mediaUrl).filter((u) => u),
    });
    setEditCarDialogOpen(true);
  };

  const handleEditCarImagesSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => f.type.startsWith("image/"));
    const limited = valid.slice(0, 5);
    const previews = limited.map((f) => URL.createObjectURL(f));
    setEditCarData((p) => ({
      ...p,
      imageFiles: [...(p.imageFiles || []), ...limited].slice(0, 5),
      imagePreviews: [...(p.imagePreviews || []), ...previews].slice(0, 5),
    }));
  };

  const handleRemoveEditCarImage = (index) => {
    setEditCarData((p) => {
      const newFiles = [...(p.imageFiles || [])];
      const newPreviews = [...(p.imagePreviews || [])];
      if (p.imagePreviews?.[index]?.startsWith("blob:")) {
        URL.revokeObjectURL(p.imagePreviews[index]);
      }
      newFiles.splice(index, 1);
      newPreviews.splice(index, 1);
      return { ...p, imageFiles: newFiles, imagePreviews: newPreviews };
    });
  };

  const handleSaveEditCar = async () => {
    if (!editingCar || !editCarData.make?.trim() || !editCarData.model?.trim()) {
      toast.error("Make and model are required");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("make", editCarData.make);
      formData.append("model", editCarData.model);
      formData.append("year", String(editCarData.year));
      if (editCarData.color) formData.append("color", editCarData.color);
      // Existing saved image paths to keep (not blob: preview URLs)
      const keepPaths = (editCarData.imagePreviews || []).filter((u) => !u.startsWith("blob:"));
      for (const path of keepPaths) {
        formData.append("keepMediaUrls", path);
      }
      // New files to upload
      for (const file of editCarData.imageFiles || []) {
        formData.append("images", file);
      }
      await updateCar({ garageId: id, carId: editingCar.id, formData }).unwrap();
      toast.success("Car updated");
      setEditCarDialogOpen(false);
      setEditingCar(null);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to update car");
    }
  };

  const handleDeleteCar = async () => {
    if (!deleteCarConfirm) return;
    try {
      await deleteCar({ garageId: id, carId: deleteCarConfirm.id }).unwrap();
      toast.success("Car deleted");
      setDeleteCarConfirm(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete car");
    }
  };

  const handleDeletePost = async () => {
    if (!deletePostConfirm) return;
    try {
      await deletePost(deletePostConfirm.id).unwrap();
      toast.success("Post deleted");
      setDeletePostConfirm(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete post");
    }
  };

  const handleDeleteGarage = async () => {
    try {
      await deleteGarage(id).unwrap();
      toast.success("Garage deleted");
      setDeleteGarageConfirm(false);
      navigate("/garages");
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete garage");
    }
  };

  if (isLoading || isError || !garage) {
    return (
      <Box sx={{ py: 6, display: "flex", justifyContent: "center", minHeight: "50vh" }}>
        {isLoading ? <CircularProgress /> : <Typography color="error">Garage not found</Typography>}
      </Box>
    );
  }

  return (
    <Box sx={{ py: 3, px: 2, background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)", minHeight: "100%" }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            borderRadius: 2,
            overflow: "hidden",
            mb: 3,
            position: "relative",
            background: "linear-gradient(145deg, #334155 0%, #1e293b 100%)",
          }}
        >
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
            hidden
            onChange={handleChangeCover}
          />
          <Box
            component="img"
            src={resolveImageUrl(garage.coverImageUrl, "https://images.unsplash.com/photo-1492144654654-21b3c0398737?w=1200")}
            alt={garage.name}
            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1492144654654-21b3c0398737?w=1200"; }}
            sx={{ width: "100%", height: 200, objectFit: "cover" }}
          />
          {isOwner && (
            <Button
              size="small"
              startIcon={<PhotoCameraIcon />}
              onClick={() => coverInputRef.current?.click()}
              disabled={updatingCover}
              sx={{
                position: "absolute",
                top: 16,
                right: 16,
                bgcolor: "rgba(0,0,0,0.6)",
                color: "white",
                textTransform: "none",
                "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
                "&:disabled": { color: "rgba(255,255,255,0.7)" },
              }}
            >
              {updatingCover ? "Uploading..." : "Change cover"}
            </Button>
          )}
          <Box sx={{ p: 3, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ color: "white", fontWeight: 700, fontSize: { xs: "1.5rem", sm: "2.125rem" } }}>
                {garage.name}
              </Typography>
              <Typography sx={{ color: "#94a3b8", mt: 0.5 }}>{garage.description || "No description"}</Typography>
              <Typography variant="body2" sx={{ color: "#64748b", mt: 1 }}>
                {garage.followersCount} followers · {garage.postsCount} posts · {garage.carsCount} cars
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              {isOwner && (
                <Button
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteGarageConfirm(true)}
                  sx={{ borderRadius: 2, textTransform: "none", borderColor: "#f87171", color: "#f87171", "&:hover": { bgcolor: "rgba(239,68,68,0.1)", borderColor: "#ef4444" } }}
                >
                  Delete Garage
                </Button>
              )}
              {user && !isOwner && (
                showUnfollow ? (
                  <Button
                    variant="outlined"
                    startIcon={<PersonRemoveIcon />}
                    onClick={handleUnfollow}
                    disabled={followLoading || unfollowLoading}
                    sx={{ borderRadius: 2, textTransform: "none", borderColor: "#64748b", color: "#94a3b8" }}
                  >
                    Unfollow
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={<PersonAddIcon />}
                    onClick={handleFollow}
                    disabled={followLoading || unfollowLoading}
                    sx={{ borderRadius: 2, textTransform: "none" }}
                  >
                    Follow
                  </Button>
                )
              )}
              {!isOwner && (
                <Button
                  variant="outlined"
                  startIcon={<ChatIcon />}
                  onClick={handleContactOwner}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    borderColor: "#38bdf8",
                    color: "#38bdf8",
                    "&:hover": { borderColor: "#0ea5e9", color: "#0ea5e9", bgcolor: "rgba(56, 189, 248, 0.1)" },
                  }}
                >
                  Message Owner
                </Button>
              )}
            </Box>
          </Box>
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, "& .MuiTab-root": { color: "rgba(255,255,255,0.8)" } }}>
          <Tab label="Cars" />
          <Tab label="Posts" />
        </Tabs>

        {tab === 0 && (
          <Box>
            {isOwner && (
              <Button
                startIcon={<AddIcon />}
                variant="outlined"
                sx={{ mb: 2, borderColor: "#38bdf8", color: "#38bdf8", textTransform: "none" }}
                onClick={() => setCarDialogOpen(true)}
              >
                Add Car
              </Button>
            )}
            <Grid container spacing={2}>
              {cars.map((car) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={car.id} sx={{ display: "flex", minWidth: 0 }}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      backgroundColor: "#334155",
                      color: "white",
                      position: "relative",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      width: "100%",
                      maxWidth: 400,
                      minWidth: 0,
                      mx: "auto",
                      cursor: "pointer",
                      transition: "transform 0.2s, boxShadow 0.2s",
                      "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" },
                    }}
                    onClick={() => navigate(`/garages/${id}/cars/${car.id}`)}
                  >
                    {isOwner && (
                      <Box sx={{ position: "absolute", top: 8, right: 8, zIndex: 1, display: "flex", gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); handleOpenEditCar(car); }}
                          sx={{ bgcolor: "rgba(0,0,0,0.5)", color: "white", "&:hover": { bgcolor: "rgba(0,0,0,0.7)" } }}
                          title="Edit car"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); setDeleteCarConfirm(car); }}
                          sx={{ bgcolor: "rgba(0,0,0,0.5)", color: "#f87171", "&:hover": { bgcolor: "rgba(239,68,68,0.8)", color: "white" } }}
                          title="Delete car"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    )}
                    <Box sx={{ aspectRatio: "4/3", overflow: "hidden", flexShrink: 0 }}>
                      <CardMedia
                        component="img"
                        image={resolveImageUrl(car.media?.[0]?.mediaUrl || car.pictureUrl, "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400")}
                        alt={`${car.make} ${car.model}`}
                        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400"; }}
                        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </Box>
                    <CardContent sx={{ flex: 1, py: 2, "&:last-child": { pb: 2 } }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {car.make} {car.model}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5 }}>
                        {car.year} · {car.color || "—"}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            {cars.length === 0 && (
              <Typography sx={{ color: "#94a3b8", py: 4, textAlign: "center" }}>No cars yet.</Typography>
            )}
          </Box>
        )}

        {tab === 1 && (
          <Box>
            {isOwner && (
              <Button
                startIcon={<AddIcon />}
                variant="outlined"
                sx={{ mb: 2, borderColor: "#38bdf8", color: "#38bdf8", textTransform: "none" }}
                onClick={() => setPostDialogOpen(true)}
              >
                Create Post
              </Button>
            )}
            <Grid container spacing={2}>
              {posts.map((post) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={post.id} sx={{ display: "flex", minWidth: 0 }}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      backgroundColor: "#334155",
                      color: "white",
                      cursor: "pointer",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      width: "100%",
                      maxWidth: 400,
                      minWidth: 0,
                      mx: "auto",
                      position: "relative",
                      transition: "transform 0.2s, boxShadow 0.2s",
                      "&:hover": { transform: "translateY(-2px)", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" },
                    }}
                    onClick={() => navigate(`/posts/${post.id}`)}
                  >
                    {isOwner && (
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); setDeletePostConfirm(post); }}
                        sx={{ position: "absolute", top: 8, right: 8, zIndex: 1, bgcolor: "rgba(0,0,0,0.5)", color: "#f87171", "&:hover": { bgcolor: "rgba(239,68,68,0.8)", color: "white" } }}
                        title="Delete post"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                    <Box sx={{ aspectRatio: "4/3", overflow: "hidden", flexShrink: 0 }}>
                      <CardMedia
                        component="img"
                        image={resolveImageUrl(post.media?.[0]?.mediaUrl, "https://images.unsplash.com/photo-1492144654654-21b3c0398737?w=400")}
                        alt=""
                        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1492144654654-21b3c0398737?w=400"; }}
                        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </Box>
                    <CardContent sx={{ flex: 1, py: 2, "&:last-child": { pb: 2 } }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {post.title || "Untitled"}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5 }}>
                        {post.likesCount} likes · {post.commentsCount} comments
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            {posts.length === 0 && (
              <Typography sx={{ color: "#94a3b8", py: 4, textAlign: "center" }}>No posts yet.</Typography>
            )}
          </Box>
        )}
      </Container>

      <Dialog
        open={postDialogOpen}
        onClose={() => setPostDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        slotProps={{
          paper: { sx: { backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.08)" } },
        }}
      >
        <DialogTitle sx={{ color: "white" }}>Create Post</DialogTitle>
        <DialogContent>
          {/* Post images upload */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: "#94a3b8", mb: 1 }}>
              Images (optional, max 5)
            </Typography>
            <input
              ref={postImageInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              multiple
              hidden
              onChange={handlePostImagesSelect}
            />
            {postData.imagePreviews?.length > 0 ? (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {postData.imagePreviews.map((url, idx) => (
                  <Box key={idx} sx={{ position: "relative" }}>
                    <Box
                      component="img"
                      src={url}
                      alt={`Preview ${idx + 1}`}
                      sx={{ width: 80, height: 80, objectFit: "cover", borderRadius: 1 }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleRemovePostImage(idx)}
                      sx={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        bgcolor: "rgba(0,0,0,0.7)",
                        color: "white",
                        width: 24,
                        height: 24,
                        "&:hover": { bgcolor: "rgba(255,0,0,0.8)" },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                ))}
                {postData.imagePreviews?.length < 5 && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => postImageInputRef.current?.click()}
                    sx={{
                      width: 80,
                      height: 80,
                      borderStyle: "dashed",
                      borderColor: "rgba(255,255,255,0.3)",
                      color: "#94a3b8",
                      minWidth: 0,
                    }}
                  >
                    <PhotoCameraIcon />
                  </Button>
                )}
              </Box>
            ) : (
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PhotoCameraIcon />}
                onClick={() => postImageInputRef.current?.click()}
                sx={{
                  py: 1.5,
                  borderStyle: "dashed",
                  borderColor: "rgba(255,255,255,0.3)",
                  color: "#94a3b8",
                  "&:hover": { borderColor: "#38bdf8", color: "#38bdf8" },
                }}
              >
                Add images
              </Button>
            )}
          </Box>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            required
            value={postData.title}
            onChange={(e) => setPostData((p) => ({ ...p, title: e.target.value }))}
            sx={{ "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "rgba(255,255,255,0.2)" } }, "& .MuiInputLabel-root": { color: "#94a3b8" } }}
          />
          <TextField margin="dense" label="Caption" fullWidth multiline value={postData.caption} onChange={(e) => setPostData((p) => ({ ...p, caption: e.target.value }))} sx={{ "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "rgba(255,255,255,0.2)" } }, "& .MuiInputLabel-root": { color: "#94a3b8" } }} />
          <TextField margin="dense" label="Content" fullWidth multiline rows={3} value={postData.content} onChange={(e) => setPostData((p) => ({ ...p, content: e.target.value }))} sx={{ "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "rgba(255,255,255,0.2)" } }, "& .MuiInputLabel-root": { color: "#94a3b8" } }} />
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <Button onClick={() => setPostDialogOpen(false)} sx={{ color: "#94a3b8" }}>Cancel</Button>
          <Button onClick={handleCreatePost} variant="contained" disabled={postCreating} sx={{ backgroundColor: "#38bdf8", "&:hover": { backgroundColor: "#0ea5e9" } }}>
            {postCreating ? <CircularProgress size={24} /> : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={carDialogOpen}
        onClose={() => {
          (carData.imagePreviews || []).forEach((url) => {
            if (url?.startsWith?.("blob:")) URL.revokeObjectURL(url);
          });
          setCarDialogOpen(false);
          setCarData({ make: "", model: "", year: new Date().getFullYear(), color: "", imageFiles: [], imagePreviews: [] });
        }}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        slotProps={{
          paper: { sx: { backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.08)" } },
        }}
      >
        <DialogTitle sx={{ color: "white" }}>Add Car</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: "#94a3b8", mb: 1 }}>
              Images (optional, max 5)
            </Typography>
            <input
              ref={carImageInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              multiple
              hidden
              onChange={handleCarImagesSelect}
            />
            {carData.imagePreviews?.length > 0 ? (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {carData.imagePreviews.map((url, idx) => (
                  <Box key={idx} sx={{ position: "relative" }}>
                    <Box
                      component="img"
                      src={url}
                      alt={`Preview ${idx + 1}`}
                      sx={{ width: 80, height: 80, objectFit: "cover", borderRadius: 1 }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveCarImage(idx)}
                      sx={{ position: "absolute", top: -8, right: -8, color: "#94a3b8", bgcolor: "#334155", "&:hover": { bgcolor: "#475569" } }}
                    >
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                ))}
                {carData.imagePreviews?.length < 5 && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => carImageInputRef.current?.click()}
                    sx={{
                      width: 80,
                      height: 80,
                      borderStyle: "dashed",
                      borderColor: "rgba(255,255,255,0.3)",
                      color: "#94a3b8",
                      minWidth: 0,
                    }}
                  >
                    <PhotoCameraIcon />
                  </Button>
                )}
              </Box>
            ) : (
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PhotoCameraIcon />}
                onClick={() => carImageInputRef.current?.click()}
                sx={{
                  py: 1.5,
                  borderStyle: "dashed",
                  borderColor: "rgba(255,255,255,0.3)",
                  color: "#94a3b8",
                  "&:hover": { borderColor: "#38bdf8", color: "#38bdf8" },
                }}
              >
                Add car images
              </Button>
            )}
          </Box>
          <TextField
            autoFocus
            margin="dense"
            label="Make"
            fullWidth
            required
            value={carData.make}
            onChange={(e) => setCarData((p) => ({ ...p, make: e.target.value }))}
            sx={{ "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "rgba(255,255,255,0.2)" } }, "& .MuiInputLabel-root": { color: "#94a3b8" } }}
          />
          <TextField margin="dense" label="Model" fullWidth required value={carData.model} onChange={(e) => setCarData((p) => ({ ...p, model: e.target.value }))} sx={{ "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "rgba(255,255,255,0.2)" } }, "& .MuiInputLabel-root": { color: "#94a3b8" } }} />
          <TextField
            margin="dense"
            label="Year"
            fullWidth
            type="number"
            value={carData.year}
            onChange={(e) => setCarData((p) => ({ ...p, year: e.target.value }))}
            sx={{ "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "rgba(255,255,255,0.2)" } }, "& .MuiInputLabel-root": { color: "#94a3b8" } }}
          />
          <TextField margin="dense" label="Color" fullWidth value={carData.color} onChange={(e) => setCarData((p) => ({ ...p, color: e.target.value }))} sx={{ "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "rgba(255,255,255,0.2)" } }, "& .MuiInputLabel-root": { color: "#94a3b8" } }} />
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <Button onClick={() => setCarDialogOpen(false)} sx={{ color: "#94a3b8" }}>Cancel</Button>
          <Button onClick={handleAddCar} variant="contained" disabled={carCreating} sx={{ backgroundColor: "#38bdf8", "&:hover": { backgroundColor: "#0ea5e9" } }}>
            {carCreating ? <CircularProgress size={24} /> : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Car Confirmation ── */}
      <Dialog
        open={!!deleteCarConfirm}
        onClose={() => setDeleteCarConfirm(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.08)" } } }}
      >
        <DialogTitle sx={{ color: "white", display: "flex", alignItems: "center", gap: 1 }}>
          <WarningAmberIcon sx={{ color: "#f87171" }} /> Delete Car
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#94a3b8" }}>
            Are you sure you want to delete <strong style={{ color: "white" }}>{deleteCarConfirm?.make} {deleteCarConfirm?.model}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <Button onClick={() => setDeleteCarConfirm(null)} sx={{ color: "#94a3b8" }}>Cancel</Button>
          <Button onClick={handleDeleteCar} variant="contained" disabled={carDeleting} sx={{ bgcolor: "#ef4444", "&:hover": { bgcolor: "#dc2626" } }}>
            {carDeleting ? <CircularProgress size={20} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Post Confirmation ── */}
      <Dialog
        open={!!deletePostConfirm}
        onClose={() => setDeletePostConfirm(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.08)" } } }}
      >
        <DialogTitle sx={{ color: "white", display: "flex", alignItems: "center", gap: 1 }}>
          <WarningAmberIcon sx={{ color: "#f87171" }} /> Delete Post
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#94a3b8" }}>
            Are you sure you want to delete <strong style={{ color: "white" }}>{deletePostConfirm?.title || "this post"}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <Button onClick={() => setDeletePostConfirm(null)} sx={{ color: "#94a3b8" }}>Cancel</Button>
          <Button onClick={handleDeletePost} variant="contained" disabled={postDeleting} sx={{ bgcolor: "#ef4444", "&:hover": { bgcolor: "#dc2626" } }}>
            {postDeleting ? <CircularProgress size={20} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Garage Confirmation ── */}
      <Dialog
        open={deleteGarageConfirm}
        onClose={() => setDeleteGarageConfirm(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.08)" } } }}
      >
        <DialogTitle sx={{ color: "white", display: "flex", alignItems: "center", gap: 1 }}>
          <WarningAmberIcon sx={{ color: "#f87171" }} /> Delete Garage
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "#94a3b8" }}>
            Are you sure you want to permanently delete <strong style={{ color: "white" }}>{garage?.name}</strong>? All cars, posts, and followers will be removed. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <Button onClick={() => setDeleteGarageConfirm(false)} sx={{ color: "#94a3b8" }}>Cancel</Button>
          <Button onClick={handleDeleteGarage} variant="contained" disabled={garageDeleting} sx={{ bgcolor: "#ef4444", "&:hover": { bgcolor: "#dc2626" } }}>
            {garageDeleting ? <CircularProgress size={20} /> : "Delete Garage"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editCarDialogOpen}
        onClose={() => {
          (editCarData.imagePreviews || []).forEach((url) => {
            if (url?.startsWith?.("blob:")) URL.revokeObjectURL(url);
          });
          setEditCarDialogOpen(false);
          setEditingCar(null);
        }}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        slotProps={{ paper: { sx: { backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.08)" } } }}
      >
        <DialogTitle sx={{ color: "white" }}>Edit Car</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: "#94a3b8", mb: 1 }}>Images (optional, max 5)</Typography>
            <input ref={editCarImageInputRef} type="file" accept="image/*" multiple hidden onChange={handleEditCarImagesSelect} />
            {editCarData.imagePreviews?.length > 0 ? (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {editCarData.imagePreviews.map((url, idx) => (
                  <Box key={idx} sx={{ position: "relative" }}>
                    <Box component="img" src={url} alt={`Preview ${idx + 1}`} sx={{ width: 80, height: 80, objectFit: "cover", borderRadius: 1 }} onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=80"; }} />
                    <IconButton size="small" onClick={() => handleRemoveEditCarImage(idx)} sx={{ position: "absolute", top: -8, right: -8, color: "#94a3b8", bgcolor: "#334155", "&:hover": { bgcolor: "#475569" } }}>
                      <CloseIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                ))}
                {editCarData.imagePreviews?.length < 5 && (
                  <Button size="small" variant="outlined" onClick={() => editCarImageInputRef.current?.click()} sx={{ width: 80, height: 80, borderStyle: "dashed", borderColor: "rgba(255,255,255,0.3)", color: "#94a3b8", minWidth: 0 }}>
                    <PhotoCameraIcon />
                  </Button>
                )}
              </Box>
            ) : (
              <Button fullWidth variant="outlined" startIcon={<PhotoCameraIcon />} onClick={() => editCarImageInputRef.current?.click()} sx={{ py: 1.5, borderStyle: "dashed", borderColor: "rgba(255,255,255,0.3)", color: "#94a3b8", "&:hover": { borderColor: "#38bdf8", color: "#38bdf8" } }}>
                Add car images
              </Button>
            )}
          </Box>
          <TextField autoFocus margin="dense" label="Make" fullWidth required value={editCarData.make} onChange={(e) => setEditCarData((p) => ({ ...p, make: e.target.value }))} sx={{ "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "rgba(255,255,255,0.2)" } }, "& .MuiInputLabel-root": { color: "#94a3b8" } }} />
          <TextField margin="dense" label="Model" fullWidth required value={editCarData.model} onChange={(e) => setEditCarData((p) => ({ ...p, model: e.target.value }))} sx={{ "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "rgba(255,255,255,0.2)" } }, "& .MuiInputLabel-root": { color: "#94a3b8" } }} />
          <TextField margin="dense" label="Year" fullWidth type="number" value={editCarData.year} onChange={(e) => setEditCarData((p) => ({ ...p, year: e.target.value }))} sx={{ "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "rgba(255,255,255,0.2)" } }, "& .MuiInputLabel-root": { color: "#94a3b8" } }} />
          <TextField margin="dense" label="Color" fullWidth value={editCarData.color} onChange={(e) => setEditCarData((p) => ({ ...p, color: e.target.value }))} sx={{ "& .MuiOutlinedInput-root": { color: "white", "& fieldset": { borderColor: "rgba(255,255,255,0.2)" } }, "& .MuiInputLabel-root": { color: "#94a3b8" } }} />
        </DialogContent>
        <DialogActions sx={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <Button onClick={() => setEditCarDialogOpen(false)} sx={{ color: "#94a3b8" }}>Cancel</Button>
          <Button onClick={handleSaveEditCar} variant="contained" disabled={carUpdating} sx={{ backgroundColor: "#38bdf8", "&:hover": { backgroundColor: "#0ea5e9" } }}>
            {carUpdating ? <CircularProgress size={24} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
