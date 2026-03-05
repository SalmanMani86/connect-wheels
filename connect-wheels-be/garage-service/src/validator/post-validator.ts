import { body } from 'express-validator';

const isValidImageValue = (v: unknown): boolean => {
  if (typeof v !== 'string' || v.length === 0) return false;
  return (
    v.startsWith('/api/garage/uploads/') ||
    v.startsWith('http://') ||
    v.startsWith('https://')
  );
};

export const createPostValidator = [
  body('title').optional().trim(),
  body('caption').optional().trim(),
  body('content').optional().trim(),
  body('mediaUrls')
    .optional()
    .isArray()
    .withMessage('mediaUrls must be an array'),
  body('mediaUrls')
    .optional()
    .custom((urls: unknown) => {
      if (!Array.isArray(urls)) return true;
      const invalid = urls.find((u) => !isValidImageValue(u));
      if (invalid !== undefined) throw new Error('Each media URL must be a valid upload path or URL');
      return true;
    }),
  body('isPublished').optional().isBoolean(),
];

export const updatePostValidator = [
  body('title').optional().trim(),
  body('caption').optional().trim(),
  body('content').optional().trim(),
  body('isPublished').optional().isBoolean(),
];
