import { useState, useEffect } from "react";
import { Box } from "@mui/material";
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
  const [selectedChat, setSelectedChat] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const [createChat, { isLoading: isCreatingChat, error: createChatError }] =
    useCreateChatMutation();
  const [readAllMessages] = useReadAllMessagesMutation();

  const handleChatSelect = async (chat) => {
    setSelectedChat(chat);
    setEditingMessage(null);
    
    // Set current chat in Redux state
    if (chat?.id) {
      dispatch(setCurrentChat(chat.id));
      
      // Mark all messages in this chat as read
      const userId = user?.id;
      const unreadCount = chat?.unreadCount?.[userId] || 0;
      
      if (unreadCount === 0) {
        // Count is already 0, no need to make API call
        // But we still update the UI optimistically to ensure it stays at 0
        dispatch(
          chatApiSlice.util.updateQueryData("getUserChats", { page: 1, limit: 50 }, (draft) => {
            if (draft?.chats) {
              const chatToUpdate = draft.chats.find((c) => c.id === chat.id);
              if (chatToUpdate && chatToUpdate.unreadCount) {
                chatToUpdate.unreadCount[userId] = 0;
              }
            }
          })
        );
        return;
      }

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
        backgroundColor: "#f5f5f5",
      }}
    >
      {/* Chat List - Left Sidebar */}
      <Box
        sx={{
          width: 360,
          flexShrink: 0,
          borderRight: 1,
          borderColor: "divider",
          minHeight: 0, // Important: allows flex child to shrink
        }}
      >
        <ChatList
          selectedChatId={selectedChat?.id}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
        />
      </Box>

      {/* Chat Window - Main Area */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0, // Important: allows flex child to shrink below content size
        }}
      >
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

