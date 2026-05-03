import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithReauth } from "../baseQueryWithReauth";

const GARAGE_BASE = "/garage";

export const garageApiSlice = createApi({
  reducerPath: "garageApi",
  baseQuery: createBaseQueryWithReauth(
    import.meta.env.VITE_API_URL || "http://localhost:8080/api"
  ),
  tagTypes: ["Garage", "Car", "Post", "Feed", "Comment", "Like", "Follow", "Notification"],
  endpoints: (builder) => ({
    // Garage CRUD
    searchGarages: builder.query({
      query: ({ q = "", location, page = 1, limit = 10 }) => ({
        url: `${GARAGE_BASE}/search`,
        params: { q, location, page, limit },
      }),
      providesTags: (result) =>
        result?.garages
          ? [
              ...result.garages.map(({ id }) => ({ type: "Garage", id })),
              { type: "Garage", id: "LIST" },
            ]
          : [{ type: "Garage", id: "LIST" }],
    }),
    getUserGarages: builder.query({
      query: ({ userId, page = 1, limit = 10 }) => ({
        url: `${GARAGE_BASE}/user/${userId}`,
        params: { page, limit },
      }),
      providesTags: (result) =>
        result?.garages
          ? [
              ...result.garages.map(({ id }) => ({ type: "Garage", id })),
              { type: "Garage", id: "USER" },
            ]
          : [{ type: "Garage", id: "USER" }],
    }),
    getGarage: builder.query({
      query: (garageId) => ({ url: `${GARAGE_BASE}/${garageId}` }),
      providesTags: (result, _err, id) => [{ type: "Garage", id }],
    }),
    createGarage: builder.mutation({
      query: (body) => ({
        url: `${GARAGE_BASE}/create-garage`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Garage", id: "LIST" }, { type: "Garage", id: "USER" }],
    }),
    updateGarage: builder.mutation({
      query: ({ garageId, formData }) => ({
        url: `${GARAGE_BASE}/${garageId}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: (result, _err, { garageId }) => [{ type: "Garage", id: garageId }],
    }),
    deleteGarage: builder.mutation({
      query: (garageId) => ({
        url: `${GARAGE_BASE}/${garageId}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Garage", id: "LIST" }, { type: "Garage", id: "USER" }],
    }),

    // Browse all cars across the platform
    browseCars: builder.query({
      query: ({ page = 1, limit = 20, q, ownership = "all" } = {}) => ({
        url: `${GARAGE_BASE}/cars`,
        params: {
          page,
          limit,
          ...(q ? { q } : {}),
          ...(ownership && ownership !== "all" ? { ownership } : {}),
        },
      }),
      providesTags: (result) =>
        result?.cars
          ? [
              ...result.cars.map(({ id }) => ({ type: "Car", id })),
              { type: "Car", id: "BROWSE" },
            ]
          : [{ type: "Car", id: "BROWSE" }],
    }),

    // Cars
    getGarageCars: builder.query({
      query: ({ garageId, page = 1, limit = 10 }) => ({
        url: `${GARAGE_BASE}/${garageId}/cars`,
        params: { page, limit },
      }),
      providesTags: (result, _err, { garageId }) =>
        result?.cars
          ? [
              ...result.cars.map(({ id }) => ({ type: "Car", id })),
              { type: "Car", id: `GARAGE-${garageId}` },
            ]
          : [{ type: "Car", id: `GARAGE-${garageId}` }],
    }),
    getCar: builder.query({
      query: ({ garageId, carId }) => ({
        url: `${GARAGE_BASE}/${garageId}/cars/${carId}`,
      }),
      providesTags: (result, _err, { carId }) => [{ type: "Car", id: carId }],
    }),
    addCar: builder.mutation({
      query: ({ garageId, formData }) => ({
        url: `${GARAGE_BASE}/${garageId}/cars`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (_result, _err, { garageId }) => [
        { type: "Car", id: `GARAGE-${garageId}` },
        { type: "Car", id: "BROWSE" },
        { type: "Garage", id: garageId },
        { type: "Garage", id: "USER" },
        { type: "Garage", id: "LIST" },
      ],
    }),
    updateCar: builder.mutation({
      query: ({ garageId, carId, formData }) => ({
        url: `${GARAGE_BASE}/${garageId}/cars/${carId}`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: (_result, _err, { garageId, carId }) => [
        { type: "Car", id: carId },
        { type: "Car", id: `GARAGE-${garageId}` },
        { type: "Car", id: "BROWSE" },
        { type: "Garage", id: garageId },
        { type: "Garage", id: "USER" },
      ],
    }),
    deleteCar: builder.mutation({
      query: ({ garageId, carId }) => ({
        url: `${GARAGE_BASE}/${garageId}/cars/${carId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _err, { garageId }) => [
        { type: "Car", id: `GARAGE-${garageId}` },
        { type: "Car", id: "BROWSE" },
        { type: "Garage", id: garageId },
        { type: "Garage", id: "USER" },
        { type: "Garage", id: "LIST" },
      ],
    }),

    // Follow
    followGarage: builder.mutation({
      query: (garageId) => ({
        url: `${GARAGE_BASE}/${garageId}/follow`,
        method: "POST",
      }),
      invalidatesTags: (result, _err, garageId) => [
        { type: "Garage", id: garageId },
        { type: "Garage", id: "LIST" },
        { type: "Follow", id: "USER" },
        { type: "Feed", id: "PERSONAL" },
        "Notification",
      ],
    }),
    unfollowGarage: builder.mutation({
      query: (garageId) => ({
        url: `${GARAGE_BASE}/${garageId}/unfollow`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _err, garageId) => [
        { type: "Garage", id: garageId },
        { type: "Garage", id: "LIST" },
        { type: "Follow", id: "USER" },
        { type: "Feed", id: "PERSONAL" },
      ],
    }),
    getFollowers: builder.query({
      query: ({ garageId, page = 1, limit = 10 }) => ({
        url: `${GARAGE_BASE}/${garageId}/followers`,
        params: { page, limit },
      }),
      providesTags: (_result, _err, { garageId }) => [{ type: "Follow", id: `FOLLOWERS-${garageId}` }],
    }),
    getFollowing: builder.query({
      query: ({ userId, page = 1, limit = 10 }) => ({
        url: `${GARAGE_BASE}/user/${userId}/following`,
        params: { page, limit },
      }),
      providesTags: [{ type: "Follow", id: "USER" }],
    }),

    // Posts
    getGaragePosts: builder.query({
      query: ({ garageId, page = 1, limit = 10 }) => ({
        url: `${GARAGE_BASE}/${garageId}/posts`,
        params: { page, limit },
      }),
      providesTags: (result, _err, { garageId }) =>
        result?.posts
          ? [
              ...result.posts.map(({ id }) => ({ type: "Post", id })),
              { type: "Post", id: `GARAGE-${garageId}` },
            ]
          : [{ type: "Post", id: `GARAGE-${garageId}` }],
    }),
    createPost: builder.mutation({
      query: ({ garageId, formData }) => ({
        url: `${GARAGE_BASE}/${garageId}/posts`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: (_result, _err, { garageId }) => [
        { type: "Post", id: `GARAGE-${garageId}` },
        { type: "Feed", id: "PERSONAL" },
        { type: "Feed", id: "TRENDING" },
        { type: "Garage", id: garageId },
        { type: "Garage", id: "USER" },
        { type: "Garage", id: "LIST" },
      ],
    }),
    getPost: builder.query({
      query: (postId) => ({ url: `${GARAGE_BASE}/posts/${postId}` }),
      providesTags: (result, _err, postId) => [{ type: "Post", id: postId }],
    }),
    updatePost: builder.mutation({
      query: ({ postId, ...body }) => ({
        url: `${GARAGE_BASE}/posts/${postId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _err, { postId }) => [
        { type: "Post", id: postId },
        { type: "Feed", id: "PERSONAL" },
        { type: "Feed", id: "TRENDING" },
      ],
    }),
    deletePost: builder.mutation({
      query: (postId) => ({
        url: `${GARAGE_BASE}/posts/${postId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _err, postId) => [
        { type: "Post", id: postId },
        { type: "Feed", id: "PERSONAL" },
        { type: "Feed", id: "TRENDING" },
        { type: "Garage", id: "USER" },
        { type: "Garage", id: "LIST" },
      ],
    }),

    // Feed
    getFeed: builder.query({
      query: ({ page = 1, limit = 20 }) => ({
        url: `${GARAGE_BASE}/feed`,
        params: { page, limit },
      }),
      providesTags: (result) =>
        result?.feed
          ? [
              ...result.feed.map(({ id }) => ({ type: "Post", id })),
              { type: "Feed", id: "PERSONAL" },
            ]
          : [{ type: "Feed", id: "PERSONAL" }],
    }),
    getTrendingPosts: builder.query({
      query: ({ timeframe = "week", page = 1, limit = 20 }) => ({
        url: `${GARAGE_BASE}/feed/trending`,
        params: { timeframe, page, limit },
      }),
      providesTags: (result) =>
        result?.feed
          ? [
              ...result.feed.map(({ id }) => ({ type: "Post", id })),
              { type: "Feed", id: "TRENDING" },
            ]
          : [{ type: "Feed", id: "TRENDING" }],
    }),

    // Likes
    likePost: builder.mutation({
      query: (postId) => ({
        url: `${GARAGE_BASE}/posts/${postId}/like`,
        method: "POST",
      }),
      invalidatesTags: (_result, _err, postId) => [
        { type: "Post", id: postId },
        { type: "Feed", id: "PERSONAL" },
        { type: "Feed", id: "TRENDING" },
        "Notification",
      ],
    }),
    unlikePost: builder.mutation({
      query: (postId) => ({
        url: `${GARAGE_BASE}/posts/${postId}/unlike`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _err, postId) => [
        { type: "Post", id: postId },
        { type: "Feed", id: "PERSONAL" },
        { type: "Feed", id: "TRENDING" },
      ],
    }),
    getPostLikes: builder.query({
      query: ({ postId, page = 1, limit = 20 }) => ({
        url: `${GARAGE_BASE}/posts/${postId}/likes`,
        params: { page, limit },
      }),
      providesTags: (_result, _err, { postId }) => [{ type: "Like", id: postId }],
    }),

    // Comments
    getPostComments: builder.query({
      query: ({ postId, page = 1, limit = 20, sort = "recent" }) => ({
        url: `${GARAGE_BASE}/posts/${postId}/comments`,
        params: { page, limit, sort },
      }),
      providesTags: (result, _err, { postId }) =>
        result?.comments
          ? [
              ...result.comments.map(({ id }) => ({ type: "Comment", id })),
              { type: "Comment", id: `POST-${postId}` },
            ]
          : [{ type: "Comment", id: `POST-${postId}` }],
    }),
    addComment: builder.mutation({
      query: ({ postId, content, parentCommentId }) => ({
        url: `${GARAGE_BASE}/posts/${postId}/comments`,
        method: "POST",
        body: { content, ...(parentCommentId != null && { parentCommentId }) },
      }),
      invalidatesTags: (_result, _err, { postId }) => [
        { type: "Comment", id: `POST-${postId}` },
        { type: "Post", id: postId },
        "Notification",
      ],
    }),
    updateComment: builder.mutation({
      query: ({ commentId, content }) => ({
        url: `${GARAGE_BASE}/comments/${commentId}`,
        method: "PUT",
        body: { content },
      }),
      invalidatesTags: (_result, _err, { commentId }) => [{ type: "Comment", id: commentId }],
    }),
    deleteComment: builder.mutation({
      query: (commentId) => ({
        url: `${GARAGE_BASE}/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _err, commentId) => [{ type: "Comment", id: commentId }],
    }),
    likeComment: builder.mutation({
      query: (commentId) => ({
        url: `${GARAGE_BASE}/comments/${commentId}/like`,
        method: "POST",
      }),
      invalidatesTags: (_result, _err, commentId) => [{ type: "Comment", id: commentId }],
    }),
    unlikeComment: builder.mutation({
      query: (commentId) => ({
        url: `${GARAGE_BASE}/comments/${commentId}/unlike`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _err, commentId) => [{ type: "Comment", id: commentId }],
    }),

    // Notifications
    getNotifications: builder.query({
      query: ({ page = 1, limit = 20 } = {}) => ({
        url: `${GARAGE_BASE}/notifications`,
        params: { page, limit },
      }),
      providesTags: (result) =>
        result?.notifications
          ? [
              ...result.notifications.map(({ id }) => ({ type: "Notification", id })),
              { type: "Notification", id: "LIST" },
            ]
          : [{ type: "Notification", id: "LIST" }],
    }),
    getNotificationUnreadCount: builder.query({
      query: () => ({ url: `${GARAGE_BASE}/notifications/unread/count` }),
      providesTags: ["Notification"],
    }),
    markNotificationRead: builder.mutation({
      query: (id) => ({
        url: `${GARAGE_BASE}/notifications/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),
    markAllNotificationsRead: builder.mutation({
      query: () => ({
        url: `${GARAGE_BASE}/notifications/read-all`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useSearchGaragesQuery,
  useGetUserGaragesQuery,
  useGetGarageQuery,
  useCreateGarageMutation,
  useUpdateGarageMutation,
  useDeleteGarageMutation,
  useBrowseCarsQuery,
  useGetGarageCarsQuery,
  useGetCarQuery,
  useAddCarMutation,
  useUpdateCarMutation,
  useDeleteCarMutation,
  useFollowGarageMutation,
  useUnfollowGarageMutation,
  useGetFollowersQuery,
  useGetFollowingQuery,
  useGetGaragePostsQuery,
  useCreatePostMutation,
  useGetPostQuery,
  useUpdatePostMutation,
  useDeletePostMutation,
  useGetFeedQuery,
  useGetTrendingPostsQuery,
  useLikePostMutation,
  useUnlikePostMutation,
  useGetPostLikesQuery,
  useGetPostCommentsQuery,
  useAddCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useLikeCommentMutation,
  useUnlikeCommentMutation,
  useGetNotificationsQuery,
  useGetNotificationUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = garageApiSlice;
