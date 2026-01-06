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
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
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
                  <Search sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          }}
        />

        {/* Selected User Chip */}
        {selectedUser && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
              Selected:
            </Typography>
            <Chip
              avatar={<Avatar>{getUserInitials(selectedUser)}</Avatar>}
              label={getUserDisplayName(selectedUser)}
              onDelete={() => setSelectedUser(null)}
              color="primary"
              sx={{ fontWeight: 500 }}
            />
          </Box>
        )}

        {/* User List */}
        <Box
          sx={{
            maxHeight: 400,
            overflow: "auto",
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            backgroundColor: "#fafafa",
          }}
        >
          {isLoadingUsers ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : filteredUsers.length === 0 ? (
            <Box sx={{ py: 4, px: 2, textAlign: "center" }}>
              <Person sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
              <Typography color="text.secondary" variant="body2">
                {searchQuery ? "No users found" : "No users available"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
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
                    borderBottom: 1,
                    borderColor: "divider",
                    "&:last-child": { borderBottom: 0 },
                  }}
                >
                  <ListItemButton
                    onClick={() => handleSelectUser(user)}
                    selected={selectedUser?.id === user.id}
                    sx={{
                      py: 1.5,
                      "&.Mui-selected": {
                        backgroundColor: "primary.lighter",
                        "&:hover": {
                          backgroundColor: "primary.lighter",
                        },
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          backgroundColor: "primary.main",
                          fontWeight: 600,
                        }}
                      >
                        {getUserInitials(user)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                          {getUserDisplayName(user)}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
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

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
          Select a user from the list to start chatting
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          variant="contained"
          disabled={!selectedUser || isLoading}
          startIcon={isLoading ? <CircularProgress size={16} /> : null}
        >
          {isLoading ? "Creating..." : "Start Chat"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

