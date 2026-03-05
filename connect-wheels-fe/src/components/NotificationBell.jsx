import { useState } from "react";
import {
  IconButton,
  Badge,
  Popover,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  Button,
  CircularProgress,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { useNavigate } from "react-router-dom";
import {
  useGetNotificationsQuery,
  useGetNotificationUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "../redux/slices/garageApiSlice";
import { useGetUnreadCountQuery } from "../redux/slices/chatApiSlice";
import { useGetAllUsersQuery } from "../redux/slices/apiSlice";
import { useSelector } from "react-redux";

function formatTimeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const sec = Math.floor((now - date) / 1000);
  if (sec < 60) return "Just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
  return date.toLocaleDateString();
}

function getNotificationIcon(type) {
  switch (type) {
    case "POST_LIKE":
      return <FavoriteIcon sx={{ fontSize: 20, color: "#f87171" }} />;
    case "POST_COMMENT":
      return <ChatBubbleIcon sx={{ fontSize: 20, color: "#38bdf8" }} />;
    case "GARAGE_FOLLOW":
      return <PersonAddIcon sx={{ fontSize: 20, color: "#4ade80" }} />;
    default:
      return <NotificationsIcon sx={{ fontSize: 20 }} />;
  }
}

function getNotificationText(n, usersMap = {}) {
  const u = usersMap[n.data?.actorUserId];
  const actor = u
    ? [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email?.split("@")[0] || "Someone"
    : "Someone";
  switch (n.type) {
    case "POST_LIKE":
      return `${actor} liked your post${n.data?.postTitle ? ` "${n.data.postTitle}"` : ""}`;
    case "POST_COMMENT":
      return `${actor} commented on your post${n.data?.postTitle ? ` "${n.data.postTitle}"` : ""}`;
    case "GARAGE_FOLLOW":
      return `${actor} started following your garage${n.data?.garageName ? ` "${n.data.garageName}"` : ""}`;
    default:
      return "New notification";
  }
}

function getNotificationLink(n) {
  if (n.type === "POST_LIKE" || n.type === "POST_COMMENT") {
    return n.data?.postId ? `/posts/${n.data.postId}` : null;
  }
  if (n.type === "GARAGE_FOLLOW") {
    return n.data?.garageId ? `/garages/${n.data.garageId}` : null;
  }
  return null;
}

export default function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);

  const { data: usersData } = useGetAllUsersQuery(undefined, { skip: !anchorEl });
  const usersMap = (usersData?.users || []).reduce((acc, u) => {
    if (u?.id) acc[u.id] = u;
    return acc;
  }, {});

  const { data: countData } = useGetNotificationUnreadCountQuery(undefined, {
    skip: !user?.id,
    pollingInterval: 60000,
  });
  const { data: chatUnreadData } = useGetUnreadCountQuery(undefined, {
    skip: !user?.id,
    pollingInterval: 30000,
  });
  const { data: notificationsData, isLoading } = useGetNotificationsQuery(
    { page: 1, limit: 15 },
    { skip: !user?.id || !anchorEl }
  );
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const notificationUnread = countData?.data?.unreadCount ?? 0;
  const messageUnread = chatUnreadData?.data?.unreadCount ?? 0;
  const unreadCount = notificationUnread + messageUnread;
  const notifications = notificationsData?.notifications ?? [];

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleNotificationClick = async (n) => {
    const link = getNotificationLink(n);
    if (link) navigate(link);
    if (!n.read) await markRead(n.id).catch(() => {});
    handleClose();
  };

  const handleMarkAllRead = async () => {
    await markAllRead().catch(() => {});
  };

  if (!user?.id) return null;

  return (
    <>
      <IconButton onClick={handleOpen} sx={{ color: "rgba(255,255,255,0.9)" }} size="medium">
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              width: 360,
              maxHeight: 420,
              backgroundColor: "#1e293b",
              border: "1px solid rgba(255,255,255,0.08)",
            },
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>
              Notifications
            </Typography>
            {notificationUnread > 0 && (
              <Button
                size="small"
                onClick={handleMarkAllRead}
                sx={{ color: "#38bdf8", textTransform: "none" }}
              >
                Mark all read
              </Button>
            )}
          </Box>
        </Box>
        <List sx={{ py: 0 }}>
          {messageUnread > 0 && (
            <ListItemButton
              onClick={() => { navigate("/chat"); handleClose(); }}
              sx={{
                py: 1.5,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                backgroundColor: "rgba(56, 189, 248, 0.12)",
                "&:hover": { backgroundColor: "rgba(56, 189, 248, 0.2)" },
              }}
            >
              <Box sx={{ mr: 2, mt: 0.5 }}>
                <ChatBubbleIcon sx={{ fontSize: 20, color: "#38bdf8" }} />
              </Box>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ color: "white", fontWeight: 600 }}>
                    You have {messageUnread} unread message{messageUnread !== 1 ? "s" : ""}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                    Click to view messages
                  </Typography>
                }
              />
            </ListItemButton>
          )}
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={24} sx={{ color: "#38bdf8" }} />
            </Box>
          ) : notifications.length === 0 && messageUnread === 0 ? (
            <Typography sx={{ color: "#64748b", py: 4, px: 2, textAlign: "center" }}>
              No notifications yet
            </Typography>
          ) : notifications.length > 0 ? (
            notifications.map((n) => (
              <ListItemButton
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                sx={{
                  py: 1.5,
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  backgroundColor: n.read ? "transparent" : "rgba(56, 189, 248, 0.08)",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" },
                }}
              >
                <Box sx={{ mr: 2, mt: 0.5 }}>{getNotificationIcon(n.type)}</Box>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ color: "white" }}>
                      {getNotificationText(n, usersMap)}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" sx={{ color: "#64748b" }}>
                      {formatTimeAgo(n.createdAt)}
                    </Typography>
                  }
                />
              </ListItemButton>
            ))
          ) : null}
        </List>
      </Popover>
    </>
  );
}
