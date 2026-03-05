import { useState, useRef, useEffect } from "react";
import {
  Box,
  TextField,
  IconButton,
  Paper,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  Send,
  Close,
} from "@mui/icons-material";
import { useDispatch } from "react-redux";
import {
  useSendMessageMutation,
  useUpdateMessageMutation,
  chatApiSlice,
} from "../../redux/slices/chatApiSlice";
import { useSocket } from "../../contexts/SocketContext";
import { useSelector } from "react-redux";

export default function MessageInput({ chatId, editingMessage, onCancelEdit }) {
  const [message, setMessage] = useState("");
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [updateMessage, { isLoading: isUpdating }] = useUpdateMessageMutation();
  const { socket } = useSocket();
  const inputRef = useRef(null);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

  // Populate input when editing
  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.content);
      inputRef.current?.focus();
    }
  }, [editingMessage]);

  const handleSend = async () => {
    if (!message.trim() || !chatId) return;

    try {
      if (editingMessage) {
        // Update existing message via Socket (real-time) or API fallback
        if (socket?.isConnected) {
          console.log("✏️ Updating message via socket...");
          socket.updateMessage({
            messageId: editingMessage.id,
            content: message.trim(),
          });
          // Socket will broadcast back, no need to wait
          console.log("✅ Message update sent via socket");
        } else {
          // Fallback to REST API if socket not connected
          console.warn("⚠️ Socket not connected, using REST API fallback");
          await updateMessage({
            messageId: editingMessage.id,
            content: message.trim(),
          }).unwrap();
        }
        onCancelEdit();
      } else {
        const messageContent = message.trim();
        const tempMessageId = `temp-${Date.now()}-${Math.random()}`;
        const now = new Date().toISOString();
        
        // 1. Optimistically add message to messages list INSTANTLY
        dispatch(
          chatApiSlice.util.updateQueryData(
            "getMessages",
            { chatId, page: 1, limit: 50 },
            (draft) => {
              if (!draft) {
                draft = { messages: [] };
              }
              if (!draft.messages) {
                draft.messages = [];
              }
              
              // Add message immediately to the end
              const optimisticMessage = {
                id: tempMessageId,
                chatId: chatId,
                senderId: String(user?.id),
                content: messageContent,
                type: "text",
                readBy: [String(user?.id)],
                createdAt: now,
                updatedAt: now,
                editedAt: null,
              };
              
              draft.messages.push(optimisticMessage);
              console.log("✅ Message added optimistically to messages list");
            }
          )
        );
        
        // 2. Optimistically update chat list INSTANTLY
        dispatch(
          chatApiSlice.util.updateQueryData(
            "getUserChats",
            { page: 1, limit: 50 },
            (draft) => {
              if (!draft || !draft.chats) {
                console.warn("⚠️ Chat list cache not available");
                return;
              }
              
              const chatIndex = draft.chats.findIndex(
                (c) => String(c.id) === String(chatId)
              );
              
              if (chatIndex !== -1) {
                // Update lastMessage immediately
                draft.chats[chatIndex].lastMessage = {
                  senderId: String(user?.id),
                  content: messageContent,
                  createdAt: now,
                };
                
                // Update updatedAt to move chat to top
                draft.chats[chatIndex].updatedAt = now;
                
                // Move chat to top
                const chatToMove = draft.chats.splice(chatIndex, 1)[0];
                draft.chats.unshift(chatToMove);
                
                console.log("✅ Chat list updated optimistically - moved to top");
              }
            }
          )
        );
        
        // 3. Clear input immediately (user sees instant feedback)
        setMessage("");
        
        // 4. Send to backend (non-blocking)
        if (socket?.isConnected) {
          console.log("📤 Sending message via socket...");
          socket.sendMessage({
            chatId,
            content: messageContent,
            type: "text",
          });
          console.log("✅ Message sent via socket");
        } else {
          console.warn("⚠️ Socket not connected, using REST API fallback");
          sendMessage({
            chatId,
            content: messageContent,
            type: "text",
          }).unwrap().catch((error) => {
            console.error("Failed to send message:", error);
            // On error, remove optimistic message
            dispatch(
              chatApiSlice.util.updateQueryData(
                "getMessages",
                { chatId, page: 1, limit: 50 },
                (draft) => {
                  if (draft?.messages) {
                    draft.messages = draft.messages.filter(
                      (msg) => msg.id !== tempMessageId
                    );
                  }
                }
              )
            );
          });
        }
      }
      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCancel = () => {
    setMessage("");
    onCancelEdit();
  };

  const isLoading = isSending || isUpdating;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 0,
        backgroundColor: "#334155",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Editing Indicator */}
      {editingMessage && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
            p: 1,
            backgroundColor: "rgba(56, 189, 248, 0.2)",
            borderRadius: 1,
            border: "1px solid rgba(56, 189, 248, 0.3)",
          }}
        >
          <Box>
            <Box sx={{ fontSize: "0.75rem", color: "#38bdf8", fontWeight: 600 }}>
              Editing message
            </Box>
            <Box sx={{ fontSize: "0.85rem", color: "#94a3b8" }}>
              {editingMessage.content.substring(0, 50)}
              {editingMessage.content.length > 50 ? "..." : ""}
            </Box>
          </Box>
          <IconButton size="small" onClick={handleCancel} sx={{ color: "#94a3b8" }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
      )}

      {/* Input Area */}
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
        {/* Message Input */}
        <TextField
          inputRef={inputRef}
          fullWidth
          multiline
          maxRows={4}
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          slotProps={{
            input: { sx: { color: "white" } },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              backgroundColor: "#1e293b",
              color: "white",
              "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
              "&:hover fieldset": { borderColor: "rgba(255,255,255,0.25)" },
              "&.Mui-focused fieldset": { borderColor: "#38bdf8" },
              "& .MuiInputBase-input::placeholder": { color: "#64748b", opacity: 1 },
            },
          }}
        />

        {/* Send Button */}
        <Tooltip title={editingMessage ? "Update" : "Send"}>
          <span>
            <IconButton
              onClick={handleSend}
              disabled={!message.trim() || isLoading}
              sx={{
                backgroundColor: message.trim() ? "#38bdf8" : "#475569",
                color: "white",
                "&:hover": {
                  backgroundColor: message.trim() ? "#0ea5e9" : "#64748b",
                },
                "&:disabled": {
                  backgroundColor: "#475569",
                  color: "#64748b",
                },
              }}
            >
              {isLoading ? (
                <CircularProgress size={20} sx={{ color: "white" }} />
              ) : (
                <Send fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Character Counter */}
      {message.length > 4500 && (
        <Box
          sx={{
            mt: 1,
            textAlign: "right",
            fontSize: "0.75rem",
            color: message.length > 5000 ? "#f87171" : "#94a3b8",
          }}
        >
          {message.length} / 5000
        </Box>
      )}
    </Paper>
  );
}


