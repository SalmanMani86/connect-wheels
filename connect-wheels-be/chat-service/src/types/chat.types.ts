// ===== REQUEST DTOs =====

/**
 * DTO for creating a new chat
 * Used in: POST /api/chats
 */
export interface CreateChatDto {
  receiverId: string; // ✅ lowercase 'string'
}

/**
 * DTO for getting chats with pagination
 * Used in: GET /api/chats?page=1&limit=20
 */
export interface GetChatsQueryDto {
  page?: number;
  limit?: number;
}

/**
 * DTO for chat ID parameter
 * Used in: GET /api/chats/:chatId
 */
export interface GetChatParamsDto {
  chatId: string;
}

// ===== RESPONSE DTOs =====

/**
 * DTO for last message in chat
 * Matches the lastMessage field in Chat model
 */
export interface LastMessageDto {
  content: string;
  senderId: string;
  createdAt: Date;
}

/**
 * DTO for chat response
 * What the API returns when getting a chat
 * MATCHES your actual Chat model structure
 */
export interface ChatResponseDto {
  id: string;
  participants: string[];
  lastMessage?: LastMessageDto; // ✅ Optional (new chats have no messages)
  unreadCount: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for create chat response
 * POST /api/chats response
 */
export interface CreateChatResponseDto {
  success: boolean;
  message: string;
  data: ChatResponseDto;
}

/**
 * DTO for get chats response
 * GET /api/chats response (paginated)
 */
export interface GetChatsResponseDto {
  success: boolean;
  message: string;
  data: {
    chats: ChatResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
