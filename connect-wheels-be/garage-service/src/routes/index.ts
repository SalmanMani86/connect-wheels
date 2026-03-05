import { Router } from 'express';
import garageRoutes from './garage-routes';
import carRoutes from './car-routes';
import postRoutes from './post-routes';

const router = Router();

// Car routes (/:garageId/cars)
router.use('/:garageId/cars', carRoutes);
// Post routes (/:garageId/posts)
router.use('/:garageId/posts', postRoutes);

// Garage routes + feed + single post (/, /search, /user/:userId, /feed, /posts/:postId, /:garageId)
router.use('/', garageRoutes);

export default router;
