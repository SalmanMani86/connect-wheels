import { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Chip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useGetCarQuery, useGetGarageQuery } from "../redux/slices/garageApiSlice";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { resolveImageUrl } from "../utils/imageUrl";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800";

export default function CarDetailPage() {
  const { garageId, carId } = useParams();
  const navigate = useNavigate();
  const garageIdNum = parseInt(garageId, 10);
  const carIdNum = parseInt(carId, 10);
  const { user } = useSelector((state) => state.user);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: carData, isLoading: carLoading, isError: carError } = useGetCarQuery(
    { garageId: garageIdNum, carId: carIdNum },
    { skip: !garageIdNum || !carIdNum }
  );
  const { data: garageData } = useGetGarageQuery(garageIdNum, { skip: !garageIdNum });

  const car = carData?.car;
  const garage = garageData?.garage;
  const images = car?.media?.length ? car.media.map((m) => m.mediaUrl) : car?.pictureUrl ? [car.pictureUrl] : [];
  const displayImages = images.length > 0 ? images : [FALLBACK_IMAGE];
  const currentImage = resolveImageUrl(displayImages[currentImageIndex], FALLBACK_IMAGE);
  const isOwner = garage && user && Number(garage.ownerId) === Number(user.id);

  const handlePrev = () => setCurrentImageIndex((i) => (i <= 0 ? displayImages.length - 1 : i - 1));
  const handleNext = () => setCurrentImageIndex((i) => (i >= displayImages.length - 1 ? 0 : i + 1));

  if (carLoading || carError || !car) {
    return (
      <Box sx={{ py: 6, display: "flex", justifyContent: "center", minHeight: "50vh" }}>
        {carLoading ? <CircularProgress sx={{ color: "white" }} /> : <Typography sx={{ color: "#f87171" }}>Car not found</Typography>}
      </Box>
    );
  }

  return (
    <Box sx={{ py: 3, px: 2, background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)", minHeight: "100%" }}>
      <Container maxWidth="lg">
        <Button sx={{ color: "#38bdf8", textTransform: "none", mb: 2 }} onClick={() => navigate(`/garages/${garageId}`)}>
          ← Back to {garage?.name || "Garage"}
        </Button>

        <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3 }}>
          {/* Image carousel - left / top */}
          <Box sx={{ flex: { xs: 1, md: "0 0 60%" }, maxWidth: { md: "60%" } }}>
            <Box
              sx={{
                position: "relative",
                borderRadius: 2,
                overflow: "hidden",
                backgroundColor: "#1e293b",
                aspectRatio: "4/3",
                maxHeight: "70vh",
              }}
            >
              <Box
                component="img"
                src={currentImage}
                alt={`${car.make} ${car.model}`}
                onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                sx={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
              {displayImages.length > 1 && (
                <>
                  <IconButton
                    onClick={handlePrev}
                    sx={{
                      position: "absolute",
                      left: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      bgcolor: "rgba(0,0,0,0.5)",
                      color: "white",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                    }}
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                  <IconButton
                    onClick={handleNext}
                    sx={{
                      position: "absolute",
                      right: 8,
                      top: "50%",
                      transform: "translateY(-50%)",
                      bgcolor: "rgba(0,0,0,0.5)",
                      color: "white",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                    }}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                  <Typography
                    variant="caption"
                    sx={{
                      position: "absolute",
                      bottom: 8,
                      right: 12,
                      bgcolor: "rgba(0,0,0,0.6)",
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      color: "rgba(255,255,255,0.9)",
                    }}
                  >
                    {currentImageIndex + 1} / {displayImages.length}
                  </Typography>
                </>
              )}
            </Box>
            {/* Thumbnails */}
            {displayImages.length > 1 && (
              <Box sx={{ display: "flex", gap: 1, mt: 1.5, overflowX: "auto", pb: 1 }}>
                {displayImages.map((url, idx) => (
                  <Box
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    sx={{
                      flexShrink: 0,
                      width: 72,
                      height: 54,
                      borderRadius: 1,
                      overflow: "hidden",
                      cursor: "pointer",
                      border: currentImageIndex === idx ? "3px solid #38bdf8" : "2px solid transparent",
                      opacity: currentImageIndex === idx ? 1 : 0.85,
                      "&:hover": { opacity: 1 },
                    }}
                  >
                    <Box
                      component="img"
                      src={resolveImageUrl(url, FALLBACK_IMAGE)}
                      alt=""
                      onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {/* Details - right / bottom */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, mb: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ color: "#94a3b8", mb: 0.5 }}>
                  {garage?.name || "Garage"}
                </Typography>
                <Typography variant="h4" sx={{ color: "white", fontWeight: 700 }}>
                  {car.make} {car.model}
                </Typography>
                <Typography variant="body1" sx={{ color: "#94a3b8", mt: 0.5 }}>
                  {car.year} {car.color ? `· ${car.color}` : ""}
                </Typography>
              </Box>
              {isOwner && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/garages/${garageId}`, { state: { editCarId: car.id } })}
                  sx={{ color: "#38bdf8", borderColor: "#38bdf8", textTransform: "none" }}
                >
                  Edit
                </Button>
              )}
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
              {car.color && <Chip label={car.color} size="small" sx={{ bgcolor: "rgba(56,189,248,0.2)", color: "#38bdf8" }} />}
              {car.engineType && <Chip label={car.engineType} size="small" sx={{ bgcolor: "rgba(74,222,128,0.2)", color: "#4ade80" }} />}
              {car.transmission && <Chip label={car.transmission} size="small" sx={{ bgcolor: "rgba(251,191,36,0.2)", color: "#fbbf24" }} />}
              {car.mileage != null && <Chip label={`${car.mileage} km`} size="small" sx={{ bgcolor: "rgba(167,139,250,0.2)", color: "#a78bfa" }} />}
            </Box>
            {car.description && (
              <Typography variant="body2" sx={{ color: "#cbd5e1", whiteSpace: "pre-wrap" }}>
                {car.description}
              </Typography>
            )}
            <Button
              variant="contained"
              size="medium"
              onClick={() => navigate(`/garages/${garageId}`)}
              sx={{ mt: 3, borderRadius: 2, textTransform: "none", bgcolor: "#38bdf8", "&:hover": { bgcolor: "#0ea5e9" } }}
            >
              View Garage
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
