import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Box, Paper, BottomNavigation, BottomNavigationAction, Badge } from "@mui/material";
import Navbar from "./navbar";
import Sidebar from "./sidebar";
import { Dashboard, Home, Garage, Chat, Settings } from "@mui/icons-material";
import { useGetUnreadCountQuery } from "../redux/slices/chatApiSlice";

const mobileNavItems = [
  { path: "/dashboard", icon: <Dashboard />, label: "Dashboard" },
  { path: "/feed", icon: <Home />, label: "Feed" },
  { path: "/garages", icon: <Garage />, label: "Garages" },
  { path: "/chat", icon: <Chat />, label: "Messages" },
  { path: "/settings", icon: <Settings />, label: "Settings" },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: unreadData } = useGetUnreadCountQuery();
  const unreadCount = unreadData?.data?.unreadCount || 0;

  const currentValue =
    mobileNavItems.find(
      (item) =>
        location.pathname === item.path ||
        location.pathname.startsWith(item.path + "/")
    )?.path ?? false;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      <Navbar />
      <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar — desktop only */}
        <Box sx={{ display: { xs: "none", md: "block" }, flexShrink: 0 }}>
          <Sidebar />
        </Box>

        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: "auto",
            backgroundColor: "#0f172a",
            position: "relative",
            pb: { xs: 7, md: 0 },
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {/* Bottom navigation — mobile only */}
      <Paper
        elevation={0}
        sx={{
          display: { xs: "block", md: "none" },
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          zIndex: 1200,
          bgcolor: "#0f172a",
        }}
      >
        <BottomNavigation
          value={currentValue}
          onChange={(_, newValue) => navigate(newValue)}
          sx={{
            bgcolor: "#0f172a",
            height: 56,
            "& .MuiBottomNavigationAction-root": {
              color: "rgba(255,255,255,0.45)",
              minWidth: 0,
              padding: "6px 0",
            },
            "& .Mui-selected": { color: "#38bdf8 !important" },
            "& .MuiBottomNavigationAction-label": { fontSize: "0.62rem" },
          }}
        >
          {mobileNavItems.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              value={item.path}
              icon={
                item.path === "/chat" && unreadCount > 0 ? (
                  <Badge badgeContent={unreadCount} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )
              }
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
