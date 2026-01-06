import { useEffect, useRef, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Divider,
  Chip,
} from "@mui/material";
import {
  MoreVert,
  Info,
  Edit,
  Delete,
  Check,
  DoneAll,
} from "@mui/icons-material";
import { useSelector, useDispatch } from "react-redux";
import { store } from "../../redux/store";
import {
  useGetMessagesQuery,
  useDeleteMessageMutation,
  useReadAllMessagesMutation,
  chatApiSlice,
} from "../../redux/slices/chatApiSlice";
import { useSocket } from "../../contexts/SocketContext";
import { useUserDisplayName, useUserInitials } from "../../hooks/useUserDetails";

export default function ChatWindow({ chat, onEditMessage }) {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const messagesEndRef = useRef(null);
  const { user } = useSelector((state) => state.user);
  const { socket } = useSocket();
  const dispatch = useDispatch();

  const { data, isLoading, error, refetch } = useGetMessagesQuery(
    { chatId: chat?.id || "", page: 1, limit: 50 },
    { skip: !chat }
  );

  const [deleteMessage] = useDeleteMessageMutation();
  const [readAllMessages] = useReadAllMessagesMutation();

  const messages = data?.messages || [];

  const otherUserId = chat?.participants?.find((p) => String(p) !== String(user?.id)) || null;
  const otherUserName = useUserDisplayName(otherUserId);
  const otherUserInitials = useUserInitials(otherUserId);

  // Join/leave chat room via socket when chat changes
  useEffect(() => {
    if (chat?.id && socket?.isConnected) {
      socket.joinChat(chat.id);
      
      return () => {
        socket.leaveChat(chat.id);
      };
    }
  }, [chat?.id, socket]);

  // Listen for real-time messages
  useEffect(() => {
    if (!chat?.id || !socket?.isConnected) {
      console.log("Socket not ready or no chat selected", { chatId: chat?.id, socketConnected: socket?.isConnected });
      return;
    }

    const handleNewMessage = (messageData) => {
      console.log("📨 Received new message:", messageData);
      const chatId = String(messageData.chatId);
      const realMessageId = messageData._id || messageData.id;
      
      // Update messages cache if this is the current chat
      if (chatId === String(chat.id)) {
        console.log("✅ Message belongs to current chat, updating messages cache");
        
        dispatch(
          chatApiSlice.util.updateQueryData(
            "getMessages",
            { chatId: chat.id, page: 1, limit: 50 },
            (draft) => {
              if (!draft || !draft.messages) {
                draft = { messages: [] };
              }
              
              // Check if optimistic message exists (temp ID) and replace it
              const optimisticIndex = draft.messages.findIndex(
                (msg) => msg.id?.startsWith("temp-") && 
                         msg.content === messageData.content &&
                         String(msg.senderId) === String(messageData.senderId)
              );
              
              const realMessage = {
                id: realMessageId,
                chatId: messageData.chatId,
                senderId: messageData.senderId,
                content: messageData.content,
                type: messageData.type || "text",
                readBy: messageData.readBy || [],
                createdAt: messageData.createdAt,
                updatedAt: messageData.updatedAt,
                editedAt: messageData.editedAt || null,
              };
              
              if (optimisticIndex !== -1) {
                // Replace optimistic message with real one
                draft.messages[optimisticIndex] = realMessage;
                console.log("✅ Replaced optimistic message with real message");
              } else {
                // Check if message already exists (avoid duplicates)
                const exists = draft.messages.some(
                  (msg) => msg.id === realMessageId
                );
                if (!exists) {
                  // Add new message
                  draft.messages.push(realMessage);
                  console.log("✅ Added new message from socket");
                }
              }
            }
          )
        );
      }
      
      // Always update chat list cache (lastMessage and move to top)
      console.log("✅ Updating chat list cache with new message");
      const currentUserId = String(user?.id);
      const isReceiver = String(messageData.senderId) !== currentUserId;
      const isViewingThisChat = chatId === String(chat.id);
      
      // Get current unread count for this chat before updating (for unread count cache update)
      let chatUnreadCountBeforeUpdate = 0;
      const state = store.getState();
      const chatListQuery = chatApiSlice.endpoints.getUserChats.select({ page: 1, limit: 50 })(state);
      if (chatListQuery?.data?.chats) {
        const chatToCheck = chatListQuery.data.chats.find((c) => String(c.id) === chatId);
        chatUnreadCountBeforeUpdate = chatToCheck?.unreadCount?.[currentUserId] || 0;
      }
      
      dispatch(
        chatApiSlice.util.updateQueryData(
          "getUserChats",
          { page: 1, limit: 50 },
          (draft) => {
            if (draft?.chats) {
              // Find the chat
              const chatIndex = draft.chats.findIndex(
                (c) => String(c.id) === chatId
              );
              
              if (chatIndex !== -1) {
                const chatToUpdate = draft.chats[chatIndex];
                
                // Update lastMessage
                chatToUpdate.lastMessage = {
                  senderId: messageData.senderId,
                  content: messageData.content,
                  createdAt: messageData.createdAt,
                };
                
                // Update updatedAt to move chat to top
                chatToUpdate.updatedAt = new Date().toISOString();
                
                // Update unreadCount: if viewing this chat, set to 0; otherwise increment if receiver
                if (isViewingThisChat && isReceiver) {
                  // User is viewing this chat, so mark as read (unread count = 0)
                  chatToUpdate.unreadCount = {
                    ...chatToUpdate.unreadCount,
                    [currentUserId]: 0,
                  };
                  
                  // Automatically mark chat as read via socket
                  if (socket?.isConnected) {
                    socket.markChatAsRead(chatId);
                    console.log("✅ Auto-marked chat as read (viewing chat)");
                  }
                } else if (isReceiver) {
                  // User is not viewing this chat, increment unread count
                  const currentUnread = chatToUpdate.unreadCount?.[currentUserId] || 0;
                  chatToUpdate.unreadCount = {
                    ...chatToUpdate.unreadCount,
                    [currentUserId]: currentUnread + 1,
                  };
                }
                
                // Move chat to top (remove and add at beginning)
                draft.chats.splice(chatIndex, 1);
                draft.chats.unshift(chatToUpdate);
              }
            }
          }
        )
      );
      
      // Update unread count query cache if viewing this chat
      if (isViewingThisChat && isReceiver && chatUnreadCountBeforeUpdate > 0) {
        // Optimistically update unread count by subtracting this chat's unread count
        dispatch(
          chatApiSlice.util.updateQueryData("getUnreadCount", undefined, (draft) => {
            if (draft?.data) {
              const currentTotal = draft.data.unreadCount || 0;
              // Subtract the chat's unread count (since we're setting it to 0)
              draft.data.unreadCount = Math.max(0, currentTotal - chatUnreadCountBeforeUpdate);
            }
          })
        );
      }
    };

    const handleMessageUpdated = (messageData) => {
      console.log("✏️ Received message update:", messageData);
      const chatId = String(messageData.chatId);
      
      // Update messages cache if this is the current chat
      if (chatId === String(chat.id)) {
        console.log("✅ Updated message belongs to current chat, updating messages cache");
        
        dispatch(
          chatApiSlice.util.updateQueryData(
            "getMessages",
            { chatId: chat.id, page: 1, limit: 50 },
            (draft) => {
              // Find and update the message
              if (draft?.messages) {
                const index = draft.messages.findIndex(
                  (msg) => (msg.id === messageData._id || msg.id === messageData.id)
                );
                if (index !== -1) {
                  draft.messages[index] = {
                    ...draft.messages[index],
                    content: messageData.content,
                    updatedAt: messageData.updatedAt,
                    editedAt: messageData.editedAt || null,
                  };
                }
              }
            }
          )
        );
      }
      
      // Update chat list cache if this is the last message
      console.log("✅ Updating chat list cache with message update");
      dispatch(
        chatApiSlice.util.updateQueryData(
          "getUserChats",
          { page: 1, limit: 50 },
          (draft) => {
            if (draft?.chats) {
              const chatToUpdate = draft.chats.find(
                (c) => String(c.id) === chatId
              );
              
              // Only update if this is the last message
              if (chatToUpdate?.lastMessage && 
                  (String(chatToUpdate.lastMessage.senderId) === String(messageData.senderId)) &&
                  (chatToUpdate.lastMessage.createdAt === messageData.createdAt)) {
                chatToUpdate.lastMessage.content = messageData.content;
                chatToUpdate.updatedAt = messageData.updatedAt;
              }
            }
          }
        )
      );
    };

    console.log("👂 Setting up socket listeners for chat:", chat.id);
    socket.on("new_message", handleNewMessage);
    socket.on("message_updated", handleMessageUpdated);

    return () => {
      console.log("🧹 Cleaning up socket listeners");
      socket.off("new_message", handleNewMessage);
      socket.off("message_updated", handleMessageUpdated);
    };
  }, [chat?.id, socket, refetch]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark all messages as read when opening chat (only once)
  useEffect(() => {
    if (chat?.id) {
      // Use socket if available, otherwise use API
      if (socket?.isConnected) {
        socket.markChatAsRead(chat.id);
        console.log("✅ Marked chat as read via socket");
      } else {
        // Fallback to API if socket not connected
        readAllMessages(chat.id).catch(err => {
          // Only log if it's not a 404 (chat might not have messages yet)
          if (err?.status !== 404) {
            console.error("Failed to mark messages as read:", err);
          }
        });
      }
    }
  }, [chat?.id]); // Removed readAllMessages and socket from dependencies to prevent loops

  const handleMessageMenu = (event, message) => {
    setMenuAnchor(event.currentTarget);
    setSelectedMessage(message);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setSelectedMessage(null);
  };

  const handleDeleteMessage = async () => {
    if (selectedMessage) {
      try {
        await deleteMessage(selectedMessage.id).unwrap();
        handleCloseMenu();
      } catch (error) {
        console.error("Failed to delete message:", error);
      }
    }
  };

  const handleEditMessage = () => {
    if (selectedMessage) {
      onEditMessage(selectedMessage);
      handleCloseMenu();
    }
  };

  const formatMessageTime = (date) => {
    if (!date) return "";
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDateDivider = (date) => {
    if (!date) return "";
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return "Today";
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: messageDate.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const shouldShowDateDivider = (currentMsg, prevMsg) => {
    if (!prevMsg) return true;
    const currentDate = new Date(currentMsg.createdAt).toDateString();
    const prevDate = new Date(prevMsg.createdAt).toDateString();
    return currentDate !== prevDate;
  };

  if (!chat) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f5f5",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Select a conversation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose a chat from the left to start messaging
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      flex: 1,
      display: "flex", 
      flexDirection: "column",
      minHeight: 0, // Important: allows flex child to shrink
    }}>
      {/* Chat Header */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: 0,
          backgroundColor: "white",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            sx={{
              width: 45,
              height: 45,
              backgroundColor: "primary.main",
              fontWeight: 600,
            }}
          >
            {otherUserInitials}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {otherUserName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Online
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <IconButton size="small">
            <Info fontSize="small" />
          </IconButton>
        </Box>
      </Paper>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0, // Important: allows flex child to shrink
          overflow: "auto",
          p: 2,
          backgroundColor: "#f8f9fa",
          backgroundImage: "linear-gradient(to bottom, #fafafa 0%, #f0f0f0 100%)",
        }}
      >
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography color="error">Failed to load messages</Typography>
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography color="text.secondary">No messages yet</Typography>
            <Typography variant="caption" color="text.secondary">
              Send a message to start the conversation
            </Typography>
          </Box>
        ) : (
          <>
            {messages.map((message, index) => {
              // Fix type mismatch - ensure both are strings for comparison
              const isSender = String(message.senderId) === String(user?.id);
              const showDateDivider = shouldShowDateDivider(
                message,
                messages[index - 1]
              );

              return (
                <Box key={message.id}>
                  {/* Date Divider */}
                  {showDateDivider && (
                    <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
                      <Chip
                        label={formatDateDivider(message.createdAt)}
                        size="small"
                        sx={{
                          backgroundColor: "rgba(0,0,0,0.08)",
                          color: "text.secondary",
                          fontSize: "0.75rem",
                        }}
                      />
                    </Box>
                  )}

                  {/* Message Bubble */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: isSender ? "flex-end" : "flex-start",
                      mb: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: "70%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isSender ? "flex-end" : "flex-start",
                      }}
                    >
                      <Paper
                        elevation={1}
                        sx={{
                          p: 1.5,
                          backgroundColor: isSender ? "primary.main" : "white",
                          color: isSender ? "white" : "text.primary",
                          borderRadius: 2,
                          borderTopRightRadius: isSender ? 0 : 2,
                          borderTopLeftRadius: isSender ? 2 : 0,
                          position: "relative",
                          "&:hover .message-actions": {
                            opacity: 1,
                          },
                        }}
                      >
                        {/* Message Actions */}
                        {isSender && (
                          <IconButton
                            className="message-actions"
                            size="small"
                            onClick={(e) => handleMessageMenu(e, message)}
                            sx={{
                              position: "absolute",
                              top: 4,
                              right: 4,
                              opacity: 0,
                              transition: "opacity 0.2s",
                              color: "inherit",
                              padding: "2px",
                            }}
                          >
                            <MoreVert fontSize="small" />
                          </IconButton>
                        )}

                        <Typography
                          variant="body2"
                          sx={{
                            wordBreak: "break-word",
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {message.content}
                        </Typography>

                        {/* Message Meta */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            mt: 0.5,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: "0.65rem",
                              opacity: isSender ? 0.9 : 0.6,
                            }}
                          >
                            {formatMessageTime(message.createdAt)}
                          </Typography>
                          {message.editedAt && (
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: "0.65rem",
                                opacity: isSender ? 0.7 : 0.5,
                                fontStyle: "italic",
                                color: "text.secondary",
                              }}
                            >
                              Edited
                            </Typography>
                          )}
                          {isSender && (
                            <>
                              {message.readBy?.length > 1 ? (
                                <DoneAll sx={{ fontSize: 14, opacity: 0.9 }} />
                              ) : (
                                <Check sx={{ fontSize: 14, opacity: 0.9 }} />
                              )}
                            </>
                          )}
                        </Box>
                      </Paper>
                    </Box>
                  </Box>
                </Box>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* Message Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={handleEditMessage}>
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteMessage} sx={{ color: "error.main" }}>
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
}

