import { Response } from 'express';
import { AuthRequest } from '../../../common/auth-middleware/auth_middleware';

/**
 * Returns a relative path for the uploaded file.
 * Storing relative paths in the DB means images work in any environment
 * (dev, staging, prod) without URL rewriting hacks. The frontend resolves
 * the full URL by prepending the API origin from VITE_API_URL.
 */
const toRelativePath = (uploadPath: string): string =>
  uploadPath.startsWith('/') ? uploadPath : `/${uploadPath}`;

const uploadGarageCover = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No cover image file provided' });
      return;
    }
    const url = toRelativePath(`/api/garage/uploads/garage-covers/${req.file.filename}`);
    res.status(200).json({ url });
  } catch (error) {
    console.error('Upload garage cover error:', error);
    res.status(500).json({ message: 'Failed to upload cover image' });
  }
};

const uploadPostMedia = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files?.length) {
      res.status(400).json({ message: 'No image files provided' });
      return;
    }
    const urls = files.map((f) => toRelativePath(`/api/garage/uploads/posts/${f.filename}`));
    res.status(200).json({ urls });
  } catch (error) {
    console.error('Upload post media error:', error);
    res.status(500).json({ message: 'Failed to upload images' });
  }
};

const uploadCarImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No car image file provided' });
      return;
    }
    const url = toRelativePath(`/api/garage/uploads/cars/${req.file.filename}`);
    res.status(200).json({ url });
  } catch (error) {
    console.error('Upload car image error:', error);
    res.status(500).json({ message: 'Failed to upload car image' });
  }
};

const uploadCarMedia = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files?.length) {
      res.status(400).json({ message: 'No car image files provided' });
      return;
    }
    const urls = files.map((f) => toRelativePath(`/api/garage/uploads/cars/${f.filename}`));
    res.status(200).json({ urls });
  } catch (error) {
    console.error('Upload car media error:', error);
    res.status(500).json({ message: 'Failed to upload car images' });
  }
};

const uploadController = {
  uploadGarageCover,
  uploadPostMedia,
  uploadCarImage,
  uploadCarMedia,
};

export default uploadController;
