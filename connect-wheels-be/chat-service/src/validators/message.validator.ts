// ============================================
// 3. src/validators/message.validator.ts
// ============================================
import { body, param, query } from 'express-validator';

/**
 * Validation for sending a message
 * POST /api/messages
 */
export const sendMessageValidation = [
  body('chatId')
    .notEmpty()
    .withMessage('chatId is required')
    .isMongoId()
    .withMessage('chatId must be a valid MongoDB ID'),

  body('content')
    .notEmpty()
    .withMessage('Message content is required')
    .isString()
    .withMessage('Content must be a string')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message must be between 1 and 5000 characters')
    .matches(/^(?!.*<script|.*javascript:|.*onerror=).*$/i)
    .withMessage('Message contains potentially dangerous content'),

  body('type')
    .optional()
    .isIn(['text', 'image', 'file'])
    .withMessage("Message type must be 'text', 'image', or 'file'")
];

/**
 * Validation for getting messages with pagination
 * GET /api/messages/:chatId?page=1&limit=50
 */
export const getMessagesValidation = [
  param('chatId')
    .notEmpty()
    .withMessage('chatId is required')
    .isMongoId()
    .withMessage('chatId must be a valid MongoDB ID'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be between 1 and 100')
    .toInt()
];

/**
 * Validation for marking message as read
 * PATCH /api/messages/:messageId/read
 */
export const markMessageAsReadValidation = [
  param('messageId')
    .notEmpty()
    .withMessage('messageId is required')
    .isMongoId()
    .withMessage('messageId must be a valid MongoDB ID')
];

/**
 * Validation for marking all messages in chat as read
 * PATCH /api/messages/:chatId/read-all
 */
export const markChatAsReadValidation = [
  param('chatId')
    .notEmpty()
    .withMessage('chatId is required')
    .isMongoId()
    .withMessage('chatId must be a valid MongoDB ID')
];

/**
 * Validation for deleting message
 * DELETE /api/messages/:messageId
 */
export const deleteMessageValidation = [
  param('messageId')
    .notEmpty()
    .withMessage('messageId is required')
    .isMongoId()
    .withMessage('messageId must be a valid MongoDB ID')
];
