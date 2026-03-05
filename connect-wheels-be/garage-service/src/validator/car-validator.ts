import { body } from 'express-validator';

const currentYear = new Date().getFullYear();

const isValidImageValue = (v: unknown): boolean => {
  if (typeof v !== 'string' || v.length === 0) return false;
  return (
    v.startsWith('/api/garage/uploads/') ||
    v.startsWith('http://') ||
    v.startsWith('https://')
  );
};

export const createCarValidator = [
  body('make').notEmpty().withMessage('Make is required').trim(),
  body('model').notEmpty().withMessage('Model is required').trim(),
  body('year')
    .notEmpty()
    .withMessage('Year is required')
    .isInt({ min: 1886, max: currentYear + 2 })
    .withMessage(`Year must be between 1886 and ${currentYear + 2}`),
  body('color').optional().trim(),
  body('vin')
    .optional()
    .isLength({ min: 17, max: 17 })
    .withMessage('VIN must be 17 characters')
    .trim(),
  body('mileage')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Mileage must be a positive number'),
  body('engineType').optional().trim(),
  body('transmission').optional().trim(),
  body('pictureUrl')
    .optional()
    .custom((v: unknown) => !v || isValidImageValue(v))
    .withMessage('Picture must be a valid upload path or URL'),
  body('mediaUrls')
    .optional()
    .isArray()
    .withMessage('mediaUrls must be an array'),
  body('mediaUrls')
    .optional()
    .custom((urls: unknown) => {
      if (!Array.isArray(urls)) return true;
      if (urls.length > 5) throw new Error('Maximum 5 images allowed');
      const invalid = urls.find((u) => !isValidImageValue(u));
      if (invalid !== undefined) throw new Error('Each media URL must be a valid upload path or URL');
      return true;
    }),
  body('description').optional().trim(),
];

export const updateCarValidator = [
  body('make').optional().notEmpty().trim(),
  body('model').optional().notEmpty().trim(),
  body('year')
    .optional()
    .isInt({ min: 1886, max: currentYear + 2 })
    .withMessage(`Year must be between 1886 and ${currentYear + 2}`),
  body('color').optional().trim(),
  body('vin')
    .optional()
    .isLength({ min: 17, max: 17 })
    .withMessage('VIN must be 17 characters')
    .trim(),
  body('mileage')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Mileage must be a positive number'),
  body('engineType').optional().trim(),
  body('transmission').optional().trim(),
  body('pictureUrl')
    .optional()
    .custom((v: unknown) => !v || isValidImageValue(v))
    .withMessage('Picture must be a valid upload path or URL'),
  body('mediaUrls')
    .optional()
    .isArray()
    .withMessage('mediaUrls must be an array'),
  body('mediaUrls')
    .optional()
    .custom((urls: unknown) => {
      if (!Array.isArray(urls)) return true;
      if (urls.length > 5) throw new Error('Maximum 5 images allowed');
      const invalid = urls.find((u) => !isValidImageValue(u));
      if (invalid !== undefined) throw new Error('Each media URL must be a valid upload path or URL');
      return true;
    }),
  body('description').optional().trim(),
];
