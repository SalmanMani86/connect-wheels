import { createContext, useContext, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import socketService from "../services/socketService";
import { chatApiSlice } from "../redux/slices/chatApiSlice";

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, token } = useSelector((state) => state.user);
  const currentChatId = useSelector((state) => state.chatState?.currentChatId);
  const dispatch = useDispatch();
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);

  useEffect(() => {
    // Connect socket when user is logged in
    if (user?.id && token) {
      console.log("Connecting socket for user:", user.id);
      socketService.connect(token, user.id);

      // Listen to connection status
      const handleConnect = () => {
        setIsConnected(true);
        setSocketId(socketService.socket?.id);
      };

      const handleDisconnect = () => {
        setIsConnected(false);
        setSocketId(null);
      };

      socketService.on("socket_connected", handleConnect);
      socketService.on("socket_disconnected", handleDisconnect);

      // Initial status check
      const status = socketService.getConnectionStatus();
      setIsConnected(status.isConnected);
      setSocketId(status.socketId);

      // Cleanup on unmount
      return () => {
        socketService.off("socket_connected", handleConnect);
        socketService.off("socket_disconnected", handleDisconnect);
        if (!user?.id) {
          socketService.disconnect();
        }
      };
    } else {
      // Disconnect if user logs out
      socketService.disconnect();
      setIsConnected(false);
      setSocketId(null);
    }
  }, [user?.id, token]);

  // Global socket listeners for messages (work on all routes)
  useEffect(() => {
    if (!user?.id || !isConnected) {
      return;
    }

    // Handle new messages - update chat list and messages cache if chat is open
    const handleNewMessage = (messageData) => {
      console.log("📨 [Global] Received new message:", messageData);
      const chatId = String(messageData.chatId);
      const realMessageId = messageData._id || messageData.id;
      const currentUserId = String(user?.id);
      const isCurrentChat = String(chatId) === String(currentChatId);
      const isReceiver = String(messageData.senderId) !== currentUserId;

      // Update messages cache if this is the current chat (chat window is open)
      if (isCurrentChat) {
        console.log("✅ [Global] Message for current chat, updating messages cache");
        dispatch(
          chatApiSlice.util.updateQueryData(
            "getMessages",
            { chatId: chatId, page: 1, limit: 50 },
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
                console.log("✅ [Global] Replaced optimistic message with real message");
              } else {
                // Check if message already exists (avoid duplicates)
                const exists = draft.messages.some(
                  (msg) => msg.id === realMessageId
                );
                if (!exists) {
                  // Add new message
                  draft.messages.push(realMessage);
                  console.log("✅ [Global] Added new message to messages cache");
                }
              }
            }
          )
        );

        // Auto-mark message as read if user is receiver and chat is open
        if (isReceiver && socketService.isConnected && realMessageId) {
          console.log("👁️ [Global] Auto-marking message as read:", realMessageId);
          socketService.markMessageAsRead(realMessageId);
        }
      }

      // Update chat list cache (works even when not on chat page)
      // Note: Unread count is handled by message_notification event (authoritative source)
      dispatch(
        chatApiSlice.util.updateQueryData(
          "getUserChats",
          { page: 1, limit: 50 },
          (draft) => {
            if (draft?.chats) {
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

                // Move chat to top
                draft.chats.splice(chatIndex, 1);
                draft.chats.unshift(chatToUpdate);
              } else {
                // Chat doesn't exist in cache, invalidate to refetch
                dispatch(chatApiSlice.util.invalidateTags(["Chat"]));
              }
            }
          }
        )
      );
    };

    // Handle message notifications (includes unread count from backend)
    const handleMessageNotification = (notificationData) => {
      console.log("🔔 [Global] Received message notification:", notificationData);
      const { chatId, message, unreadCount } = notificationData;
      const currentUserId = String(user?.id);
      const isReceiver = String(message.senderId) !== currentUserId;
      
      // Check if this message is for the currently opened chat
      const isCurrentChat = String(chatId) === String(currentChatId);
      
      // If user is viewing this chat and is receiver, auto-mark as read
      if (isCurrentChat && isReceiver && socketService.isConnected) {
        socketService.markChatAsRead(chatId);
        console.log("✅ [Global] Auto-marked chat as read (current chat open)");
      }

      // Update chat list cache with unread count from backend (or 0 if current chat)
      const finalUnreadCount = (isCurrentChat && isReceiver) ? 0 : (unreadCount || 0);
      
      dispatch(
        chatApiSlice.util.updateQueryData(
          "getUserChats",
          { page: 1, limit: 50 },
          (draft) => {
            if (draft?.chats) {
              const chatIndex = draft.chats.findIndex(
                (c) => String(c.id) === String(chatId)
              );

              if (chatIndex !== -1) {
                const chatToUpdate = draft.chats[chatIndex];

                // Update lastMessage
                chatToUpdate.lastMessage = {
                  senderId: message.senderId,
                  content: message.content,
                  createdAt: message.createdAt,
                };

                // Update unreadCount: 0 if current chat, otherwise use backend value
                chatToUpdate.unreadCount = {
                  ...chatToUpdate.unreadCount,
                  [currentUserId]: finalUnreadCount,
                };

                // Update updatedAt to move chat to top
                chatToUpdate.updatedAt = new Date().toISOString();

                // Move chat to top
                draft.chats.splice(chatIndex, 1);
                draft.chats.unshift(chatToUpdate);
              } else {
                // Chat doesn't exist in cache, invalidate to refetch
                dispatch(chatApiSlice.util.invalidateTags(["Chat"]));
              }
            }
          }
        )
      );

      // Update unread count query cache
      if (isCurrentChat && isReceiver) {
        // Optimistically update unread count by subtracting this chat's unread count
        dispatch(
          chatApiSlice.util.updateQueryData("getUnreadCount", undefined, (draft) => {
            if (draft?.data) {
              const currentTotal = draft.data.unreadCount || 0;
              const chatUnreadCount = unreadCount || 0;
              // Subtract the chat's unread count (since we're setting it to 0)
              draft.data.unreadCount = Math.max(0, currentTotal - chatUnreadCount);
            }
          })
        );
      } else {
        // Invalidate unread count to refetch from backend (more accurate)
        dispatch(chatApiSlice.util.invalidateTags(["UnreadCount"]));
      }
    };

    // Handle message read status updates (single message)
    const handleMessageRead = (readData) => {
      console.log("👁️ [Global] Message marked as read:", readData);
      const { messageId, chatId, userId: readByUserId } = readData;
      
      // Update messages cache to reflect read status
      dispatch(
        chatApiSlice.util.updateQueryData(
          "getMessages",
          { chatId: String(chatId), page: 1, limit: 50 },
          (draft) => {
            if (draft?.messages) {
              const message = draft.messages.find((msg) => msg.id === messageId);
              if (message) {
                // Add userId to readBy array if not already present
                if (!message.readBy.includes(readByUserId)) {
                  message.readBy.push(readByUserId);
                  console.log("✅ [Global] Updated readBy for message:", messageId);
                }
              }
            }
          }
        )
      );
    };

    // Handle all messages read (when user opens chat later)
    const handleAllMessagesRead = (readData) => {
      console.log("👁️👁️ [Global] All messages marked as read:", readData);
      const { chatId, userId: readByUserId } = readData;
      
      // Update messages cache to mark ALL messages as read
      dispatch(
        chatApiSlice.util.updateQueryData(
          "getMessages",
          { chatId: String(chatId), page: 1, limit: 50 },
          (draft) => {
            if (draft?.messages) {
              // Add readByUserId to ALL messages that don't already have it
              draft.messages.forEach((message) => {
                if (!message.readBy.includes(readByUserId)) {
                  message.readBy.push(readByUserId);
                }
              });
              console.log("✅ [Global] Marked all messages as read in chat:", chatId);
            }
          }
        )
      );
    };

    // Set up global listeners
    socketService.on("new_message", handleNewMessage);
    socketService.on("message_notification", handleMessageNotification);
    socketService.on("message_read", handleMessageRead);
    socketService.on("all_messages_read", handleAllMessagesRead);

    // Cleanup
    return () => {
      socketService.off("new_message", handleNewMessage);
      socketService.off("message_notification", handleMessageNotification);
      socketService.off("message_read", handleMessageRead);
      socketService.off("all_messages_read", handleAllMessagesRead);
    };
  }, [user?.id, isConnected, dispatch, currentChatId]);

  const value = {
    socket: socketService,
    isConnected,
    socketId,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export default SocketContext;

