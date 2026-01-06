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
        borderRight: 1,
        borderColor: "divider",
        backgroundColor: "#fafafa",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          backgroundColor: "white",
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main" }}>
            Messages
          </Typography>
          <IconButton
            size="small"
            onClick={onNewChat}
            sx={{
              backgroundColor: "primary.main",
              color: "white",
              "&:hover": { backgroundColor: "primary.dark" },
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
                  <Search sx={{ color: "text.secondary", fontSize: 20 }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              backgroundColor: "#f5f5f5",
              "& fieldset": { border: "none" },
            },
          }}
        />
      </Box>

      {/* Chat List */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography color="error" variant="body2">
              Failed to load chats
            </Typography>
          </Box>
        ) : filteredChats.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography color="text.secondary" variant="body2">
              {searchQuery ? "No chats found" : "No conversations yet"}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
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


