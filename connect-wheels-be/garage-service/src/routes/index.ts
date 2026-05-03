import { Router } from 'express';
import garageRoutes from './garage-routes';
import carRoutes from './car-routes';
import postRoutes from './post-routes';
import carController from '../controller/car-controller';
import { authenticateJWT } from '../../../common/auth-middleware/auth_middleware';

const router = Router();

// Browse all cars across all garages (must be before /:garageId/cars to avoid param conflict)
router.get('/cars', authenticateJWT, carController.browseCars);

// Car routes (/:garageId/cars)
router.use('/:garageId/cars', carRoutes);
// Post routes (/:garageId/posts)
router.use('/:garageId/posts', postRoutes);

// Garage routes + feed + single post (/, /search, /user/:userId, /feed, /posts/:postId, /:garageId)
router.use('/', garageRoutes);

export default router;
