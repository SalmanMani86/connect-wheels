import { Response } from 'express';
import { validationResult } from 'express-validator';
import carService from '../service/car-service';
import { AuthRequest } from '../../../common/auth-middleware/auth_middleware';

/** Build a relative API path for a car image saved by multer. */
const carImagePath = (filename: string) => `/api/garage/uploads/cars/${filename}`;

const browseCars = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const search = (req.query.q as string) || undefined;
    const result = await carService.browseCars(page, limit, search);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error browsing cars' });
  }
};

const addCar = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  try {
    const garageId = parseInt(req.params.garageId, 10);
    const ownerId = req.user?.id ?? req.user?.userId;
    if (isNaN(garageId)) {
      res.status(400).json({ message: 'Invalid garage ID' });
      return;
    }
    if (!ownerId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Build media paths from uploaded files (saved to disk by multer)
    const uploadedFiles = (req.files ?? []) as Express.Multer.File[];
    const mediaUrls = uploadedFiles.map((f) => carImagePath(f.filename));

    const data = {
      make: req.body.make,
      model: req.body.model,
      year: parseInt(req.body.year, 10),
      color: req.body.color || undefined,
      vin: req.body.vin || undefined,
      mileage: req.body.mileage ? parseInt(req.body.mileage, 10) : undefined,
      engineType: req.body.engineType || undefined,
      transmission: req.body.transmission || undefined,
      description: req.body.description || undefined,
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
    };

    const result = await carService.addCar(garageId, ownerId, data);
    res.status(201).json(result);
  } catch (error: any) {
    if (error?.message === 'Garage not found') {
      res.status(404).json({ message: 'Garage not found' });
      return;
    }
    if (error?.message?.includes('Forbidden')) {
      res.status(403).json({ message: error.message });
      return;
    }
    if (error?.code === '23505') {
      res.status(409).json({ message: 'VIN already exists' });
      return;
    }
    console.error(error);
    res.status(500).json({ message: 'Error adding car' });
  }
};

const getGarageCars = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const garageId = parseInt(req.params.garageId, 10);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (isNaN(garageId)) {
      res.status(400).json({ message: 'Invalid garage ID' });
      return;
    }

    const result = await carService.getGarageCars(garageId, page, limit);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching cars' });
  }
};

const getCar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const garageId = parseInt(req.params.garageId, 10);
    const carId = parseInt(req.params.carId, 10);

    if (isNaN(garageId) || isNaN(carId)) {
      res.status(400).json({ message: 'Invalid garage or car ID' });
      return;
    }

    const car = await carService.getCarById(garageId, carId);
    res.status(200).json({ car });
  } catch (error: any) {
    if (error?.message === 'Car not found') {
      res.status(404).json({ message: 'Car not found' });
      return;
    }
    console.error(error);
    res.status(500).json({ message: 'Error fetching car' });
  }
};

const updateCar = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  try {
    const garageId = parseInt(req.params.garageId, 10);
    const carId = parseInt(req.params.carId, 10);
    const ownerId = req.user?.id ?? req.user?.userId;

    if (isNaN(garageId) || isNaN(carId)) {
      res.status(400).json({ message: 'Invalid garage or car ID' });
      return;
    }
    if (!ownerId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Existing image paths the frontend wants to keep
    const rawKeep = req.body.keepMediaUrls;
    const keepMediaUrls: string[] = rawKeep
      ? Array.isArray(rawKeep) ? rawKeep : [rawKeep]
      : [];

    // Newly uploaded files saved to disk by multer
    const uploadedFiles = (req.files ?? []) as Express.Multer.File[];
    const newMediaUrls = uploadedFiles.map((f) => carImagePath(f.filename));

    const mediaUrls = [...keepMediaUrls, ...newMediaUrls];

    const data = {
      make: req.body.make || undefined,
      model: req.body.model || undefined,
      year: req.body.year ? parseInt(req.body.year, 10) : undefined,
      color: req.body.color || undefined,
      vin: req.body.vin || undefined,
      mileage: req.body.mileage ? parseInt(req.body.mileage, 10) : undefined,
      engineType: req.body.engineType || undefined,
      transmission: req.body.transmission || undefined,
      description: req.body.description || undefined,
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
    };

    const car = await carService.updateCar(garageId, carId, ownerId, data);
    res.status(200).json({ car });
  } catch (error: any) {
    if (error?.message === 'Car not found' || error?.message === 'Garage not found') {
      res.status(404).json({ message: error.message });
      return;
    }
    if (error?.message?.includes('Forbidden')) {
      res.status(403).json({ message: error.message });
      return;
    }
    console.error(error);
    res.status(500).json({ message: 'Error updating car' });
  }
};

const deleteCar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const garageId = parseInt(req.params.garageId, 10);
    const carId = parseInt(req.params.carId, 10);
    const ownerId = req.user?.id ?? req.user?.userId;

    if (isNaN(garageId) || isNaN(carId)) {
      res.status(400).json({ message: 'Invalid garage or car ID' });
      return;
    }
    if (!ownerId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    await carService.deleteCar(garageId, carId, ownerId);
    res.status(200).json({ message: 'Car deleted successfully' });
  } catch (error: any) {
    if (error?.message === 'Car not found' || error?.message === 'Garage not found') {
      res.status(404).json({ message: error.message });
      return;
    }
    if (error?.message?.includes('Forbidden')) {
      res.status(403).json({ message: error.message });
      return;
    }
    console.error(error);
    res.status(500).json({ message: 'Error deleting car' });
  }
};

const controller = {
  browseCars,
  addCar,
  getGarageCars,
  getCar,
  updateCar,
  deleteCar,
};

export default controller;
