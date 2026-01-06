import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logout } from "./slices/userSlice";

// Base query with auto-logout on 401
export const createBaseQueryWithReauth = (baseUrl) => {
  const baseQuery = fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().user?.token || localStorage.getItem("token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      headers.set("content-type", "application/json");
      return headers;
    },
  });

  // Wrapper function to handle 401 errors
  return async (args, api, extraOptions) => {
    const result = await baseQuery(args, api, extraOptions);

    // Check if the response is 401 Unauthorized
    if (result.error && result.error.status === 401) {
      console.warn("🚫 401 Unauthorized - Logging out user");
      
      // Dispatch logout action
      api.dispatch(logout());
      
      // Redirect to login page
      window.location.href = "/login";
    }

    return result;
  };
};

