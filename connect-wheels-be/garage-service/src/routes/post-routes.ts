import { Router } from 'express';
import controller from '../controller/post-controller';
import {
  createPostValidator,
  updatePostValidator,
} from '../validator/post-validator';
import { authenticateJWT } from '../../../common/auth-middleware/auth_middleware';
import { uploadPostMedia } from '../middleware/upload-middleware';

const router = Router({ mergeParams: true });

router.get('/', controller.getGaragePosts);

// Files are received as multipart/form-data; multer saves them to disk.
router.post(
  '/',
  authenticateJWT,
  uploadPostMedia.array('images', 5),
  createPostValidator,
  controller.createPost
);

export default router;
