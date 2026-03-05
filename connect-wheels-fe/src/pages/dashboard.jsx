import {
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Container,
} from "@mui/material";
import GarageIcon from "@mui/icons-material/Garage";
import ArticleIcon from "@mui/icons-material/Article";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import PeopleIcon from "@mui/icons-material/People";
import GroupIcon from "@mui/icons-material/Group";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AddIcon from "@mui/icons-material/Add";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useGetUserGaragesQuery } from "../redux/slices/garageApiSlice";
import { useGetFollowingQuery } from "../redux/slices/garageApiSlice";
import { resolveImageUrl } from "../utils/imageUrl";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getValidImageUrl(url) {
  return resolveImageUrl(url, null) || null;
}

const FALLBACK_COVER = "https://images.unsplash.com/photo-1492144654654-21b3c0398737?w=400";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);

  const { data: garagesData } = useGetUserGaragesQuery(
    { userId: user?.id, page: 1, limit: 6 },
    { skip: !user?.id }
  );
  const { data: followingData } = useGetFollowingQuery(
    { userId: user?.id, page: 1, limit: 10 },
    { skip: !user?.id }
  );

  const garages = garagesData?.garages ?? [];
  const following = followingData?.following ?? [];
  const totalGarages = garagesData?.total ?? garages.length;
  const totalFollowing = followingData?.pagination?.total ?? following.length;

  const totalPosts = garages.reduce((acc, g) => acc + (g.postsCount || 0), 0);
  const totalCars = garages.reduce((acc, g) => acc + (g.carsCount || 0), 0);
  const totalFollowers = garages.reduce((acc, g) => acc + (g.followersCount || 0), 0);
  const totalReach = totalFollowers + totalFollowing;

  const contentColors = { Garages: "#38bdf8", Posts: "#4ade80", Cars: "#fbbf24" };
  const contentPieData = [
    { name: "Garages", value: totalGarages, fill: contentColors.Garages },
    { name: "Posts", value: totalPosts, fill: contentColors.Posts },
    { name: "Cars", value: totalCars, fill: contentColors.Cars },
  ].filter((d) => d.value > 0);

  const garageActivityData = garages.slice(0, 8).map((g) => ({
    name: g.name?.length > 12 ? g.name.slice(0, 11) + "…" : g.name || "Garage",
    cars: g.carsCount || 0,
    posts: g.postsCount || 0,
  }));

  const stats = [
    { label: "Garages", value: totalGarages, icon: <GarageIcon />, color: "#38bdf8" },
    { label: "Posts", value: totalPosts, icon: <ArticleIcon />, color: "#4ade80" },
    { label: "Cars", value: totalCars, icon: <DirectionsCarIcon />, color: "#fbbf24" },
    { label: "Followers", value: totalFollowers, icon: <PeopleIcon />, color: "#a78bfa" },
    { label: "Following", value: totalFollowing, icon: <GroupIcon />, color: "#f472b6" },
  ];

  return (
    <Box
      sx={{
        minHeight: "100%",
        background: "linear-gradient(180deg, #0f172a 0%, #0c1222 50%, #1e293b 100%)",
        py: 3,
        px: 2,
      }}
    >
      <Container disableGutters maxWidth={false} sx={{ px: { xs: 2, sm: 3 } }}>
        {user && (
          <>
            {/* Hero / Welcome section - North Star metric */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                borderRadius: 3,
                background: "linear-gradient(135deg, #1e3a5f 0%, #1e293b 50%, #0f172a 100%)",
                border: "1px solid rgba(56, 189, 248, 0.2)",
                position: "relative",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "40%",
                  height: "100%",
                  background: "radial-gradient(ellipse at right, rgba(56,189,248,0.08) 0%, transparent 70%)",
                  pointerEvents: "none",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2, position: "relative" }}>
                <Box>
                  <Typography variant="h5" sx={{ color: "white", fontWeight: 700 }}>
                    {getTimeGreeting()}!
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5 }}>
                    Here&apos;s your activity overview
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      px: 2.5,
                      py: 1.5,
                      borderRadius: 2,
                      background: "rgba(56, 189, 248, 0.12)",
                      border: "1px solid rgba(56, 189, 248, 0.25)",
                    }}
                  >
                    <TrendingUpIcon sx={{ color: "#38bdf8", fontSize: 28 }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: "#94a3b8", display: "block" }}>
                        Total Reach
                      </Typography>
                      <Typography variant="h5" sx={{ color: "#38bdf8", fontWeight: 700 }}>
                        {totalReach}
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate("/settings")}
                    sx={{
                      borderColor: "rgba(255,255,255,0.3)",
                      color: "#94a3b8",
                      textTransform: "none",
                      "&:hover": { borderColor: "#38bdf8", color: "#38bdf8", bgcolor: "rgba(56,189,248,0.08)" },
                    }}
                  >
                    Settings
                  </Button>
                </Box>
              </Box>
            </Paper>

            {/* Stats cards with icons */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {stats.map((s) => (
                <Grid size={{ xs: 6, sm: 4, md: 2 }} key={s.label}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      transition: "all 0.2s",
                      "&:hover": {
                        borderColor: `${s.color}40`,
                        background: `${s.color}08`,
                        transform: "translateY(-2px)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: `${s.color}20`,
                        color: s.color,
                      }}
                    >
                      {s.icon}
                    </Box>
                    <Box>
                      <Typography variant="h5" sx={{ color: "white", fontWeight: 700 }}>
                        {s.value}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748b" }}>
                        {s.label}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Charts section - full row width */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {/* Content Mix - what you've created (Garages / Posts / Cars only) */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: "100%",
                    minHeight: 340,
                    borderRadius: 3,
                    background: "linear-gradient(145deg, #1e293b 0%, #0f172a 100%)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
                  }}
                >
                  <Typography variant="h6" sx={{ color: "white", mb: 1, fontWeight: 600 }}>
                    Content Mix
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 2 }}>
                    Breakdown of what you&apos;ve added (garages, posts, cars)
                  </Typography>
                  {contentPieData.length > 0 ? (
                    <Box sx={{ width: "100%", height: 280 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={contentPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="rgba(15,23,42,0.8)"
                            strokeWidth={2}
                            label={({ name, percent }) => (percent >= 0.1 ? `${name} ${(percent * 100).toFixed(0)}%` : "")}
                            labelLine={{ stroke: "#64748b", strokeWidth: 1 }}
                          >
                            {contentPieData.map((_, i) => (
                              <Cell key={i} fill={contentPieData[i].fill} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ payload }) => {
                              if (!payload?.length) return null;
                              const item = payload[0];
                              const total = contentPieData.reduce((s, d) => s + d.value, 0);
                              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                              return (
                                <Box sx={{ bgcolor: "#0f172a", border: "1px solid rgba(56,189,248,0.3)", borderRadius: 2, px: 2, py: 1.5, boxShadow: 2 }}>
                                  <Typography variant="body2" sx={{ color: "#e2e8f0", fontWeight: 600 }}>
                                    {item.name}: {item.value}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: "#38bdf8" }}>
                                    {pct}% of your content
                                  </Typography>
                                </Box>
                              );
                            }}
                          />
                          <Legend formatter={(v) => <span style={{ color: "#94a3b8", fontSize: 13 }}>{v}</span>} wrapperStyle={{ paddingTop: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Box sx={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 1 }}>
                      <Typography sx={{ color: "#64748b" }}>No content yet</Typography>
                      <Typography variant="caption" sx={{ color: "#475569" }}>Add garages, posts & cars to see the mix</Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Activity per Garage - different data (per-garage breakdown) */}
              <Grid size={{ xs: 12, md: 7 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: "100%",
                    minHeight: 340,
                    borderRadius: 3,
                    background: "linear-gradient(145deg, #1e293b 0%, #0f172a 100%)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
                  }}
                >
                  <Typography variant="h6" sx={{ color: "white", mb: 1, fontWeight: 600 }}>
                    Content per Garage
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 2 }}>
                    Cars and posts in each of your garages
                  </Typography>
                  {garages.length > 0 ? (
                    <Box sx={{ width: "100%", height: 280 }}>
                      <ResponsiveContainer>
                        <BarChart data={garageActivityData} layout="vertical" margin={{ top: 8, right: 24, left: 4, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                          <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <YAxis type="category" dataKey="name" width={100} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            content={({ payload }) => {
                              if (!payload?.length) return null;
                              const d = payload[0]?.payload;
                              if (!d) return null;
                              return (
                                <Box sx={{ bgcolor: "#0f172a", border: "1px solid rgba(56,189,248,0.3)", borderRadius: 2, px: 2, py: 1.5, boxShadow: 2 }}>
                                  <Typography variant="body2" sx={{ color: "white", fontWeight: 600 }}>{d.name}</Typography>
                                  <Typography variant="caption" sx={{ color: "#4ade80" }}>Cars: {d.cars}</Typography>
                                  <Typography variant="caption" sx={{ color: "#38bdf8", display: "block" }}>Posts: {d.posts}</Typography>
                                </Box>
                              );
                            }}
                            cursor={{ fill: "rgba(56,189,248,0.08)" }}
                          />
                          <Bar dataKey="cars" stackId="a" fill="#fbbf24" radius={[0, 0, 0, 0]} name="Cars" />
                          <Bar dataKey="posts" stackId="a" fill="#4ade80" radius={[0, 4, 4, 0]} name="Posts" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Box sx={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 1 }}>
                      <Typography sx={{ color: "#64748b" }}>No garage activity yet</Typography>
                      <Typography variant="caption" sx={{ color: "#475569" }}>Add cars and posts to your garages to see breakdown</Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>

            {/* My Garages section */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>
                  My Garages
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => navigate("/garages")}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    backgroundColor: "#38bdf8",
                    "&:hover": { backgroundColor: "#0ea5e9" },
                  }}
                >
                  Create Garage
                </Button>
              </Box>
              {garages.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 6,
                    borderRadius: 3,
                    textAlign: "center",
                    background: "rgba(255,255,255,0.02)",
                    border: "2px dashed rgba(255,255,255,0.1)",
                  }}
                >
                  <GarageIcon sx={{ fontSize: 64, color: "rgba(255,255,255,0.2)", mb: 2 }} />
                  <Typography sx={{ color: "#94a3b8", mb: 2, display: "block" }}>
                    You don&apos;t have any garages yet.
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#64748b", mb: 2, display: "block" }}>
                    Create your first garage to start sharing cars and posts with the community.
                  </Typography>
                  <Button
                    variant="contained"
                    size="medium"
                    startIcon={<AddIcon />}
                    onClick={() => navigate("/garages")}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      backgroundColor: "#38bdf8",
                      "&:hover": { backgroundColor: "#0ea5e9" },
                    }}
                  >
                    Create Garage
                  </Button>
                </Paper>
              ) : (
                <Grid container spacing={2}>
                  {garages.map((g) => {
                    const imgUrl = getValidImageUrl(g.coverImageUrl) || getValidImageUrl(g.pictureUrl);
                    return (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={g.id}>
                        <Card
                          sx={{
                            borderRadius: 3,
                            overflow: "hidden",
                            cursor: "pointer",
                            background: "#1e293b",
                            border: "1px solid rgba(255,255,255,0.06)",
                            transition: "all 0.25s ease",
                            "&:hover": {
                              transform: "translateY(-4px)",
                              boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
                              borderColor: "rgba(56, 189, 248, 0.3)",
                              "& .garage-overlay": { opacity: 1 },
                            },
                          }}
                          onClick={() => navigate(`/garages/${g.id}`)}
                        >
                          <Box sx={{ position: "relative" }}>
                            <CardMedia
                              component="img"
                              image={imgUrl || FALLBACK_COVER}
                              alt={g.name}
                              onError={(e) => { e.target.src = FALLBACK_COVER; }}
                              sx={{ height: 140, objectFit: "cover", transition: "transform 0.3s", "&:hover": { transform: "scale(1.02)" } }}
                            />
                            <Box
                              className="garage-overlay"
                              sx={{
                                position: "absolute",
                                inset: 0,
                                background: "linear-gradient(to top, rgba(15,23,42,0.95) 0%, transparent 50%)",
                                opacity: 0.6,
                                transition: "opacity 0.25s",
                              }}
                            />
                            <Box
                              sx={{
                                position: "absolute",
                                bottom: 12,
                                left: 16,
                                right: 16,
                              }}
                            >
                              <Typography variant="h6" sx={{ color: "white", fontWeight: 700 }}>
                                {g.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                                {g.followersCount} followers · {g.postsCount} posts · {g.carsCount} cars
                              </Typography>
                            </Box>
                          </Box>
                          <CardContent sx={{ py: 1.5 }}>
                            <Button
                              fullWidth
                              size="small"
                              sx={{
                                color: "#38bdf8",
                                textTransform: "none",
                                fontWeight: 600,
                                justifyContent: "flex-start",
                              }}
                            >
                              View Garage →
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
}
