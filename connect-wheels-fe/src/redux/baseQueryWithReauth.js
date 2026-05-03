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
      // Do NOT force content-type here — fetchBaseQuery sets application/json
      // automatically for plain objects, and lets the browser set multipart
      // boundary when the body is FormData.
      return headers;
    },
  });

  const getRequestUrl = (args) => {
    if (typeof args === "string") return args;
    return args?.url || "";
  };

  const isPublicAuthRequest = (url) =>
    url.startsWith("/auth/login") ||
    url.startsWith("/auth/register") ||
    url.startsWith("/auth/forgot-password") ||
    url.startsWith("/auth/reset-password") ||
    url.startsWith("/auth/verify-email") ||
    url.startsWith("/auth/google");

  // Wrapper function to handle 401 errors
  return async (args, api, extraOptions) => {
    const result = await baseQuery(args, api, extraOptions);
    const requestUrl = getRequestUrl(args);

    // Only expired protected sessions should force logout/redirect.
    // Public auth requests such as login should surface their own error.
    if (result.error && result.error.status === 401 && !isPublicAuthRequest(requestUrl)) {
      console.warn("🚫 401 Unauthorized - Logging out user");
      
      // Dispatch logout action
      api.dispatch(logout());
      
      // Redirect to login page
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return result;
  };
};

