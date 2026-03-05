import { Router } from 'express';
import controller from '../controller/car-controller';
import {
  createCarValidator,
  updateCarValidator,
} from '../validator/car-validator';
import { authenticateJWT } from '../../../common/auth-middleware/auth_middleware';
import { uploadCarMedia } from '../middleware/upload-middleware';

const router = Router({ mergeParams: true });

router.get('/', controller.getGarageCars);
router.get('/:carId', controller.getCar);

// Files are received as multipart/form-data; multer saves them to disk
// and populates req.files before the controller runs.
router.post(
  '/',
  authenticateJWT,
  uploadCarMedia.array('images', 5),
  createCarValidator,
  controller.addCar
);
router.put(
  '/:carId',
  authenticateJWT,
  uploadCarMedia.array('images', 5),
  updateCarValidator,
  controller.updateCar
);
router.delete('/:carId', authenticateJWT, controller.deleteCar);

export default router;
