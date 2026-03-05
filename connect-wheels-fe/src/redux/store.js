import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "./slices/apiSlice";
import { chatApiSlice } from "./slices/chatApiSlice";
import { garageApiSlice } from "./slices/garageApiSlice";
import userReducer from "./slices/userSlice";
import chatStateReducer from "./slices/chatStateSlice";

export const store = configureStore({
  reducer: {
    api: apiSlice.reducer,
    chatApi: chatApiSlice.reducer,
    garageApi: garageApiSlice.reducer,
    user: userReducer,
    chatState: chatStateReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(apiSlice.middleware)
      .concat(chatApiSlice.middleware)
      .concat(garageApiSlice.middleware),
});

export default store;