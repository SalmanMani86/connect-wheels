import { createSlice } from "@reduxjs/toolkit";

// Check if user has token in localStorage (for initial state)
const getInitialState = () => {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  
  let user = null;
  try {
    user = userStr && userStr !== "undefined" ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error("Error parsing user data from localStorage:", error);
    localStorage.removeItem("user");
    user = null;
  }

  // Only consider authenticated if we have BOTH token and user data
  const isAuthenticated = !!(token && user);
  
  // If we have token but no user (corrupted state), clear it
  if (token && !user) {
    localStorage.removeItem("token");
  }

  return {
    user: user,
    token: token,
    isAuthenticated: isAuthenticated,
    error: null,
  };
};

const userSlice = createSlice({
  name: "user",
  initialState: getInitialState(),
  reducers: {
    loginSuccess: (state, action) => {
      console.log("loginSuccess called with:", action.payload);
      
      // Handle different payload structures
      let token, userData;
      
      if (action.payload.token && action.payload.user) {
        // Structure: { token, user: {...} }
        token = action.payload.token;
        userData = action.payload.user;
      } else {
        // Structure: { token, userId, email, ...otherData }
        const { token: t, userId, email, message, ...rest } = action.payload;
        token = t;
        
        // Map userId to id for consistency
        userData = {
          id: userId ,
          email: email || rest.email,
          ...rest,
        };
        
        // Remove message if it exists (not part of user data)
        if (userData.message) {
          delete userData.message;
        }
      }
      
      console.log("Processed - token:", token ? token.substring(0, 20) + "..." : "NONE");
      console.log("Processed - userData:", userData);
      
      state.user = userData;
      state.token = token;
      state.isAuthenticated = true;
      state.error = null;

      // Save to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;

      // Remove from localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
    clearError: (state) => {
      state.error = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { loginSuccess, logout, clearError, setError } = userSlice.actions;
export default userSlice.reducer;
