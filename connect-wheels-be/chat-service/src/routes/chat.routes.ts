import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  createChatValidation,
  getChatByIdValidation,
  deleteChatValidation,
  getChatsValidation
} from "../validators/chat.validators";
import { markChatAsReadValidation } from '../validators/message.validator';

const router = Router();
const chatController = new ChatController();

// Apply authentication to all routes
 router.use(authenticateJWT);

/**
 * POST /api/chats
 * Create a new chat
 */
router.post(
  '/',
  createChatValidation,
  validateRequest,
  chatController.createChat
);

/**
 * GET /api/chats
 * Get all chats for current user (paginated)
 */
router.get(
  '/',
  getChatsValidation,
  validateRequest,
  chatController.getUserChats
);

/**
 * GET /api/chats/unread/count
 * Get total unread message count
 */
router.get('/unread/count', chatController.getUnreadCount);

/**
 * GET /api/chats/:chatId/read-all
 * Read all messages in a chat
 */
router.patch(
  '/:chatId/read-all',
  markChatAsReadValidation,
  validateRequest,
  chatController.readAllMessages
);

/**
 * GET /api/chats/:chatId
 * Get single chat by ID
 */
router.get(
  '/:chatId',
  getChatByIdValidation,
  validateRequest,
  chatController.getChatById
);

/**
 * DELETE /api/chats/:chatId
 * Delete a chat
 */
router.delete(
  '/:chatId',
  deleteChatValidation,
  validateRequest,
  chatController.deleteChat
);

export default router;
