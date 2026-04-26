import { createApi } from "@reduxjs/toolkit/query/react";
import { createBaseQueryWithReauth } from "../baseQueryWithReauth";

// Create the Chat API slice with auto-logout on 401
export const chatApiSlice = createApi({
  reducerPath: "chatApi",
  baseQuery: createBaseQueryWithReauth(
    import.meta.env.VITE_API_URL || "http://localhost:8080/api"
  ),
  tagTypes: ["Chat", "Message", "UnreadCount"],
  endpoints: (builder) => ({
    // Chat endpoints
    getUserChats: builder.query({
      query: ({ page = 1, limit = 20, userId } = {}) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (userId) params.append("userId", userId);
        return {
          url: `/chat/chats?${params.toString()}`,
          method: "GET",
        };
      },
      transformResponse: (response) => {
        // Handle both response structures: direct data or wrapped
        return response?.data || response;
      },
      providesTags: ["Chat"],
    }),

    getChatById: builder.query({
      query: (chatId) => ({
        url: `/chat/chats/${chatId}`,
        method: "GET",
      }),
      providesTags: (result, error, chatId) => [{ type: "Chat", id: chatId }],
    }),

    createChat: builder.mutation({
      query: (data) => ({
        url: "/chat/chats",
        method: "POST",
        body: data, // Should be { participants: [userId1, userId2] } or { receiverId }
      }),
      invalidatesTags: ["Chat"],
    }),

    deleteChat: builder.mutation({
      query: (chatId) => ({
        url: `/chat/chats/${chatId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Chat", "Message"],
    }),

    getUnreadCount: builder.query({
      query: () => ({
        url: "/chat/chats/unread/count",
        method: "GET",
      }),
      providesTags: ["UnreadCount"],
    }),

    // Message endpoints
    getMessages: builder.query({
      query: ({ chatId, page = 1, limit = 50 }) => ({
        url: `/chat/messages/${chatId}?page=${page}&limit=${limit}`,
        method: "GET",
      }),
      transformResponse: (response) => {
        // Handle both response structures: { response: {...} } or direct data
        return response?.response?.data || response?.data || response;
      },
      providesTags: (result, error, { chatId }) => [
        { type: "Message", id: chatId },
      ],
    }),

    sendMessage: builder.mutation({
      query: ({ chatId, content, type = "text" }) => ({
        url: "/chat/messages",
        method: "POST",
        body: { chatId, content, type },
      }),
      // This is fallback when socket fails
      // Invalidate messages for the specific chat to trigger refetch
      invalidatesTags: (result, error, { chatId }) => [
        { type: "Message", id: chatId },
        "Chat", // Update chat list (last message)
      ],
    }),

    markMessageAsRead: builder.mutation({
      query: (messageId) => ({
        url: `/chat/messages/${messageId}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["Message", "UnreadCount"],
    }),

    readAllMessages: builder.mutation({
      query: (chatId) => ({
        url: `/chat/messages/${chatId}/read-all`,
        method: "PATCH",
      }),
      // Invalidate to force refetch and update UI
      invalidatesTags: (result, error, chatId) => [
        { type: "Message", id: chatId }, // Refetch messages for this chat
        "Chat", // Update chat list
        "UnreadCount" // Update unread count
      ],
      // Optimistic update: immediately set unread count to 0 in cache
      async onQueryStarted(chatId, { dispatch, queryFulfilled, getState }) {
        const userId = getState().user?.user?.id;
        if (!userId) return;

        let chatUnreadCount = 0;

        // Optimistically update the chat list cache and capture the unread count
        const patchResult = dispatch(
          chatApiSlice.util.updateQueryData("getUserChats", { page: 1, limit: 50 }, (draft) => {
            if (draft?.chats) {
              const chat = draft.chats.find((c) => c.id === chatId);
              if (chat && chat.unreadCount) {
                chatUnreadCount = chat.unreadCount[userId] || 0;
                chat.unreadCount[userId] = 0;
              }
            }
          })
        );

        // Optimistically update unread count (subtract the chat's unread count)
        const unreadPatchResult = dispatch(
          chatApiSlice.util.updateQueryData("getUnreadCount", undefined, (draft) => {
            if (draft?.data) {
              const currentCount = draft.data.unreadCount || 0;
              draft.data.unreadCount = Math.max(0, currentCount - chatUnreadCount);
            }
          })
        );

        try {
          await queryFulfilled;
        } catch {
          // If the mutation fails, revert the optimistic update
          patchResult.undo();
          unreadPatchResult.undo();
        }
      },
    }),

    deleteMessage: builder.mutation({
      query: (messageId) => ({
        url: `/chat/messages/${messageId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Message", "Chat"],
    }),

    updateMessage: builder.mutation({
      query: ({ messageId, content }) => ({
        url: `/chat/messages/${messageId}`,
        method: "PATCH",
        body: { content },
      }),
      invalidatesTags: ["Message", "Chat"],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetUserChatsQuery,
  useGetChatByIdQuery,
  useCreateChatMutation,
  useDeleteChatMutation,
  useGetUnreadCountQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useMarkMessageAsReadMutation,
  useReadAllMessagesMutation,
  useDeleteMessageMutation,
  useUpdateMessageMutation,
} = chatApiSlice;

