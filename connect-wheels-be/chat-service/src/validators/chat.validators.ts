import { body, param, query } from "express-validator";

// ---- Chat creation ----
export const createChatValidation = [
  body("receiverId")
    .notEmpty()
    .withMessage("receiverId is required")
    .isString()
    .withMessage("receiverId must be a string")
    .trim(),
];

export const getChatByIdValidation = [
  param("chatId")
    .notEmpty()
    .withMessage("chatId is required")
    .isMongoId()
    .withMessage("chatId must be a valid MongoDB ID"),
];
export const deleteChatValidation = [
  param("chatId")
    .notEmpty()
    .withMessage("chatId is required")
    .isMongoId()
    .withMessage("chatId must be a valid MongoDB ID"),
];
export const getChatsValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100")
    .toInt(),
];
