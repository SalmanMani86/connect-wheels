import { Server as SocketIOServer } from "socket.io";
import { AuthSocket } from "./socket.middleware";
import { Message } from "../models/message.model";
import { Chat } from "../models/chat.model";
import { IMessage } from "../models/message.model";

// Store online users: userId -> socketId[]
// Users can have multiple connections (multiple devices/tabs)
const onlineUsers = new Map<string, string[]>();

/**
 * Add user socket connection
 */
const addUserSocket = (userId: string, socketId: string): void => {
  const sockets = onlineUsers.get(userId) || [];
  if (!sockets.includes(socketId)) {
    sockets.push(socketId);
    onlineUsers.set(userId, sockets);
  }
};

/**
 * Remove user socket connection
 */
const removeUserSocket = (userId: string, socketId: string): void => {
  const sockets = onlineUsers.get(userId) || [];
  const filtered = sockets.filter((id) => id !== socketId);
  if (filtered.length === 0) {
    onlineUsers.delete(userId);
  } else {
    onlineUsers.set(userId, filtered);
  }
};

/**
 * Check if user is online
 */
export const isUserOnline = (userId: string): boolean => {
  const sockets = onlineUsers.get(userId);
  return sockets ? sockets.length > 0 : false;
};

/**
 * Get all online user IDs
 */
export const getOnlineUsers = (): string[] => {
  return Array.from(onlineUsers.keys());
};

/**
 * Setup Socket.IO event handlers
 */
