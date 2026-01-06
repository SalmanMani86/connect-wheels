import { createSlice } from "@reduxjs/toolkit";

const chatStateSlice = createSlice({
  name: "chatState",
  initialState: {
    currentChatId: null, // ID of the currently opened chat window
  },
  reducers: {
    setCurrentChat: (state, action) => {
      state.currentChatId = action.payload; // chatId or null
    },
    clearCurrentChat: (state) => {
      state.currentChatId = null;
    },
  },
});

export const { setCurrentChat, clearCurrentChat } = chatStateSlice.actions;
export default chatStateSlice.reducer;

