import { body } from "express-validator";

export const deleteUserValidator = [
    body('userID').isInt().notEmpty().withMessage('User is required'),
];

export const updateProfileValidator = [
    body('firstName').optional().isString().trim(),
    body('lastName').optional().isString().trim(),
];

export const changePasswordValidator = [
    body('currentPassword').optional().isString().withMessage('Current password required for email users'),
    body('newPassword').isString().isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];