export const setupSocketHandlers = (io: SocketIOServer) => {
  io.on("connection", (socket: AuthSocket) => {
    const userId = socket.userId!;
    console.log(`✅ User connected: ${userId} (Socket: ${socket.id})`);
    
    // Store user as online (handle multiple connections)
    const wasOffline = !isUserOnline(userId);
    addUserSocket(userId, socket.id);
    
    // Join user's personal room
    socket.join(`user:${userId}`);
    
    // Notify others that user is online (only if they were offline before)
    if (wasOffline) {
    socket.broadcast.emit("user_online", { userId });
    }
    socket.on("join_chat", async (data: { chatId: string }) => {
      try {
        const { chatId } = data;
        // Verify user has access to this chat
        const chat = await Chat.findOne({
          _id: chatId,
          participants: userId,
        });
        if (!chat) {
          socket.emit("error", {
            message: "Chat not found or access denied",
            code: "CHAT_NOT_FOUND",
          });
          return;
        }
        socket.join(`chat:${chatId}`);
        console.log(`📥 User ${userId} joined chat ${chatId}`);
        socket.emit("joined_chat", { chatId });
      } catch (error) {
        console.error("Error Joining chat", error);
        socket.emit("error", {
          message: "Failed to join chat",
          code: "JOIN_CHAT_ERROR",
        });
      }
    });
    socket.on("leave_chat", async (data: { chatId: string }) => {
      const { chatId } = data;
      socket.leave(`chat:${chatId}`);
      console.log(`📤 User ${userId} left chat ${chatId}`);
    });
    // ===== EVENT: SEND MESSAGE =====
    socket.on(
      "send_message",
      async (data: {
        chatId: string;
        content: string;
        type?: "text";
      }) => {
        try {
          const { type, chatId, content } = data;
          
          // Validate content
          if (!content || content.trim().length === 0) {
            socket.emit("error", {
              message: "Message content cannot be empty",
              code: "INVALID_CONTENT",
            });
            return;
          }
          
          if (content.length > 5000) {
            socket.emit("error", {
              message: "Message content exceeds maximum length",
              code: "CONTENT_TOO_LONG",
            });
            return;
          }
          
          const chat = await Chat.findOne({
            _id: chatId,
            participants: userId,
          });
          if (!chat) {
            socket.emit("error", {
              message: "Chat not found",
              code: "CHAT_NOT_FOUND",
            });
            return;
          }
          // Create message in database
          const message = (await Message.create({
            chatId,
            senderId: userId,
            content,
            type,
            readBy: [userId],
          })) as IMessage;
          // Update chat's last message
          chat.lastMessage = {
            content,
            senderId: userId,
            createdAt: message.createdAt,
          };
          const receiverId = chat.participants.find((p) => p !== userId);
          // Increment unread count for receiver
          if (receiverId) {
            const currentUnread = chat.unreadCount.get(receiverId) || 0;
            chat.unreadCount.set(receiverId, currentUnread + 1);
          }
          await chat.save();
          // Prepare message data
          const messageData = {
            _id: message._id.toString(),
            chatId: message.chatId.toString(),
            senderId: message.senderId,
            content: message.content,
            type: message.type,
            readBy: message.readBy,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
          };
          // Emit to all users in the chat room (including sender)
          io.to(`chat:${chatId}`).emit("new_message", messageData);
          // Also emit to receiver's personal room for notification
          if (receiverId) {
            io.to(`user:${receiverId}`).emit("message_notification", {
              chatId,
              message: messageData,
              unreadCount: chat.unreadCount.get(receiverId),
            });
          }
          console.log(`💬 Message sent in chat ${chatId} by ${userId}`);
        } catch (error) {
          console.error("Error sending message:", error);
          socket.emit("error", {
            message: "Failed to send message",
            code: "SEND_MESSAGE_ERROR",
          });
        }
      }
    );


    // ===== EVENT: TYPING INDICATOR =====
    socket.on("typing", async (data: { chatId: string; isTyping: boolean }) => {
      try {
        const { chatId, isTyping } = data;
        
        // Verify user has access to this chat
        const chat = await Chat.findOne({
          _id: chatId,
          participants: userId,
        });
        
        if (!chat) {
          socket.emit("error", {
            message: "Chat not found or access denied",
            code: "CHAT_NOT_FOUND",
          });
          return;
        }
        
        // Broadcast to others in the chat (excludes sender)
        socket.to(`chat:${chatId}`).emit("user_typing", {
          userId,
          chatId,
          isTyping,
        });
        console.log(`⌨️ User ${userId} ${isTyping ? 'started' : 'stopped'} typing in chat ${chatId}`);
      } catch (error) {
        console.error("Error handling typing indicator:", error);
        socket.emit("error", {
          message: "Failed to handle typing indicator",
          code: "TYPING_ERROR",
        });
      }
    });

    // ===== EVENT: MARK MESSAGE AS READ =====
    socket.on("mark_message_as_read", async (data: { messageId: string }) => {
      try {
        const { messageId } = data;
        
        // Find message
        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit("error", {
            message: "Message not found",
            code: "MESSAGE_NOT_FOUND",
          });
          return;
        }
    
        // Verify user has access to this chat
        const chat = await Chat.findOne({
          _id: message.chatId,
          participants: userId,
        });
        if (!chat) {
          socket.emit("error", {
            message: "Chat not found or access denied",
            code: "CHAT_NOT_FOUND",
          });
          return;
        }
    
        // Update message readBy if not already read
        if (!message.readBy.includes(userId)) {
          message.readBy.push(userId);
          await message.save();
        }
    
        // Decrement unread count
        const currentUnread = chat.unreadCount.get(userId) || 0;
        if (currentUnread > 0) {
          chat.unreadCount.set(userId, currentUnread - 1);
          await chat.save();
        }
    
        // Notify others in chat room (excludes sender)
        socket.to(`chat:${message.chatId.toString()}`).emit('message_read', {
          messageId,
          chatId: message.chatId.toString(),
          userId,
          readAt: new Date()
        });
    
        console.log(`🔔 Message ${messageId} marked as read by ${userId}`);
      } catch (error) {
        console.error("Error marking message as read:", error);
        socket.emit("error", {
          message: "Failed to mark message as read",
          code: "MARK_MESSAGE_AS_READ_ERROR",
        });
      }
    });

    // ===== EVENT: UPDATE MESSAGE =====
    socket.on("update_message", async (data: { messageId: string; content: string }) => {
      try {
        const { messageId, content } = data;
        
        if (!content || content.trim().length === 0) {
          socket.emit("error", {
            message: "Message content cannot be empty",
            code: "INVALID_CONTENT",
          });
          return;
        }
        
        if (content.length > 5000) {
          socket.emit("error", {
            message: "Message content exceeds maximum length",
            code: "CONTENT_TOO_LONG",
          });
          return;
        }
        
        // Find message and verify user is the sender
        const message = await Message.findOne({
          _id: messageId,
          senderId: userId,
        });
        
        if (!message) {
          socket.emit("error", {
            message: "Message not found or you can only edit your own messages",
            code: "MESSAGE_NOT_FOUND",
          });
          return;
        }
        
        // Verify user has access to this chat
        const chat = await Chat.findOne({
          _id: message.chatId,
          participants: userId,
        });
        
        if (!chat) {
          socket.emit("error", {
            message: "Chat not found or access denied",
            code: "CHAT_NOT_FOUND",
          });
          return;
        }
        
        // Update message
        message.content = content;
        message.editedAt = new Date();
        await message.save();
        
        // Update chat's last message if this is the last message
        if (chat.lastMessage && chat.lastMessage.senderId === userId) {
          chat.lastMessage.content = content;
          await chat.save();
        }
        
        // Prepare message data for broadcast
        const messageData = {
          _id: message._id.toString(),
          chatId: message.chatId.toString(),
          senderId: message.senderId,
          content: message.content,
          type: message.type,
          readBy: message.readBy,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
          editedAt: message.editedAt,
        };
        
        // Broadcast to all participants in the chat (including sender)
        io.to(`chat:${message.chatId.toString()}`).emit("message_updated", messageData);
        
        console.log(`✏️ Message ${messageId} updated by ${userId} in chat ${message.chatId}`);
      } catch (error) {
        console.error("Error updating message:", error);
        socket.emit("error", {
          message: "Failed to update message",
          code: "UPDATE_MESSAGE_ERROR",
        });
      }
    });

    // ===== EVENT: MARK ALL MESSAGES AS READ =====
    socket.on("mark_all_messages_as_read", async (data: { chatId: string }) => {
      try {
        const { chatId } = data;
        
        // Verify user has access to this chat
        const chat = await Chat.findOne({
          _id: chatId,
          participants: userId,
        });
        
        if (!chat) {
          socket.emit("error", {
            message: "Chat not found or access denied",
            code: "CHAT_NOT_FOUND",
          });
          return;
        }
        
        // Reset unread count for user
        chat.unreadCount.set(userId, 0);
        await chat.save();
        
        // Mark all unread messages as read
        const result = await Message.updateMany(
          {
            chatId,
            readBy: { $ne: userId },
          },
          {
            $addToSet: { readBy: userId },
          }
        );
        
        // Notify others in chat room (excludes sender)
        socket.to(`chat:${chatId}`).emit("all_messages_read", {
          chatId,
          userId,
          readAt: new Date(),
        });
        
        console.log(`📖 All messages marked as read in chat ${chatId} by ${userId} (${result.modifiedCount} messages)`);
      } catch (error) {
        console.error("Error marking all messages as read:", error);
        socket.emit("error", {
          message: "Failed to mark all messages as read",
          code: "MARK_ALL_READ_ERROR",
        });
      }
    });

    // ===== EVENT: DISCONNECT =====
    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${userId} (Socket: ${socket.id})`);
      
      // Remove this specific socket connection
      removeUserSocket(userId, socket.id);
      
      // Only notify others if user is completely offline (no more connections)
      if (!isUserOnline(userId)) {
        socket.broadcast.emit("user_offline", { userId });
      }
    });
  });


};
