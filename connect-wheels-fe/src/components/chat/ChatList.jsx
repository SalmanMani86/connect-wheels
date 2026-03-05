import { useState } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Badge,
  TextField,
  InputAdornment,
  CircularProgress,
  Paper,
  IconButton,
  Divider,
} from "@mui/material";
import { Search, Add, MoreVert } from "@mui/icons-material";
import { useGetUserChatsQuery } from "../../redux/slices/chatApiSlice";
import { useSelector } from "react-redux";
import ChatListItem from "./ChatListItem";

export default function ChatList({ selectedChatId, onChatSelect, onNewChat }) {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useSelector((state) => state.user);
  const { data, isLoading, error } = useGetUserChatsQuery({ page: 1, limit: 50 });

  const chats = data?.chats || [];

  // Filter chats based on search query
  const filteredChats = chats.filter((chat) => {
    const otherUserId = chat.participants.find((p) => p !== user?.id);
    return otherUserId?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatTime = (date) => {
    if (!date) return "";
    const messageDate = new Date(date);
    const now = new Date();
    const diffMs = now - messageDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return messageDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getOtherUserId = (participants) => {
    // Ensure we're comparing the same types (both as strings)
    const otherUserId = participants.find((p) => String(p) !== String(user?.id));
    console.log("Finding other user:", { participants, currentUserId: user?.id, found: otherUserId });
    return otherUserId || null;
  };

  const getUnreadCount = (chat) => {
    return chat.unreadCount?.[user?.id] || 0;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        backgroundColor: "#1e293b",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          backgroundColor: "#334155",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#38bdf8" }}>
            Messages
          </Typography>
          <IconButton
            size="small"
            onClick={onNewChat}
            sx={{
              backgroundColor: "#38bdf8",
              color: "white",
              "&:hover": { backgroundColor: "#0ea5e9" },
            }}
          >
            <Add />
          </IconButton>
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "#94a3b8", fontSize: 20 }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              backgroundColor: "rgba(0,0,0,0.2)",
              color: "white",
              "& fieldset": { borderColor: "rgba(255,255,255,0.2)" },
              "& input::placeholder": { color: "rgba(255,255,255,0.5)" },
            },
          }}
        />
      </Box>

      {/* Chat List */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress sx={{ color: "#38bdf8" }} />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography sx={{ color: "#f87171" }} variant="body2">
              Failed to load chats
            </Typography>
          </Box>
        ) : filteredChats.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography sx={{ color: "#94a3b8" }} variant="body2">
              {searchQuery ? "No chats found" : "No conversations yet"}
            </Typography>
            <Typography variant="caption" sx={{ color: "#64748b", mt: 1, display: "block" }}>
              Start a new conversation
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredChats.map((chat) => {
              const otherUserId = getOtherUserId(chat.participants);
              const unreadCount = getUnreadCount(chat);
              const isSelected = selectedChatId === chat.id;

              return (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  otherUserId={otherUserId}
                  unreadCount={unreadCount}
                  isSelected={isSelected}
                  onSelect={onChatSelect}
                  formatTime={formatTime}
                />
              );
            })}
          </List>
        )}
      </Box>
    </Paper>
  );
}


