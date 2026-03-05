import { body } from 'express-validator';

/**
 * Accepts:
 *  - Relative upload paths:  /api/garage/uploads/...
 *  - External https URLs:    https://...
 *  - Legacy http URLs:       http://...  (backward-compat for existing DB rows)
 */
const isValidImageValue = (v: unknown): boolean => {
  if (typeof v !== 'string' || v.length === 0) return false;
  return (
    v.startsWith('/api/garage/uploads/') ||
    v.startsWith('http://') ||
    v.startsWith('https://')
  );
};

export const createGarageValidator = [
  body('garageName')
    .notEmpty()
    .withMessage('Garage name is required')
    .trim(),
  body('userID')
    .optional()
    .isInt()
    .withMessage('Owner must be valid'),
  body('description').optional().trim(),
  body('pictureUrl')
    .optional()
    .custom((v: unknown) => !v || isValidImageValue(v))
    .withMessage('Picture must be a valid upload path or URL'),
  body('coverImageUrl')
    .optional()
    .custom((v: unknown) => !v || isValidImageValue(v))
    .withMessage('Cover image must be a valid upload path or URL'),
  body('location').optional().trim(),
];

export const updateGarageValidator = [
  body('name').optional().notEmpty().trim(),
  body('description').optional().trim(),
  body('pictureUrl')
    .optional()
    .custom((v: unknown) => !v || isValidImageValue(v))
    .withMessage('Picture must be a valid upload path or URL'),
  body('coverImageUrl')
    .optional()
    .custom((v: unknown) => !v || isValidImageValue(v))
    .withMessage('Cover image must be a valid upload path or URL'),
  body('location').optional().trim(),
];
