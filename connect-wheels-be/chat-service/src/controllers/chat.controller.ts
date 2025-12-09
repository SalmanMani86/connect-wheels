// ============================================
// 6. src/controllers/chat.controller.ts
// ============================================
import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { Chat } from "../models/chat.model";
import { Message } from "../models/message.model";
import { IChat } from "../models/chat.model";
import {
  CreateChatDto,
  GetChatsQueryDto,
  ChatResponseDto,
  CreateChatResponseDto,
  GetChatsResponseDto,
} from "../types/chat.types";

export class ChatController {
  /**
   * Create a new chat between two users
   * POST /api/chats
   *
   * Validation is already done by validateRequest middleware
   */
  createChat = async (
    req: AuthRequest,
    res: Response<CreateChatResponseDto | any>
  ): Promise<void> => {
    try {
      // Data is already validated, extract from request
      const createChatDto: CreateChatDto = req.body;
      const currentUserId = req.userId!;
      const { receiverId } = createChatDto;

      // Business logic validation
      if (currentUserId === receiverId) {
        res.status(400).json({
          success: false,
          message: "Cannot create chat with yourself",
          code: "SELF_CHAT_NOT_ALLOWED",
        });
        return;
      }

      // Check if chat already exists
      const existingChat = await Chat.findOne({
        participants: { $all: [currentUserId, receiverId] },
      });

      if (existingChat) {
        res.status(200).json({
          success: true,
          message: "Chat already exists",
          data: this.mapChatToDto(existingChat),
        });
        return;
      }

      // Create new chat
      const chat = await Chat.create({
        participants: [currentUserId, receiverId],
        unreadCount: {
          [currentUserId]: 0,
          [receiverId]: 0,
        },
      });

      res.status(201).json({
        success: true,
        message: "Chat created successfully",
        data: this.mapChatToDto(chat),
      });
    } catch (error) {
      console.error("Error creating chat:", error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
        code: "CREATE_CHAT_ERROR",
      });
    }
  };

  /**
   * Get all chats for current user
   * GET /api/chats
   */
  getUserChats = async (
    req: AuthRequest,
    res: Response<GetChatsResponseDto | any>
  ): Promise<void> => {
    try {
      const queryDto: GetChatsQueryDto = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };

      const userId = req.userId!;
      const skip = (queryDto.page! - 1) * queryDto.limit!;

      const [chats, total] = await Promise.all([
        Chat.find({ participants: userId })
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(queryDto.limit!)
          .lean(),
        Chat.countDocuments({ participants: userId }),
      ]);

      const response: GetChatsResponseDto = {
        success: true,
        message: "Chats retrieved successfully",
        data: {
          chats: chats.map((chat) => this.mapChatToDto(chat)),
          pagination: {
            page: queryDto.page!,
            limit: queryDto.limit!,
            total,
            totalPages: Math.ceil(total / queryDto.limit!),
          },
        },
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("Error getting chats:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        code: "GET_CHATS_ERROR",
      });
    }
  };

  /**
   * Get single chat by ID
   * GET /api/chats/:chatId
   */
  getChatById = async (
    req: AuthRequest,
    res: Response<CreateChatResponseDto | any>
  ): Promise<void> => {
    try {
      const userId = req.userId!;
      const { chatId } = req.params;

      const chat = await Chat.findOne({
        _id: chatId,
        participants: userId,
      });

      if (!chat) {
        res.status(404).json({
          success: false,
          message: "Chat not found",
          code: "CHAT_NOT_FOUND",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Chat retrieved successfully",
        data: this.mapChatToDto(chat),
      });
    } catch (error) {
      console.error("Error getting chat:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        code: "GET_CHAT_ERROR",
      });
    }
  };

  /**
   * Delete a chat
   * DELETE /api/chats/:chatId
   */
  deleteChat = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { chatId } = req.params;

      const chat = await Chat.findOneAndDelete({
        _id: chatId,
        participants: userId,
      });

      if (!chat) {
        res.status(404).json({
          success: false,
          message: "Chat not found or access denied",
          code: "CHAT_NOT_FOUND",
        });
        return;
      }

      // Delete all messages in this chat
      await Message.deleteMany({ chatId });

      res.status(200).json({
        success: true,
        message: "Chat and all messages deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting chat:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        code: "DELETE_CHAT_ERROR",
      });
    }
  };

  /**
   * Get total unread message count for current user
   * GET /api/chats/unread/count
   */
  getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;

      const chats = await Chat.find({ participants: userId }).select(
        "unreadCount"
      );

      const totalUnread = chats.reduce((sum, chat) => {
        return sum + (chat.unreadCount.get(userId) || 0);
      }, 0);

      res.status(200).json({
        success: true,
        message: "Unread count retrieved successfully",
        data: { unreadCount: totalUnread },
      });
    } catch (error) {
      console.error("Error getting unread count:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        code: "GET_UNREAD_COUNT_ERROR",
      });
    }
  };

  private mapChatToDto(chat: any): ChatResponseDto {
    return {
      id: chat._id?.toString?.() ?? chat.id ?? "",
      participants: chat.participants || [],
      lastMessage: chat.lastMessage ?? null,
      unreadCount: chat.unreadCount || {},
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    };
  }
}
