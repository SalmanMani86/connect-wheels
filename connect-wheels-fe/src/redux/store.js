import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./slices/apiSlice";
import { chatApiSlice } from "./slices/chatApiSlice";
import userReducer from "./slices/userSlice";
import chatStateReducer from "./slices/chatStateSlice";

export const store = configureStore({
  reducer: {
    api: apiSlice.reducer,
    chatApi: chatApiSlice.reducer,
    user: userReducer,
    chatState: chatStateReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(apiSlice.middleware)
      .concat(chatApiSlice.middleware),
});

export default store;