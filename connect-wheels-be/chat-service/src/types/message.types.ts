// ============================================
// 2. src/types/message.types.ts
// ============================================

// ===== REQUEST DTOs =====

/**
 * DTO for sending a message
 * Used in: POST /api/messages
 *
 */
export interface SendMessageDto {
  chatId: string;
  content: string;
  type?: "text" | "image" | "file";
}

/**
 * DTO for getting messages with pagination
 * Used in: GET /api/messages/:chatId?page=1&limit=50
 */
export interface GetMessagesQueryDto {
  page?: number;
  limit?: number;
}

/**
 * DTO for chat ID parameter in messages
 */
export interface GetMessagesParamsDto {
  chatId: string;
}

/**
 * DTO for message ID parameter
 */
export interface MessageIdParamsDto {
  messageId: string;
}

// ===== RESPONSE DTOs =====

/**
 * DTO for message response
 * What the API returns when getting messages
 * MATCHES your actual Message model structure
 */
export interface MessageResponseDto {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: "text" | "image" | "file";
  readBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO for send message response
 * POST /api/messages response
 */
export interface SendMessageResponseDto {
  success: boolean;
  message: string;
  data: MessageResponseDto;
}

/**
 * DTO for get messages response
 * GET /api/messages/:chatId response
 */
export interface GetMessagesResponseDto {
  success: boolean;
  message: string;
  data: {
    messages: MessageResponseDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

/**
 * DTO for generic success response (for delete/update operations)
 */
export interface GenericSuccessResponseDto {
  success: boolean;
  message: string;
}
