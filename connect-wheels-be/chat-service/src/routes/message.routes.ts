// ============================================
// 9. src/routes/message.routes.ts
// ============================================
import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import {
  sendMessageValidation,
  getMessagesValidation,
  markMessageAsReadValidation,
  markChatAsReadValidation,
  deleteMessageValidation
} from '../validators/message.validator';

const router = Router();
const messageController = new MessageController();

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * POST /api/messages
 * Send a new message
 */
router.post(
  '/',
  sendMessageValidation,
  validateRequest,
  messageController.sendMessage
);

/**
 * GET /api/messages/:chatId
 * Get all messages in a chat (paginated)
 */
router.get(
  '/:chatId',
  getMessagesValidation,
  validateRequest,
  messageController.getMessages
);

/**
 * PATCH /api/messages/:messageId/read
 * Mark a single message as read
 */
router.patch(
  '/:messageId/read',
  markMessageAsReadValidation,
  validateRequest,
  messageController.markMessageAsRead
);

/**
 * PATCH /api/messages/:chatId/read-all
 * Mark all messages in a chat as read
 */
router.patch(
  '/:chatId/read-all',
  markChatAsReadValidation,
  validateRequest,
  messageController.readAllMessages
);

/**
 * DELETE /api/messages/:messageId
 * Delete a message (only sender can delete)
 */
router.delete(
  '/:messageId',
  deleteMessageValidation,
  validateRequest,
  messageController.deleteMessage
);

export default router;
