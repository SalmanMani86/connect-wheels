import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { Chat } from "../models/chat.model";
import { Message } from "../models/message.model";
import {
  SendMessageDto,
  GetMessagesQueryDto,
  MessageResponseDto,
  SendMessageResponseDto,
  GetMessagesResponseDto,
} from "../types/message.types";

export class MessageController {
  sendMessage = async (
    req: AuthRequest,
    res: Response<SendMessageResponseDto | any>
  ): Promise<void> => {
    try {
      // 1) Ensure we have an authenticated user
      if (!req.userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }
      const userId: string = req.userId;

      // 2) Validate incoming DTO (TypeScript typing only; runtime validation recommended)
      const sendMessageDto: SendMessageDto = req.body;
      const { chatId, content, type = "text" } = sendMessageDto;

      if (!chatId || !content) {
        res
          .status(400)
          .json({ success: false, message: "chatId and content are required" });
        return;
      }

      // 3) Verify chat exists and user is a participant
      const chat = await Chat.findOne({ _id: chatId, participants: userId });
      if (!chat) {
        res.status(404).json({
          success: false,
          message: "Chat not found or access denied",
          code: "CHAT_NOT_FOUND",
        });
        return;
      }

      // 4) Create the message
      const message = await Message.create({
        chatId,
        senderId: userId,
        content,
        type,
        readBy: [userId], // sender has read their own message
      });

      // 5) Update chat: lastMessage + unreadCount for receiver
      const receiverId = chat.participants.find((p) => p !== userId);
      chat.lastMessage = {
        content,
        senderId: userId,
        createdAt: message.createdAt,
      };

      if (receiverId) {
        // unreadCount is a Mongoose Map on the doc (requires string keys)
        const receiverIdStr = String(receiverId);
        const currentUnread = chat.unreadCount.get(receiverIdStr) || 0;
        chat.unreadCount.set(receiverIdStr, currentUnread + 1);
      }

      await chat.save();

      // 6) Respond with created message DTO
      res.status(201).json({
        success: true,
        message: "Message sent successfully",
        data: this.mapMessageToDto(message),
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
        code: "SEND_MESSAGE_ERROR",
      });
    }
  };
  getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const queryDto: GetMessagesQueryDto = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      };
      const userId = req.userId!;
      const { chatId } = req.params;
      const skip = (queryDto.page! - 1) * queryDto.limit!;

      const chat = await Chat.findOne({ _id: req.params.chatId });
      if (!chat) {
        res.status(404).json({
          success: false,
          message: "Chat not found or access denied",
          code: "CHAT_NOT_FOUND",
        });
        return;
      }
      const [messages, total] = await Promise.all([
        Message.find({ chatId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(queryDto.limit!)
          .lean(),
        Message.countDocuments({ chatId }),
      ]);
      messages.reverse();
      const response: GetMessagesResponseDto = {
        success: true,
        message: "Messages retrieved successfully",
        data: {
          messages: messages.map((msg) => this.mapMessageToDto(msg)),
          pagination: {
            page: queryDto.page!,
            limit: queryDto.limit!,
            total,
            totalPages: Math.ceil(total / queryDto.limit!),
          },
        },
      };
      res.status(200).json({ response });
    } catch (error) {
      console.error("Error getting messages:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        code: "GET_MESSAGES_ERROR",
      });
    }
  };
  /**
   * Mark a single message as read
   * PATCH /api/messages/:messageId/read
   */
  markMessageAsRead = async (
    req: AuthRequest,
    res: Response<SendMessageResponseDto | any>
  ): Promise<void> => {
    try {
      const userId = req.userId!;
      const { messageId } = req.params;

      const message = await Message.findById(messageId);

      if (!message) {
        res.status(404).json({
          success: false,
          message: "Message not found",
          code: "MESSAGE_NOT_FOUND",
        });
        return;
      }
      // Verify user has access to this chat
      const chat = await Chat.findOne({
        _id: message.chatId,
        participants: userId,
      });
      if (!chat) {
        res.status(403).json({
          success: false,
          message: "Access denied",
          code: "ACCESS_DENIED",
        });
        return;
      }
      if (!message.readBy.includes(userId)) {
        message.readBy.push(userId);
        await message.save();
      }
      // Mongoose Maps require string keys
      const userIdStr = String(userId);
      const unreadCount = chat.unreadCount.get(userIdStr) || 0;
      chat.unreadCount.set(userIdStr, Math.max(0, unreadCount - 1));
      chat.save();

      res.status(200).json({
        success: true,
        message: "Message marked as read",
        data: this.mapMessageToDto(message),
      });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        code: "MARK_READ_ERROR",
      });
    }
  };
  /**
   * Mark all messages in a chat as read
   * PATCH /api/messages/:chatId/read-all
   */
  readAllMessages = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const chatId = req.params.chatId;
      const userId = req.userId!; // assert non-undefined

      const chat = await Chat.findOne({
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
      // Mongoose Maps require string keys
      const userIdStr = String(userId);
      chat.unreadCount.set(userIdStr, 0);
      await chat.save();
      const result = await Message.updateMany(
        {
          chatId,
          readBy: { $ne: userId },
        },
        {
          $addToSet: { readBy: userId },
        }
      );
      res.status(200).json({
        success: true,
        message: "All messages marked as read",
        data: { updatedCount: result.modifiedCount },
      });
    } catch (error) {
      console.error("Error marking chat as read:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        code: "MARK_CHAT_READ_ERROR",
      });
    }
  };

  /**
   * Delete a message (only sender can delete)
   * DELETE /api/messages/:messageId
   */
  deleteMessage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { messageId } = req.params;

      const message = await Message.findOne({
        _id: messageId,
        senderId: userId,
      });

      if (!message) {
        res.status(404).json({
          success: false,
          message: "Message not found or you can only delete your own messages",
          code: "MESSAGE_NOT_FOUND",
        });
        return;
      }

      await message.deleteOne();

      res.status(200).json({
        success: true,
        message: "Message deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        code: "DELETE_MESSAGE_ERROR",
      });
    }
  };
  /**
   * Update message content (only sender can edit)
   * PATCH /api/messages/:messageId
   */
  updateMessage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.userId!;
      const { messageId } = req.params;
      const { content } = req.body;

      if (!content) {
        res.status(400).json({
          success: false,
          message: "Content is required",
        });
        return;
      }

      // Find the message where the user is the sender
      const message = await Message.findOne({
        _id: messageId,
        senderId: userId,
      });

      if (!message) {
        res.status(404).json({
          success: false,
          message: "Message not found or you can only edit your own messages",
        });
        return;
      }

      // Update content and set editedAt timestamp
      message.content = content;
      message.editedAt = new Date();
      await message.save();

      res.status(200).json({
        success: true,
        message: "Message updated successfully",
        data: this.mapMessageToDto(message),
      });
    } catch (error) {
      console.error("Error updating message:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        code: "UPDATE_MESSAGE_ERROR",
      });
    }
  };

  /**
   * Helper: convert Message doc -> MessageResponseDto (JSON-friendly)
   */
  private mapMessageToDto(message: any): MessageResponseDto {
    return {
      id: message._id?.toString?.() ?? message.id ?? "",
      chatId: message.chatId?.toString?.() ?? message.chatId ?? "",
      senderId: message.senderId,
      content: message.content,
      type: message.type,
      readBy: Array.isArray(message.readBy) ? message.readBy : [],
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      editedAt: message.editedAt || null,
    };
  }
}
