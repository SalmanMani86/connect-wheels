import { Link, useLocation } from "react-router-dom";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
} from "@mui/material";
import {
  Dashboard,
  Chat,
  Person,
  DirectionsCar,
  Settings,
} from "@mui/icons-material";
import { useGetUnreadCountQuery } from "../redux/slices/chatApiSlice";

export default function Sidebar() {
  const location = useLocation();
  const { data: unreadData } = useGetUnreadCountQuery();
  const unreadCount = unreadData?.data?.unreadCount || 0;

  const menuItems = [
    { text: "Dashboard", icon: <Dashboard />, path: "/dashboard" },
    { text: "Messages", icon: <Chat />, path: "/chat", badge: unreadCount },
    { text: "Profile", icon: <Person />, path: "/profile" },
    { text: "Rides", icon: <DirectionsCar />, path: "/rides" },
    { text: "Settings", icon: <Settings />, path: "/settings" },
  ];

  return (
    <Box
      sx={{
        width: 240,
        height: "100%",
        backgroundColor: "white",
        borderRight: 1,
        borderColor: "divider",
        pt: 2,
      }}
    >
      <List sx={{ px: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                sx={{
                  borderRadius: 2,
                  backgroundColor: isActive ? "primary.lighter" : "transparent",
                  color: isActive ? "primary.main" : "text.primary",
                  "&:hover": {
                    backgroundColor: isActive ? "primary.lighter" : "grey.100",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive ? "primary.main" : "text.secondary",
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
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 400,
                    fontSize: "0.95rem",
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider sx={{ my: 2 }} />
    </Box>
  );
}