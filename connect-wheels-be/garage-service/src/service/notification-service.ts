import { AppDataSource } from '../data-source';
import { Notification, NotificationType } from '../entity/notification';

const repo = () => AppDataSource.getRepository(Notification);

export interface CreateNotificationInput {
  userId: number;
  type: NotificationType;
  data: Notification['data'];
}

export const createNotification = async (input: CreateNotificationInput) => {
  return repo().save(input);
};

export const getNotifications = async (
  userId: number,
  page: number = 1,
  limit: number = 20
) => {
  const [notifications, total] = await repo().findAndCount({
    where: { userId },
    order: { createdAt: 'DESC' },
    skip: (page - 1) * limit,
    take: limit,
  });
  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getUnreadCount = async (userId: number): Promise<number> => {
  return repo().count({ where: { userId, read: false } });
};

export const markAsRead = async (notificationId: number, userId: number) => {
  const n = await repo().findOne({ where: { id: notificationId, userId } });
  if (!n) return null;
  await repo().update(notificationId, { read: true });
  return repo().findOne({ where: { id: notificationId } });
};

export const markAllAsRead = async (userId: number) => {
  await repo().update({ userId }, { read: true });
  return { message: 'All notifications marked as read' };
};

const notificationService = {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};

export default notificationService;
