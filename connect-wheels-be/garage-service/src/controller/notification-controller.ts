import { Response } from 'express';
import notificationService from '../service/notification-service';
import { AuthRequest } from '../../../common/auth-middleware/auth_middleware';

const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id ?? req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = Math.min(parseInt((req.query.limit as string) || '20', 10), 50);
    const result = await notificationService.getNotifications(userId, page, limit);
    res.status(200).json(result);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id ?? req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const count = await notificationService.getUnreadCount(userId);
    res.status(200).json({ data: { unreadCount: count } });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
};

const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id ?? req.user?.userId;
    const notificationId = parseInt(req.params.id, 10);
    if (!userId || isNaN(notificationId)) {
      res.status(400).json({ message: 'Invalid request' });
      return;
    }
    const notification = await notificationService.markAsRead(notificationId, userId);
    if (!notification) {
      res.status(404).json({ message: 'Notification not found' });
      return;
    }
    res.status(200).json({ notification });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Failed to mark as read' });
  }
};

const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id ?? req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const result = await notificationService.markAllAsRead(userId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ message: 'Failed to mark all as read' });
  }
};

const controller = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};

export default controller;
