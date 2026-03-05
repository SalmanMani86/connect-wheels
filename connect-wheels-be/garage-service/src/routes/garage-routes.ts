import { Router } from 'express';
import controller from '../controller/garage-controller';
import socialController from '../controller/social-controller';
import postController from '../controller/post-controller';
import commentController from '../controller/comment-controller';
import uploadController from '../controller/upload-controller';
import notificationController from '../controller/notification-controller';
import {
  createGarageValidator,
  updateGarageValidator,
} from '../validator/garage-validator';
import { updatePostValidator } from '../validator/post-validator';
import {
  addCommentValidator,
  updateCommentValidator,
} from '../validator/comment-validator';
import { authenticateJWT } from '../../../common/auth-middleware/auth_middleware';
import { uploadGarageCover, uploadPostMedia, uploadCarImage, uploadCarMedia } from '../middleware/upload-middleware';

const router = Router();

// File upload endpoints (must be before other routes)
router.post(
  '/upload/garage-cover',
  authenticateJWT,
  uploadGarageCover.single('coverImage'),
  uploadController.uploadGarageCover
);
router.post(
  '/upload/post-media',
  authenticateJWT,
  uploadPostMedia.array('images', 5),
  uploadController.uploadPostMedia
);
router.post(
  '/upload/car-image',
  authenticateJWT,
  uploadCarImage.single('carImage'),
  uploadController.uploadCarImage
);
router.post(
  '/upload/car-media',
  authenticateJWT,
  uploadCarMedia.array('images', 5),
  uploadController.uploadCarMedia
);

// Notifications (auth required)
router.get('/notifications', authenticateJWT, notificationController.getNotifications);
router.get('/notifications/unread/count', authenticateJWT, notificationController.getUnreadCount);
router.patch('/notifications/:id/read', authenticateJWT, notificationController.markAsRead);
router.patch('/notifications/read-all', authenticateJWT, notificationController.markAllAsRead);

// Public routes (no auth)
router.get('/search', controller.searchGarages);
router.get('/user/:userId/following', socialController.getFollowing);
router.get('/user/:userId', controller.getUserGarages);
router.get('/feed/trending', postController.getTrendingPosts);
router.get('/feed', authenticateJWT, postController.getFeed);
router.get('/posts/:postId', postController.getPost);
router.put('/posts/:postId', authenticateJWT, updatePostValidator, postController.updatePost);
router.delete('/posts/:postId', authenticateJWT, postController.deletePost);
router.post('/posts/:postId/like', authenticateJWT, commentController.likePost);
router.delete('/posts/:postId/unlike', authenticateJWT, commentController.unlikePost);
router.get('/posts/:postId/likes', commentController.getPostLikes);
router.post('/posts/:postId/comments', authenticateJWT, addCommentValidator, commentController.addComment);
router.get('/posts/:postId/comments', commentController.getPostComments);
router.put('/comments/:commentId', authenticateJWT, updateCommentValidator, commentController.updateComment);
router.delete('/comments/:commentId', authenticateJWT, commentController.deleteComment);
router.post('/comments/:commentId/like', authenticateJWT, commentController.likeComment);
router.delete('/comments/:commentId/unlike', authenticateJWT, commentController.unlikeComment);
router.get('/:garageId/followers', socialController.getFollowers);
router.get('/:garageId', controller.getGarage);

// Protected routes (auth required)
router.post('/:garageId/follow', authenticateJWT, socialController.followGarage);
router.post(
  '/create-garage',
  authenticateJWT,
  createGarageValidator,
  controller.createGarage
);
// coverImage file is optional — multer saves it to disk if present
router.put(
  '/:garageId',
  authenticateJWT,
  uploadGarageCover.single('coverImage'),
  updateGarageValidator,
  controller.updateGarage
);
router.delete('/:garageId/unfollow', authenticateJWT, socialController.unfollowGarage);
router.delete('/:garageId', authenticateJWT, controller.deleteGarage);

export default router;
