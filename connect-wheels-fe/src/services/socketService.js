import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  /**
   * Initialize socket connection
   * @param {string} token - JWT token for authentication
   * @param {string} userId - Current user ID
   */
  connect(token, userId) {
    if (this.socket?.connected) {
      console.log("Socket already connected");
      return;
    }

    // Disconnect existing connection if any
    if (this.socket) {
      this.disconnect();
    }

    // Connect to API Gateway (which proxies to chat service)
    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:8080";
    
    console.log("Attempting socket connection to:", socketUrl);
    console.log("With token:", token ? `${token.substring(0, 20)}...` : "NO TOKEN");
    console.log("User ID:", userId);
    
    this.socket = io(socketUrl, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      auth: {
        token: token,
      },
      query: {
        userId: userId,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Connection event handlers
    this.socket.on("connect", () => {
      console.log("✅ Socket connected successfully!");
      console.log("Socket ID:", this.socket.id);
      this.isConnected = true;
      this.emit("socket_connected");
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected. Reason:", reason);
      this.isConnected = false;
      this.emit("socket_disconnected", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
      console.error("Error details:", error);
      this.emit("socket_error", error);
    });

    this.socket.on("error", (error) => {
      console.error("❌ Socket error:", error);
      this.emit("socket_error", error);
    });

    return this.socket;
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  /**
   * Join a chat room
   * @param {string} chatId - Chat ID to join
   */
  joinChat(chatId) {
    if (!this.socket?.connected) {
      console.warn("Socket not connected, cannot join chat");
      return;
    }
    this.socket.emit("join_chat", { chatId });
  }

  /**
   * Leave a chat room
   * @param {string} chatId - Chat ID to leave
   */
  leaveChat(chatId) {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit("leave_chat", { chatId });
  }

  /**
   * Send a message via socket
   * @param {object} messageData - { chatId, content, type }
   */
  sendMessage(messageData) {
    if (!this.socket?.connected) {
      console.warn("Socket not connected, cannot send message");
      return;
    }
    this.socket.emit("send_message", messageData);
  }

  /**
   * Send typing indicator
   * @param {string} chatId - Chat ID
   * @param {boolean} isTyping - Typing state
   */
  sendTyping(chatId, isTyping) {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit("typing", { chatId, isTyping });
  }

  /**
   * Mark message as read via socket
   * @param {string} messageId - Message ID
   */
  markMessageAsRead(messageId) {
    if (!this.socket?.connected) {
      return;
    }
    this.socket.emit("mark_message_as_read", { messageId });
  }

  /**
   * Mark all messages in chat as read via socket
   * @param {string} chatId - Chat ID
   */
  markChatAsRead(chatId) {
    if (!this.socket?.connected) {
      return;
    }
    // Backend expects "mark_all_messages_as_read" event
    this.socket.emit("mark_all_messages_as_read", { chatId });
  }

  /**
   * Update a message via socket
   * @param {object} messageData - { messageId, content }
   */
  updateMessage(messageData) {
    if (!this.socket?.connected) {
      console.warn("Socket not connected, cannot update message");
      return;
    }
    this.socket.emit("update_message", messageData);
  }

  /**
   * Delete a message via socket
   * @param {object} messageData - { messageId, chatId }
   */
  deleteMessage(messageData) {
    if (!this.socket?.connected) {
      console.warn("Socket not connected, cannot delete message");
      return;
    }
    this.socket.emit("delete_message", messageData);
  }

  /**
   * Listen to socket events
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  on(event, callback) {
    if (!this.socket) {
      console.warn("Socket not initialized, cannot listen to events");
      return;
    }

    // Store listener for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    this.socket.on(event, callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {function} callback - Callback function (optional)
   */
  off(event, callback) {
    if (!this.socket) {
      return;
    }

    if (callback) {
      this.socket.off(event, callback);
      const listeners = this.listeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    } else {
      // Remove all listeners for this event
      const listeners = this.listeners.get(event);
      if (listeners) {
        listeners.forEach((listener) => {
          this.socket.off(event, listener);
        });
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emit custom event to registered listeners (for React state updates)
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit(event, data) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in socket listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get socket connection status
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
    };
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;

