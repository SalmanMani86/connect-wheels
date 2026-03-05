import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithReauth } from "../baseQueryWithReauth";

// Create the API slice with auto-logout on 401
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: createBaseQueryWithReauth("http://localhost:8080/api"),
  tagTypes: ["User", "Auth"],
  endpoints: (builder) => ({
    // Auth endpoints
    loginUser: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Auth"],
    }),
    
    registerUser: builder.mutation({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
      invalidatesTags: ["Auth"],
    }),
    
    loginWithGoogle: builder.query({
      query: () => "/auth/google",
      providesTags: ["Auth"],
    }),
    
    // User endpoints
    getUserProfile: builder.query({
      query: () => "/user/profile",
      providesTags: ["User"],
    }),
    
    updateUserProfile: builder.mutation({
      query: (userData) => ({
        url: "/user/profile",
        method: "PUT",
        body: userData,
      }),
      invalidatesTags: ["User"],
    }),
    changePassword: builder.mutation({
      query: (body) => ({
        url: "/user/change-password",
        method: "PUT",
        body,
      }),
    }),
    // Get all users (for chat)
    getAllUsers: builder.query({
      query: () => ({
        url: "/user/all",
        method: "GET",
      }),
      providesTags: ["User"],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useLoginUserMutation,
  useRegisterUserMutation,
  useLoginWithGoogleQuery,
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useChangePasswordMutation,
  useGetAllUsersQuery,
} = apiSlice;
