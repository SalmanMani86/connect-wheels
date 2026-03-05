import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import garageService from '../service/garage-service';
import { GarageDTO } from '../dtos/garage-dto';
import { GarageUpdateDTO } from '../dtos/garage-dto';
import { checkUserGrpc } from '../grpc/services/user-grpc-service';
import { AuthRequest } from '../../../common/auth-middleware/auth_middleware';

const createGarage = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const userId = req.body?.userID ?? req.user?.id ?? req.user?.userId;
  if (!userId) {
    res.status(400).json({ message: 'User ID is required' });
    return;
  }

  const garageData: GarageDTO = {
    name: req.body.garageName,
    ownerId: userId,
    description: req.body.description,
    pictureUrl: req.body.pictureURL ?? req.body.pictureUrl,
    coverImageUrl: req.body.coverImageUrl,
    location: req.body.location,
  };

  try {
    const userExists = await checkUserGrpc(garageData.ownerId);
    if (!userExists) {
      res.status(400).json({ message: 'User does not exist' });
      return;
    }
    const result = await garageService.createGarage(garageData);
    res.status(201).json(result);
    return;
  } catch (error: any) {
    if (error?.code === '23505') {
        res.status(409).json({ message: 'Garage name already exists' });
        return;
    }
    console.error(error);
    res.status(500).json({
      message: 'Error creating garage',
      error: process.env.NODE_ENV === 'development' ? error?.message : undefined,
    });
  }
};

const getGarage = async (req: Request, res: Response): Promise<void> => {
  try {
    const garageId = parseInt(req.params.garageId, 10);
    if (isNaN(garageId)) {
      res.status(400).json({ message: 'Invalid garage ID' });
      return;
    }
    const garage = await garageService.getGarageById(garageId);
    res.status(200).json({ garage });
    return;
  } catch (error: any) {
    if (error?.message === 'Garage not found') {
      res.status(404).json({ message: 'Garage not found' });
      return;
    }
    console.error(error);
    res.status(500).json({ message: 'Error fetching garage' });
    return;
  }
};

const updateGarage = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // If a new cover image was uploaded (multipart), use it; otherwise keep
    // whatever was sent in the body (existing relative path or nothing).
    const coverImageUrl = req.file
      ? `/api/garage/uploads/garage-covers/${req.file.filename}`
      : req.body.coverImageUrl;

    const data: GarageUpdateDTO = {
      name: req.body.name,
      description: req.body.description,
      pictureUrl: req.body.pictureUrl,
      coverImageUrl,
      location: req.body.location,
    };

    const garage = await garageService.updateGarage(garageId, ownerId, data);
    res.status(200).json({ garage });
    return;
  } catch (error: any) {
    if (error?.message === 'Garage not found') {
      res.status(404).json({ message: 'Garage not found' });
      return;
    }
    if (error?.message?.includes('Forbidden')) {
      res.status(403).json({ message: error.message });
      return;
    }
    console.error(error);
    res.status(500).json({ message: 'Error updating garage' });
    return;
  }
};

const deleteGarage = async (req: AuthRequest, res: Response): Promise<void> => {
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

    await garageService.deleteGarage(garageId, ownerId);
    res.status(200).json({ message: 'Garage deleted successfully' });
    return;
  } catch (error: any) {
    if (error?.message === 'Garage not found') {
      res.status(404).json({ message: 'Garage not found' });
      return;
    }
    if (error?.message?.includes('Forbidden')) {
      res.status(403).json({ message: error.message });
      return;
    }
    console.error(error);
    res.status(500).json({ message: 'Error deleting garage' });
    return;
  }
};

const getUserGarages = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (isNaN(userId)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }

    const result = await garageService.getUserGarages(userId, page, limit);
    res.status(200).json(result);
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching garages' });
    return;
  }
};

const searchGarages = async (req: Request, res: Response): Promise<void> => {
  try {
    const q = (req.query.q as string) || '';
    const location = req.query.location as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await garageService.searchGarages(q, location, page, limit);
    res.status(200).json(result);
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error searching garages' });
    return;
  }
};

// For Kafka consumer (internal use)
const deleteGarageByOwnerID = async (ownerID: number) => {
  if (isNaN(ownerID)) {
    console.error('missing or invalid userId');
    return;
  }
  return garageService.deleteGarageByOwnerID(ownerID);
};

const controller = {
  createGarage,
  getGarage,
  updateGarage,
  deleteGarage,
  getUserGarages,
  searchGarages,
  deleteGarageByOwnerID,
};

export default controller;
