# Chat Message Marking System - Complete Documentation

## Overview

This document explains how the chat message marking system works, including global notifications, auto-marking messages as read when viewing a chat, and the Redux state management approach.

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Architecture](#solution-architecture)
3. [Redux State Management](#redux-state-management)
4. [Global Socket Listeners](#global-socket-listeners)
5. [Auto-Mark as Read Logic](#auto-mark-as-read-logic)
6. [Files Changed](#files-changed)
7. [Flow Diagrams](#flow-diagrams)
8. [Code Examples](#code-examples)

---

## Problem Statement

### Issues We Solved

1. **Unread Count Not Updating on Other Routes**
   - When user is on dashboard or other routes, unread message counts didn't update
   - Socket listeners were only active when chat page was mounted

2. **Messages Not Auto-Marked as Read**
   - When user is viewing a chat and receives a new message, it still showed as unread
   - User had to manually click the chat again to mark messages as read

3. **Unnecessary API Calls**
   - API was called even when unread count was already 0
   - No optimistic UI updates

---

## Solution Architecture

### High-Level Approach

1. **Redux State to Track Current Chat**
   - Simple state to track which chat window is currently open
   - Accessed globally by SocketContext

2. **Global Socket Listeners**
   - Socket listeners in `SocketContext` work on all routes
   - Update chat list and unread counts globally

3. **Auto-Mark as Read**
   - When message arrives for current chat → automatically mark as read
   - Update UI optimistically, notify backend via socket

---

## Redux State Management

### New Redux Slice: `chatStateSlice.js`

**Location:** `src/redux/slices/chatStateSlice.js`

**Purpose:** Track which chat window is currently open

**State Structure:**
```javascript
{
  currentChatId: null | string  // ID of currently opened chat, or null if none
}
```

**Actions:**
- `setCurrentChat(chatId)` - Set the current chat ID
- `clearCurrentChat()` - Clear the current chat ID (set to null)

**Implementation:**
```javascript
import { createSlice } from "@reduxjs/toolkit";

const chatStateSlice = createSlice({
  name: "chatState",
  initialState: {
    currentChatId: null,
  },
  reducers: {
    setCurrentChat: (state, action) => {
      state.currentChatId = action.payload;
    },
    clearCurrentChat: (state) => {
      state.currentChatId = null;
    },
  },
});

export const { setCurrentChat, clearCurrentChat } = chatStateSlice.actions;
export default chatStateSlice.reducer;
```

### Store Configuration

**File:** `src/redux/store.js`

**Changes:**
- Added `chatState` reducer to the store

```javascript
import chatStateReducer from "./slices/chatStateSlice";

export const store = configureStore({
  reducer: {
    api: apiSlice.reducer,
    chatApi: chatApiSlice.reducer,
    user: userReducer,
    chatState: chatStateReducer,  // ← Added
  },
  // ... middleware
});
```

---

## Global Socket Listeners

### SocketContext Implementation

**File:** `src/contexts/SocketContext.jsx`

**Key Features:**
1. **Global Listeners** - Work on all routes (not just chat page)
2. **Message Notifications** - Update chat list and unread counts
3. **Auto-Mark as Read** - Check if message is for current chat

### How It Works

#### 1. Reading Current Chat from Redux

```javascript
const currentChatId = useSelector((state) => state.chatState?.currentChatId);
```

#### 2. Message Notification Handler

When a `message_notification` event is received:

```javascript
const handleMessageNotification = (notificationData) => {
  const { chatId, message, unreadCount } = notificationData;
  const currentUserId = String(user?.id);
  const isReceiver = String(message.senderId) !== currentUserId;
  
  // Check if this message is for the currently opened chat
  const isCurrentChat = String(chatId) === String(currentChatId);
  
  // If user is viewing this chat and is receiver, auto-mark as read
  if (isCurrentChat && isReceiver && socketService.isConnected) {
    socketService.markChatAsRead(chatId);
    console.log("✅ Auto-marked chat as read (current chat open)");
  }

  // Update chat list cache with unread count
  // If current chat: set to 0, otherwise use backend value
  const finalUnreadCount = (isCurrentChat && isReceiver) ? 0 : (unreadCount || 0);
  
  // Update Redux cache...
};
```

#### 3. Cache Updates

**Chat List Cache:**
- Updates `lastMessage`
- Updates `unreadCount` (0 if current chat, backend value otherwise)
- Moves chat to top of list

**Unread Count Cache:**
- If current chat: Optimistically subtract chat's unread count
- Otherwise: Invalidate to refetch from backend

---

## Auto-Mark as Read Logic

### Flow

1. **User Opens Chat**
   - `handleChatSelect` in `chat.jsx` is called
   - Sets `currentChatId` in Redux: `dispatch(setCurrentChat(chat.id))`
   - Calls `readAllMessages` API to mark existing messages as read

2. **Message Arrives While Chat is Open**
   - SocketContext receives `message_notification`
   - Checks: `chatId === currentChatId`
   - If yes:
     - Calls `socketService.markChatAsRead(chatId)` → Notifies backend
     - Sets unread count to 0 in UI (optimistic update)
     - Updates total unread count cache

3. **User Closes Chat**
   - `selectedChat` becomes `null`
   - `useEffect` clears `currentChatId` in Redux
   - Future messages will use backend unread count

### Code Flow

```
User Opens Chat
    ↓
handleChatSelect()
    ↓
dispatch(setCurrentChat(chatId))
    ↓
Redux State: currentChatId = chatId
    ↓
Message Arrives
    ↓
SocketContext.handleMessageNotification()
    ↓
Check: chatId === currentChatId?
    ↓
YES → socketService.markChatAsRead(chatId)
    ↓
Update UI: unreadCount = 0
    ↓
Backend Updates: All messages marked as read
```

---

## Files Changed

### 1. New File: `src/redux/slices/chatStateSlice.js`

**Purpose:** Redux slice to track current chat

**Key Code:**
```javascript
const chatStateSlice = createSlice({
  name: "chatState",
  initialState: {
    currentChatId: null,
  },
  reducers: {
    setCurrentChat: (state, action) => {
      state.currentChatId = action.payload;
    },
    clearCurrentChat: (state) => {
      state.currentChatId = null;
    },
  },
});
```

---

### 2. Modified: `src/redux/store.js`

**Changes:**
- Imported `chatStateReducer`
- Added to store reducers

**Before:**
```javascript
reducer: {
  api: apiSlice.reducer,
  chatApi: chatApiSlice.reducer,
  user: userReducer,
}
```

**After:**
```javascript
reducer: {
  api: apiSlice.reducer,
  chatApi: chatApiSlice.reducer,
  user: userReducer,
  chatState: chatStateReducer,  // ← Added
}
```

---

### 3. Modified: `src/pages/chat.jsx`

**Changes:**
1. Import Redux actions
2. Set `currentChatId` when chat is selected
3. Clear `currentChatId` when chat is closed

**Key Changes:**

```javascript
// Import
import { setCurrentChat, clearCurrentChat } from "../redux/slices/chatStateSlice";

// In handleChatSelect
const handleChatSelect = async (chat) => {
  setSelectedChat(chat);
  setEditingMessage(null);
  
  if (chat?.id) {
    // Set current chat in Redux
    dispatch(setCurrentChat(chat.id));
    
    // Existing mark-as-read logic...
  } else {
    dispatch(clearCurrentChat());
  }
};

// Clear when chat is closed
useEffect(() => {
  if (!selectedChat) {
    dispatch(clearCurrentChat());
  }
}, [selectedChat, dispatch]);
```

---

### 4. Modified: `src/contexts/SocketContext.jsx`

**Changes:**
1. Read `currentChatId` from Redux
2. Check if message is for current chat
3. Auto-mark as read if current chat
4. Update unread count optimistically

**Key Changes:**

```javascript
// Read current chat from Redux
const currentChatId = useSelector((state) => state.chatState?.currentChatId);

// In handleMessageNotification
const handleMessageNotification = (notificationData) => {
  const { chatId, message, unreadCount } = notificationData;
  const isReceiver = String(message.senderId) !== currentUserId;
  
  // Check if this is the current chat
  const isCurrentChat = String(chatId) === String(currentChatId);
  
  // Auto-mark as read if current chat
  if (isCurrentChat && isReceiver && socketService.isConnected) {
    socketService.markChatAsRead(chatId);
  }
  
  // Update unread count: 0 if current chat, otherwise backend value
  const finalUnreadCount = (isCurrentChat && isReceiver) ? 0 : (unreadCount || 0);
  
  // Update cache...
};
```

---

### 5. Modified: `src/services/socketService.js`

**Changes:**
- Fixed event name to match backend

**Before:**
```javascript
this.socket.emit("mark_chat_as_read", { chatId });
```

**After:**
```javascript
// Backend expects "mark_all_messages_as_read" event
this.socket.emit("mark_all_messages_as_read", { chatId });
```

---

## Flow Diagrams

### Flow 1: User Opens Chat

```
User Clicks Chat
    ↓
handleChatSelect(chat)
    ↓
dispatch(setCurrentChat(chat.id))
    ↓
Redux: currentChatId = "chat123"
    ↓
readAllMessages(chat.id) API Call
    ↓
Backend: Mark all messages as read
    ↓
UI: Unread count = 0
```

### Flow 2: Message Arrives While Chat is Open

```
Backend Sends Message
    ↓
Socket: "message_notification" Event
    ↓
SocketContext.handleMessageNotification()
    ↓
Check: chatId === currentChatId?
    ↓
YES (Chat is Open)
    ↓
socketService.markChatAsRead(chatId)
    ↓
Backend: Mark all messages as read
    ↓
Update UI: unreadCount = 0
    ↓
Update Total Unread Count Cache
```

### Flow 3: Message Arrives While Chat is Closed

```
Backend Sends Message
    ↓
Socket: "message_notification" Event
    ↓
SocketContext.handleMessageNotification()
    ↓
Check: chatId === currentChatId?
    ↓
NO (Chat is Not Open)
    ↓
Use Backend unreadCount Value
    ↓
Update UI: unreadCount = backend value
    ↓
Invalidate Unread Count Cache (refetch)
```

---

## Code Examples

### Example 1: Setting Current Chat

```javascript
// In chat.jsx
import { setCurrentChat } from "../redux/slices/chatStateSlice";

const handleChatSelect = async (chat) => {
  if (chat?.id) {
    // Set current chat in Redux
    dispatch(setCurrentChat(chat.id));
    // ... rest of logic
  }
};
```

### Example 2: Reading Current Chat in SocketContext

```javascript
// In SocketContext.jsx
import { useSelector } from "react-redux";

const currentChatId = useSelector((state) => state.chatState?.currentChatId);

// Use it in message handler
const isCurrentChat = String(chatId) === String(currentChatId);
```

### Example 3: Auto-Mark as Read

```javascript
// In SocketContext.jsx
if (isCurrentChat && isReceiver && socketService.isConnected) {
  socketService.markChatAsRead(chatId);
  // Unread count will be set to 0 in cache update
}
```

### Example 4: Clearing Current Chat

```javascript
// In chat.jsx
import { clearCurrentChat } from "../redux/slices/chatStateSlice";

useEffect(() => {
  if (!selectedChat) {
    dispatch(clearCurrentChat());
  }
}, [selectedChat, dispatch]);
```

---

## Benefits of This Approach

### 1. **Simplicity**
- Single Redux state tracks current chat
- No complex query checks or route detection
- Easy to understand and maintain

### 2. **Reliability**
- Redux state is the single source of truth
- No race conditions or timing issues
- Works consistently across all routes

### 3. **Global Access**
- SocketContext can access current chat from anywhere
- No need to pass props through multiple components
- Works on all routes (dashboard, chat, etc.)

### 4. **Performance**
- Optimistic UI updates (no waiting for backend)
- Skips API calls when unread count is already 0
- Efficient cache updates

---

## Testing Scenarios

### Scenario 1: Open Chat, Receive Message
1. User opens Chat A
2. `currentChatId` = "chatA" in Redux
3. Message arrives for Chat A
4. ✅ Auto-marked as read
5. ✅ Unread count = 0

### Scenario 2: Chat Closed, Receive Message
1. No chat open (`currentChatId` = null)
2. Message arrives for Chat A
3. ✅ Uses backend unread count
4. ✅ Badge shows correct count

### Scenario 3: Switch Between Chats
1. Open Chat A → `currentChatId` = "chatA"
2. Open Chat B → `currentChatId` = "chatB"
3. Message arrives for Chat A
4. ✅ Uses backend unread count (Chat A not current)
5. Message arrives for Chat B
6. ✅ Auto-marked as read (Chat B is current)

### Scenario 4: Navigate to Other Route
1. Open Chat A → `currentChatId` = "chatA"
2. Navigate to Dashboard
3. `currentChatId` still = "chatA" (until chat page unmounts)
4. Message arrives for Chat A
5. ✅ Auto-marked as read (still current chat)

---

## Troubleshooting

### Issue: Messages Not Auto-Marking as Read

**Check:**
1. Is `currentChatId` set in Redux? (Check Redux DevTools)
2. Is socket connected? (`socketService.isConnected`)
3. Is user the receiver? (`isReceiver` check)
4. Is backend event name correct? (`mark_all_messages_as_read`)

### Issue: Unread Count Not Updating

**Check:**
1. Is `message_notification` event being received?
2. Is cache being updated correctly?
3. Is unread count query being invalidated?

### Issue: Current Chat Not Clearing

**Check:**
1. Is `clearCurrentChat()` being called?
2. Is `useEffect` dependency array correct?
3. Is component unmounting properly?

---

## Summary

This implementation provides:

✅ **Global notifications** - Works on all routes  
✅ **Auto-mark as read** - When viewing current chat  
✅ **Simple state management** - Redux tracks current chat  
✅ **Optimistic updates** - Fast UI updates  
✅ **Backend sync** - Socket events notify backend  
✅ **Clean architecture** - Separation of concerns  

The system is now robust, maintainable, and provides a great user experience!

