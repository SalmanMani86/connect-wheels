import { Link, useLocation } from "react-router-dom";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
} from "@mui/material";
import {
  Dashboard,
  Chat,
  Settings,
  Home,
  Garage,
} from "@mui/icons-material";
import { useGetUnreadCountQuery } from "../redux/slices/chatApiSlice";

export default function Sidebar() {
  const location = useLocation();
  const { data: unreadData } = useGetUnreadCountQuery();
  const unreadCount = unreadData?.data?.unreadCount || 0;

  const menuItems = [
    { text: "Dashboard", icon: <Dashboard />, path: "/dashboard" },
    { text: "Feed", icon: <Home />, path: "/feed" },
    { text: "Garages", icon: <Garage />, path: "/garages" },
    { text: "Messages", icon: <Chat />, path: "/chat", badge: unreadCount },
    { text: "Settings", icon: <Settings />, path: "/settings" },
  ];

  return (
    <Box
      sx={{
        width: 260,
        height: "100%",
        background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Navigation */}
      <List sx={{ px: 1.5, pt: 2, pb: 1, flex: 1, overflow: "auto" }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                sx={{
                  borderRadius: 2,
                  backgroundColor: isActive ? "rgba(56, 189, 248, 0.15)" : "transparent",
                  color: isActive ? "#38bdf8" : "rgba(255,255,255,0.85)",
                  "&:hover": {
                    backgroundColor: isActive ? "rgba(56, 189, 248, 0.2)" : "rgba(255,255,255,0.06)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: "inherit",
                  }}
                >
                  {item.badge > 0 ? (
                    <Badge badgeContent={item.badge} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: isActive ? 600 : 400 }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}
