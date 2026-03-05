import { Response } from 'express';
import followService from '../service/follow-service';
import { AuthRequest } from '../../../common/auth-middleware/auth_middleware';

const followGarage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const garageId = parseInt(req.params.garageId, 10);
    const userId = req.user?.id ?? req.user?.userId;
    if (isNaN(garageId)) { res.status(400).json({ message: 'Invalid garage ID' }); return; }
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const result = await followService.followGarage(userId, garageId);
    res.status(200).json(result); return;
  } catch (error: any) {
    if (error?.message === 'Garage not found') { res.status(404).json({ message: error.message }); return; }
    if (error?.message === 'Already following this garage') { res.status(409).json({ message: error.message }); return; }
    if (error?.message?.includes('own garage')) { res.status(400).json({ message: error.message }); return; }
    console.error(error);
    res.status(500).json({ message: 'Error following garage' });
  }
};

const unfollowGarage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const garageId = parseInt(req.params.garageId, 10);
    const userId = req.user?.id ?? req.user?.userId;
    if (isNaN(garageId)) { res.status(400).json({ message: 'Invalid garage ID' }); return; }
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const result = await followService.unfollowGarage(userId, garageId);
    res.status(200).json(result); return;
  } catch (error: any) {
    if (error?.message === 'Garage not found') { res.status(404).json({ message: error.message }); return; }
    console.error(error);
    res.status(500).json({ message: 'Error unfollowing garage' });
  }
};

const getFollowers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const garageId = parseInt(req.params.garageId, 10);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    if (isNaN(garageId)) { res.status(400).json({ message: 'Invalid garage ID' }); return; }

    const result = await followService.getFollowers(garageId, page, limit);
    res.status(200).json(result); return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching followers' });
  }
};

const getFollowing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    if (isNaN(userId)) { res.status(400).json({ message: 'Invalid user ID' }); return; }

    const result = await followService.getFollowing(userId, page, limit);
    res.status(200).json(result); return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching following' });
  }
};

const controller = { followGarage, unfollowGarage, getFollowers, getFollowing };
export default controller;
