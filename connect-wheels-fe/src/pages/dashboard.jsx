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
  LinearProgress,
  Chip,
} from "@mui/material";
import GarageIcon from "@mui/icons-material/Garage";
import ArticleIcon from "@mui/icons-material/Article";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import PeopleIcon from "@mui/icons-material/People";
import GroupIcon from "@mui/icons-material/Group";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import ExploreIcon from "@mui/icons-material/Explore";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  useGetUserGaragesQuery,
  useGetFollowingQuery,
  useSearchGaragesQuery,
} from "../redux/slices/garageApiSlice";
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
  const { data: discoverData } = useSearchGaragesQuery(
    { q: "", page: 1, limit: 6 },
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

  // --- Onboarding ---
  const onboardingSteps = [
    {
      label: "Create your first garage",
      description: "Your garage is your space — showcase your cars and posts",
      done: totalGarages > 0,
      action: () => navigate("/garages"),
      icon: <GarageIcon />,
      color: "#38bdf8",
    },
    {
      label: "Add a car",
      description: "Add your car with photos to your garage",
      done: totalCars > 0,
      action: () => navigate(garages[0] ? `/garages/${garages[0].id}` : "/garages"),
      icon: <DirectionsCarIcon />,
      color: "#fbbf24",
    },
    {
      label: "Share a post",
      description: "Share a story, build or update with the community",
      done: totalPosts > 0,
      action: () => navigate(garages[0] ? `/garages/${garages[0].id}` : "/garages"),
      icon: <ArticleIcon />,
      color: "#4ade80",
    },
    {
      label: "Follow a garage",
      description: "Discover other enthusiasts and follow their builds",
      done: totalFollowing > 0,
      action: () => navigate("/garages"),
      icon: <PeopleIcon />,
      color: "#a78bfa",
    },
  ];
  const completedSteps = onboardingSteps.filter((s) => s.done).length;
  const onboardingComplete = completedSteps === onboardingSteps.length;
  const showOnboarding = !onboardingComplete;

  // Discover: garages not owned by this user
  const discoverGarages = (discoverData?.garages ?? [])
    .filter((g) => Number(g.ownerId) !== Number(user?.id))
    .slice(0, 4);
  const showDiscover = totalFollowing === 0;

  // Charts
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

  const hasChartData = totalGarages > 0 || totalPosts > 0 || totalCars > 0;

  const stats = [
    {
      label: "Garages",
      value: totalGarages,
      icon: <GarageIcon />,
      color: "#38bdf8",
      cta: totalGarages === 0 ? "Create one" : null,
      onClick: () => navigate("/garages"),
    },
    {
      label: "Posts",
      value: totalPosts,
      icon: <ArticleIcon />,
      color: "#4ade80",
      cta: totalPosts === 0 && totalGarages > 0 ? "Write one" : null,
      onClick: () => navigate(garages[0] ? `/garages/${garages[0].id}` : "/garages"),
    },
    {
      label: "Cars",
      value: totalCars,
      icon: <DirectionsCarIcon />,
      color: "#fbbf24",
      cta: totalCars === 0 && totalGarages > 0 ? "Add one" : null,
      onClick: () => navigate(garages[0] ? `/garages/${garages[0].id}` : "/garages"),
    },
    {
      label: "Followers",
      value: totalFollowers,
      icon: <PeopleIcon />,
      color: "#a78bfa",
      cta: null,
      onClick: null,
    },
    {
      label: "Following",
      value: totalFollowing,
      icon: <GroupIcon />,
      color: "#f472b6",
      cta: totalFollowing === 0 ? "Discover" : null,
      onClick: () => navigate("/garages"),
    },
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
            {/* ── Hero ── */}
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
              <Box
                sx={{
                  display: "flex",
                  alignItems: { xs: "flex-start", sm: "center" },
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 2,
                  position: "relative",
                }}
              >
                <Box>
                  <Typography
                    variant="h5"
                    sx={{ color: "white", fontWeight: 700, fontSize: { xs: "1.2rem", sm: "1.5rem" } }}
                  >
                    {getTimeGreeting()},{" "}
                    <span style={{ color: "#38bdf8" }}>
                      {user?.firstName || user?.email?.split("@")[0] || "there"}
                    </span>
                    !
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5 }}>
                    {onboardingComplete
                      ? "Your garage is live — keep building!"
                      : `${completedSteps} of ${onboardingSteps.length} setup steps done`}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 } }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      px: { xs: 1.5, sm: 2.5 },
                      py: 1,
                      borderRadius: 2,
                      background: "rgba(56, 189, 248, 0.12)",
                      border: "1px solid rgba(56, 189, 248, 0.25)",
                    }}
                  >
                    <TrendingUpIcon sx={{ color: "#38bdf8", fontSize: { xs: 20, sm: 28 } }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: "#94a3b8", display: "block" }}>
                        Total Reach
                      </Typography>
                      <Typography sx={{ color: "#38bdf8", fontWeight: 700, fontSize: { xs: "1.1rem", sm: "1.5rem" } }}>
                        {totalReach}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Paper>

            {/* ── Onboarding Checklist ── */}
            {showOnboarding && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: 3,
                  background: "linear-gradient(145deg, #1e293b 0%, #0f172a 100%)",
                  border: "1px solid rgba(56,189,248,0.15)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                  <Box>
                    <Typography variant="h6" sx={{ color: "white", fontWeight: 700 }}>
                      Get Started
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      {completedSteps === 0
                        ? "Complete these steps to unlock the full experience"
                        : `${onboardingSteps.length - completedSteps} step${onboardingSteps.length - completedSteps > 1 ? "s" : ""} left`}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${completedSteps}/${onboardingSteps.length}`}
                    size="small"
                    sx={{ bgcolor: "rgba(56,189,248,0.15)", color: "#38bdf8", fontWeight: 700 }}
                  />
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={(completedSteps / onboardingSteps.length) * 100}
                  sx={{
                    mb: 2.5,
                    height: 6,
                    borderRadius: 3,
                    bgcolor: "rgba(255,255,255,0.06)",
                    "& .MuiLinearProgress-bar": { bgcolor: "#38bdf8", borderRadius: 3 },
                  }}
                />

                <Grid container spacing={1.5}>
                  {onboardingSteps.map((step, i) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={i}>
                      <Box
                        onClick={step.done ? undefined : step.action}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          p: 1.5,
                          borderRadius: 2,
                          border: `1px solid ${step.done ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.06)"}`,
                          bgcolor: step.done ? "rgba(74,222,128,0.05)" : "rgba(255,255,255,0.02)",
                          cursor: step.done ? "default" : "pointer",
                          transition: "all 0.2s",
                          "&:hover": step.done
                            ? {}
                            : { borderColor: `${step.color}40`, bgcolor: `${step.color}08` },
                        }}
                      >
                        <Box sx={{ color: step.done ? "#4ade80" : "rgba(255,255,255,0.2)", flexShrink: 0 }}>
                          {step.done ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: step.done ? "#64748b" : "white",
                              fontWeight: 600,
                              textDecoration: step.done ? "line-through" : "none",
                            }}
                          >
                            {step.label}
                          </Typography>
                          {!step.done && (
                            <Typography variant="caption" sx={{ color: "#475569" }}>
                              {step.description}
                            </Typography>
                          )}
                        </Box>
                        {!step.done && (
                          <Box sx={{ color: step.color, flexShrink: 0, opacity: 0.7 }}>
                            {step.icon}
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}

            {/* ── Quick Actions ── */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" sx={{ color: "#64748b", textTransform: "uppercase", letterSpacing: 1, mb: 1.5, display: "block" }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={() => navigate("/garages")}
                  sx={{ borderRadius: 2, textTransform: "none", bgcolor: "#38bdf8", "&:hover": { bgcolor: "#0ea5e9" } }}
                >
                  New Garage
                </Button>
                {garages.length > 0 && (
                  <Button
                    variant="outlined"
                    startIcon={<DirectionsCarIcon />}
                    size="small"
                    onClick={() => navigate(`/garages/${garages[0].id}`)}
                    sx={{ borderRadius: 2, textTransform: "none", borderColor: "#fbbf24", color: "#fbbf24", "&:hover": { bgcolor: "rgba(251,191,36,0.08)" } }}
                  >
                    Add Car
                  </Button>
                )}
                {garages.length > 0 && (
                  <Button
                    variant="outlined"
                    startIcon={<ArticleIcon />}
                    size="small"
                    onClick={() => navigate(`/garages/${garages[0].id}`)}
                    sx={{ borderRadius: 2, textTransform: "none", borderColor: "#4ade80", color: "#4ade80", "&:hover": { bgcolor: "rgba(74,222,128,0.08)" } }}
                  >
                    New Post
                  </Button>
                )}
                <Button
                  variant="outlined"
                  startIcon={<WhatshotIcon />}
                  size="small"
                  onClick={() => navigate("/feed/trending")}
                  sx={{ borderRadius: 2, textTransform: "none", borderColor: "#f472b6", color: "#f472b6", "&:hover": { bgcolor: "rgba(244,114,182,0.08)" } }}
                >
                  Trending
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ExploreIcon />}
                  size="small"
                  onClick={() => navigate("/garages")}
                  sx={{ borderRadius: 2, textTransform: "none", borderColor: "#a78bfa", color: "#a78bfa", "&:hover": { bgcolor: "rgba(167,139,250,0.08)" } }}
                >
                  Explore
                </Button>
              </Box>
            </Box>

            {/* ── Stats ── */}
            <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: 3 }}>
              {stats.map((s) => (
                <Grid size={{ xs: 6, sm: 4, md: 2 }} key={s.label}>
                  <Paper
                    elevation={0}
                    onClick={s.value === 0 && s.onClick ? s.onClick : undefined}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid ${s.value === 0 ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.06)"}`,
                      cursor: s.value === 0 && s.onClick ? "pointer" : "default",
                      transition: "all 0.2s",
                      "&:hover": s.value === 0 && s.onClick
                        ? { borderColor: `${s.color}50`, background: `${s.color}08`, transform: "translateY(-2px)" }
                        : { borderColor: `${s.color}40`, background: `${s.color}08`, transform: "translateY(-2px)" },
                    }}
                  >
                    <Box
                      sx={{
                        width: { xs: 36, sm: 44 },
                        height: { xs: 36, sm: 44 },
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: `${s.color}20`,
                        color: s.color,
                        flexShrink: 0,
                        opacity: s.value === 0 ? 0.5 : 1,
                      }}
                    >
                      {s.icon}
                    </Box>
                    <Box>
                      <Typography
                        sx={{
                          color: s.value === 0 ? "#475569" : "white",
                          fontWeight: 700,
                          fontSize: { xs: "1.1rem", sm: "1.4rem" },
                          lineHeight: 1.2,
                        }}
                      >
                        {s.value}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748b", display: "block" }}>
                        {s.label}
                      </Typography>
                      {s.cta && (
                        <Typography variant="caption" sx={{ color: s.color, fontWeight: 600 }}>
                          {s.cta} →
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* ── Charts (only when user has content) ── */}
            {hasChartData && (
              <Grid container spacing={3} sx={{ mb: 3 }}>
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
                    }}
                  >
                    <Typography variant="h6" sx={{ color: "white", mb: 0.5, fontWeight: 600 }}>
                      Content Mix
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 2 }}>
                      Breakdown of garages, posts &amp; cars you&apos;ve added
                    </Typography>
                    <Box sx={{ width: "100%", height: 300 }}>
                      <ResponsiveContainer>
                        <PieChart margin={{ top: 30, right: 20, bottom: 0, left: 20 }}>
                          <Pie
                            data={contentPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
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
                                <Box sx={{ bgcolor: "#0f172a", border: "1px solid rgba(56,189,248,0.3)", borderRadius: 2, px: 2, py: 1.5 }}>
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
                  </Paper>
                </Grid>

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
                    }}
                  >
                    <Typography variant="h6" sx={{ color: "white", mb: 0.5, fontWeight: 600 }}>
                      Content per Garage
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 2 }}>
                      Cars and posts in each of your garages
                    </Typography>
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
                                <Box sx={{ bgcolor: "#0f172a", border: "1px solid rgba(56,189,248,0.3)", borderRadius: 2, px: 2, py: 1.5 }}>
                                  <Typography variant="body2" sx={{ color: "white", fontWeight: 600 }}>{d.name}</Typography>
                                  <Typography variant="caption" sx={{ color: "#fbbf24" }}>Cars: {d.cars}</Typography>
                                  <Typography variant="caption" sx={{ color: "#4ade80", display: "block" }}>Posts: {d.posts}</Typography>
                                </Box>
                              );
                            }}
                            cursor={{ fill: "rgba(56,189,248,0.08)" }}
                          />
                          <Bar dataKey="cars" stackId="a" fill="#fbbf24" name="Cars" />
                          <Bar dataKey="posts" stackId="a" fill="#4ade80" radius={[0, 4, 4, 0]} name="Posts" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            )}

            {/* ── My Garages ── */}
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
                  sx={{ borderRadius: 2, textTransform: "none", backgroundColor: "#38bdf8", "&:hover": { backgroundColor: "#0ea5e9" } }}
                >
                  {garages.length === 0 ? "Create Garage" : "Manage"}
                </Button>
              </Box>
              {garages.length === 0 ? (
                <Paper
                  elevation={0}
                  onClick={() => navigate("/garages")}
                  sx={{
                    p: { xs: 4, sm: 5 },
                    borderRadius: 3,
                    textAlign: "center",
                    background: "rgba(56,189,248,0.03)",
                    border: "2px dashed rgba(56,189,248,0.2)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    "&:hover": { borderColor: "rgba(56,189,248,0.4)", background: "rgba(56,189,248,0.06)" },
                  }}
                >
                  <GarageIcon sx={{ fontSize: 48, color: "rgba(56,189,248,0.3)", mb: 1.5 }} />
                  <Typography sx={{ color: "#94a3b8", fontWeight: 600, mb: 0.5 }}>
                    No garages yet
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#475569" }}>
                    Click to create your first garage and start sharing
                  </Typography>
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
                              sx={{ height: 130, objectFit: "cover" }}
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
                            <Box sx={{ position: "absolute", bottom: 10, left: 14, right: 14 }}>
                              <Typography variant="subtitle1" sx={{ color: "white", fontWeight: 700, lineHeight: 1.2 }}>
                                {g.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                                {g.followersCount} followers · {g.postsCount} posts · {g.carsCount} cars
                              </Typography>
                            </Box>
                          </Box>
                          <CardContent sx={{ py: 1 }}>
                            <Button fullWidth size="small" sx={{ color: "#38bdf8", textTransform: "none", fontWeight: 600, justifyContent: "flex-start" }}>
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

            {/* ── Discover Garages (when not following anyone) ── */}
            {showDiscover && discoverGarages.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Box>
                    <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>
                      Discover Garages
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      Follow garages to see their posts in your feed
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    startIcon={<ExploreIcon />}
                    onClick={() => navigate("/garages")}
                    sx={{ color: "#a78bfa", textTransform: "none" }}
                  >
                    See all
                  </Button>
                </Box>
                <Grid container spacing={2}>
                  {discoverGarages.map((g) => {
                    const imgUrl = getValidImageUrl(g.coverImageUrl) || getValidImageUrl(g.pictureUrl);
                    return (
                      <Grid size={{ xs: 12, sm: 6, md: 3 }} key={g.id}>
                        <Card
                          sx={{
                            borderRadius: 2,
                            overflow: "hidden",
                            cursor: "pointer",
                            background: "#1e293b",
                            border: "1px solid rgba(255,255,255,0.06)",
                            transition: "all 0.2s",
                            "&:hover": { transform: "translateY(-2px)", borderColor: "rgba(167,139,250,0.3)" },
                          }}
                          onClick={() => navigate(`/garages/${g.id}`)}
                        >
                          <CardMedia
                            component="img"
                            image={imgUrl || FALLBACK_COVER}
                            alt={g.name}
                            onError={(e) => { e.target.src = FALLBACK_COVER; }}
                            sx={{ height: 110, objectFit: "cover" }}
                          />
                          <CardContent sx={{ py: 1.5 }}>
                            <Typography variant="subtitle2" sx={{ color: "white", fontWeight: 600, mb: 0.5 }}>
                              {g.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#64748b", display: "block", mb: 1 }}>
                              {g.followersCount} followers · {g.carsCount} cars
                            </Typography>
                            <Button
                              fullWidth
                              size="small"
                              variant="outlined"
                              onClick={(e) => { e.stopPropagation(); navigate(`/garages/${g.id}`); }}
                              sx={{
                                borderRadius: 1.5,
                                textTransform: "none",
                                borderColor: "rgba(167,139,250,0.4)",
                                color: "#a78bfa",
                                "&:hover": { bgcolor: "rgba(167,139,250,0.08)" },
                              }}
                            >
                              Visit
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}
