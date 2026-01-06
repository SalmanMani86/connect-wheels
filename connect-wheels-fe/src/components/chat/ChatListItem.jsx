import {
  Box,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Badge,
  Divider,
} from "@mui/material";
import { useUserDisplayName, useUserInitials } from "../../hooks/useUserDetails";

export default function ChatListItem({ chat, otherUserId, unreadCount, isSelected, onSelect, formatTime }) {
  const otherUserName = useUserDisplayName(otherUserId);
  const otherUserInitials = useUserInitials(otherUserId);

  return (
    <Box>
      <ListItem
        disablePadding
        sx={{
          backgroundColor: isSelected ? "primary.lighter" : "transparent",
          "&:hover": { backgroundColor: isSelected ? "primary.lighter" : "#f0f0f0" },
        }}
      >
        <ListItemButton
          onClick={() => onSelect(chat)}
          sx={{
            py: 1.5,
            px: 2,
            gap: 1.5,
          }}
        >
          <ListItemAvatar>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              variant="dot"
              sx={{
                "& .MuiBadge-badge": {
                  backgroundColor: "#44b700",
                  color: "#44b700",
                  boxShadow: "0 0 0 2px white",
                },
              }}
            >
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  backgroundColor: "primary.main",
                  fontWeight: 600,
                }}
              >
                {otherUserInitials}
              </Avatar>
            </Badge>
          </ListItemAvatar>

          <ListItemText
            primary={
              <Box 
                component="span"
                sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}
              >
                <Typography
                  variant="subtitle2"
                  component="span"
                  sx={{
                    fontWeight: unreadCount > 0 ? 700 : 500,
                    color: "text.primary",
                  }}
                >
                  {otherUserName}
                </Typography>
                {chat.lastMessage && (
                  <Typography
                    variant="caption"
                    component="span"
                    sx={{
                      color: unreadCount > 0 ? "primary.main" : "text.secondary",
                      fontWeight: unreadCount > 0 ? 600 : 400,
                    }}
                  >
                    {formatTime(chat.lastMessage.createdAt)}
                  </Typography>
                )}
              </Box>
            }
            secondaryTypographyProps={{ component: "div" }}
            secondary={
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography
                  variant="body2"
                  component="span"
                  sx={{
                    color: unreadCount > 0 ? "text.primary" : "text.secondary",
                    fontWeight: unreadCount > 0 ? 600 : 400,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "200px",
                  }}
                >
                  {chat.lastMessage?.content || "No messages yet"}
                </Typography>
                {unreadCount > 0 && (
                  <Badge
                    badgeContent={unreadCount}
                    color="primary"
                    sx={{
                      "& .MuiBadge-badge": {
                        fontWeight: 600,
                        fontSize: "0.7rem",
                      },
                    }}
                  />
                )}
              </Box>
            }
          />
        </ListItemButton>
      </ListItem>
      <Divider />
    </Box>
  );
}

