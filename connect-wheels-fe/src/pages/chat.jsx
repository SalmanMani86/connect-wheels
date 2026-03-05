import { useState, useEffect } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import ChatList from "../components/chat/ChatList";
import ChatWindow from "../components/chat/ChatWindow";
import MessageInput from "../components/chat/MessageInput";
import NewChatDialog from "../components/chat/NewChatDialog";
import { 
  useCreateChatMutation,
  useReadAllMessagesMutation,
  chatApiSlice
} from "../redux/slices/chatApiSlice";
import { setCurrentChat, clearCurrentChat } from "../redux/slices/chatStateSlice";

export default function ChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

  // When arriving from garage "Message Owner" - open that chat
  useEffect(() => {
    const openChat = location.state?.openChat;
    if (openChat?.id) {
      setSelectedChat(openChat);
      dispatch(setCurrentChat(openChat.id));
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.openChat, location.pathname, dispatch, navigate]);
  const [createChat, { isLoading: isCreatingChat, error: createChatError }] =
    useCreateChatMutation();
  const [readAllMessages] = useReadAllMessagesMutation();

  const handleChatSelect = async (chat) => {
    setSelectedChat(chat);
    setEditingMessage(null);
    
    // Set current chat in Redux state
    if (chat?.id) {
      dispatch(setCurrentChat(chat.id));
      
      // Always mark messages as read when opening a chat
      // This ensures we fetch the latest messages even if unreadCount is 0
      try {
        await readAllMessages(chat.id).unwrap();
        console.log("✅ Marked all messages as read for chat:", chat.id);
      } catch (error) {
        // Only log if it's not a 404 (chat might not have messages yet)
        if (error?.status !== 404) {
          console.error("Failed to mark messages as read:", error);
        }
      }
    } else {
      // No chat selected, clear current chat
      dispatch(clearCurrentChat());
    }
  };

  // Clear current chat when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearCurrentChat());
    };
  }, [dispatch]);

  // Clear current chat when selectedChat becomes null
  useEffect(() => {
    if (!selectedChat) {
      dispatch(clearCurrentChat());
    }
  }, [selectedChat, dispatch]);

  const handleEditMessage = (message) => {
    setEditingMessage(message);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
  };

  const handleNewChat = () => {
    setNewChatDialogOpen(true);
  };

  const handleCloseNewChatDialog = () => {
    setNewChatDialogOpen(false);
  };

  const handleCreateChat = async (userId) => {
    if (!userId) return;

    try {
      const result = await createChat({ receiverId: String(userId) }).unwrap();
      setSelectedChat(result.data);
      handleCloseNewChatDialog();
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  };

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        backgroundColor: "#0f172a",
      }}
    >
      {/* Chat List — full width on mobile when no chat selected, fixed width on desktop */}
      <Box
        sx={{
          width: { xs: "100%", md: 360 },
          flexShrink: 0,
          borderRight: { md: "1px solid rgba(255,255,255,0.08)" },
          minHeight: 0,
          display: {
            xs: selectedChat ? "none" : "flex",
            md: "flex",
          },
          flexDirection: "column",
        }}
      >
        <ChatList
          selectedChatId={selectedChat?.id}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
        />
      </Box>

      {/* Chat Window — hidden on mobile until a chat is selected */}
      <Box
        sx={{
          flex: 1,
          display: {
            xs: selectedChat ? "flex" : "none",
            md: "flex",
          },
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {/* Mobile back button */}
        {selectedChat && (
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              alignItems: "center",
              gap: 1,
              px: 1,
              py: 0.5,
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              bgcolor: "#0f172a",
            }}
          >
            <IconButton
              onClick={() => {
                setSelectedChat(null);
                dispatch(clearCurrentChat());
              }}
              sx={{ color: "#38bdf8" }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="body1" sx={{ color: "white", fontWeight: 600 }}>
              Messages
            </Typography>
          </Box>
        )}
        <ChatWindow chat={selectedChat} onEditMessage={handleEditMessage} />
        {selectedChat && (
          <MessageInput
            chatId={selectedChat.id}
            editingMessage={editingMessage}
            onCancelEdit={handleCancelEdit}
          />
        )}
      </Box>

      {/* New Chat Dialog */}
      <NewChatDialog
        open={newChatDialogOpen}
        onClose={handleCloseNewChatDialog}
        onCreate={handleCreateChat}
        isLoading={isCreatingChat}
        error={createChatError}
      />
    </Box>
  );
}

