import { body } from 'express-validator';

export const addCommentValidator = [
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ max: 5000 })
    .withMessage('Content must be at most 5000 characters')
    .trim(),
  body('parentCommentId')
    .optional()
    .isInt()
    .withMessage('parentCommentId must be an integer'),
];

export const updateCommentValidator = [
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ max: 5000 })
    .withMessage('Content must be at most 5000 characters')
    .trim(),
];
