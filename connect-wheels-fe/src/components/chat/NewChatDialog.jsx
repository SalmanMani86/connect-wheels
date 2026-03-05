import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Box,
  Typography,
  CircularProgress,
  InputAdornment,
  Chip,
} from "@mui/material";
import { Search, Person } from "@mui/icons-material";
import { useGetAllUsersQuery } from "../../redux/slices/apiSlice";
import { useSelector } from "react-redux";

export default function NewChatDialog({
  open,
  onClose,
  onCreate,
  isLoading,
  error,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const { user: currentUser } = useSelector((state) => state.user);

  // Fetch all users
  const { data: usersData, isLoading: isLoadingUsers } = useGetAllUsersQuery(undefined, {
    skip: !open,
  });

  const allUsers = usersData?.users || [];

  // Filter users based on search query and exclude current user
  const filteredUsers = allUsers.filter((user) => {
    if (!user || user.id === currentUser?.id) return false;
    
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
    const email = (user.email || "").toLowerCase();
    const userId = String(user.id || "").toLowerCase();
    
    return (
      fullName.includes(searchLower) ||
      email.includes(searchLower) ||
      userId.includes(searchLower)
    );
  });

  const handleCreate = () => {
    if (selectedUser) {
      onCreate(selectedUser.id);
      setSearchQuery("");
      setSelectedUser(null);
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setSelectedUser(null);
    onClose();
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
  };

  const getUserInitials = (user) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName) {
      return user.firstName[0].toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = (user) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user.email || `User ${user.id}`;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            backgroundColor: "#1e293b",
            border: "1px solid rgba(255,255,255,0.08)",
          },
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 600, pb: 1, color: "white" }}>
        Start New Conversation
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error?.data?.message || "Failed to create chat"}
          </Alert>
        )}

        {/* Search Input */}
        <TextField
          autoFocus
          fullWidth
          placeholder="Search by name, email, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "#94a3b8" }} />
                </InputAdornment>
              ),
              sx: { color: "white" },
            },
          }}
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              backgroundColor: "#334155",
              "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
              "&:hover fieldset": { borderColor: "rgba(255,255,255,0.25)" },
              "&.Mui-focused fieldset": { borderColor: "#38bdf8" },
            },
          }}
        />

        {/* Selected User Chip */}
        {selectedUser && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ mb: 1, display: "block", color: "#94a3b8" }}>
              Selected:
            </Typography>
            <Chip
              avatar={<Avatar sx={{ bgcolor: "#475569" }}>{getUserInitials(selectedUser)}</Avatar>}
              label={getUserDisplayName(selectedUser)}
              onDelete={() => setSelectedUser(null)}
              sx={{
                fontWeight: 500,
                backgroundColor: "rgba(56, 189, 248, 0.2)",
                color: "#38bdf8",
                "& .MuiChip-deleteIcon": { color: "#94a3b8" },
              }}
            />
          </Box>
        )}

        {/* User List */}
        <Box
          sx={{
            maxHeight: 400,
            overflow: "auto",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 2,
            backgroundColor: "#0f172a",
          }}
        >
          {isLoadingUsers ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={32} sx={{ color: "#38bdf8" }} />
            </Box>
          ) : filteredUsers.length === 0 ? (
            <Box sx={{ py: 4, px: 2, textAlign: "center" }}>
              <Person sx={{ fontSize: 48, color: "#64748b", mb: 1 }} />
              <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                {searchQuery ? "No users found" : "No users available"}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
                {searchQuery ? "Try a different search term" : ""}
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {filteredUsers.map((user) => (
                <ListItem
                  key={user.id}
                  disablePadding
                  sx={{
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    "&:last-child": { borderBottom: 0 },
                  }}
                >
                  <ListItemButton
                    onClick={() => handleSelectUser(user)}
                    selected={selectedUser?.id === user.id}
                    sx={{
                      py: 1.5,
                      "&.Mui-selected": {
                        backgroundColor: "rgba(56, 189, 248, 0.15)",
                        "&:hover": { backgroundColor: "rgba(56, 189, 248, 0.2)" },
                      },
                      "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          backgroundColor: "#475569",
                          color: "white",
                          fontWeight: 600,
                        }}
                      >
                        {getUserInitials(user)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" sx={{ fontWeight: 500, color: "white" }}>
                          {getUserDisplayName(user)}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                          {user.email} • ID: {user.id}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        <Typography variant="caption" sx={{ mt: 2, display: "block", color: "#64748b" }}>
          Select a user from the list to start chatting
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <Button onClick={handleClose} disabled={isLoading} sx={{ color: "#94a3b8" }}>
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={!selectedUser || isLoading}
          startIcon={isLoading ? <CircularProgress size={16} sx={{ color: "white" }} /> : null}
          sx={{
            backgroundColor: "#38bdf8",
            "&:hover": { backgroundColor: "#0ea5e9" },
            "&:disabled": { backgroundColor: "#475569", color: "#64748b" },
          }}
        >
          {isLoading ? "Creating..." : "Start Chat"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

