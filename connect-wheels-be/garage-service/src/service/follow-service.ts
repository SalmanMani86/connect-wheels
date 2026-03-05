import { AppDataSource } from '../data-source';
import { UserGarageFollow } from '../entity/user-garage-follow';
import { Garage } from '../entity/garage';
import notificationService from './notification-service';

const followRepo = () => AppDataSource.getRepository(UserGarageFollow);
const garageRepo = () => AppDataSource.getRepository(Garage);

export const followGarage = async (userId: number, garageId: number) => {
  const garage = await garageRepo().findOne({ where: { id: garageId } });
  if (!garage) throw new Error('Garage not found');
  if (garage.ownerId === userId) throw new Error('Cannot follow your own garage');

  const existing = await followRepo().findOne({ where: { userId, garageId } });
  if (existing) throw new Error('Already following this garage');

  await followRepo().save({ userId, garageId });
  await garageRepo().increment({ id: garageId }, 'followersCount', 1);

  // Notify garage owner
  await notificationService.createNotification({
    userId: garage.ownerId,
    type: 'GARAGE_FOLLOW',
    data: { actorUserId: userId, garageId, garageName: garage.name },
  }).catch((err) => console.warn('Failed to create follow notification:', err));

  const updated = await garageRepo().findOne({ where: { id: garageId } });
  return {
    message: 'Successfully followed garage',
    isFollowing: true,
    followersCount: updated?.followersCount ?? garage.followersCount + 1,
  };
};

export const unfollowGarage = async (userId: number, garageId: number) => {
  const result = await followRepo().delete({ userId, garageId });
  if (result.affected && result.affected > 0) {
    await garageRepo().decrement({ id: garageId }, 'followersCount', 1);
  }
  const updated = await garageRepo().findOne({ where: { id: garageId } });
  return {
    message: 'Successfully unfollowed garage',
    isFollowing: false,
    followersCount: updated?.followersCount ?? 0,
  };
};

export const isFollowing = async (userId: number, garageId: number): Promise<boolean> => {
  if (!userId) return false;
  const follow = await followRepo().findOne({ where: { userId, garageId } });
  return !!follow;
};

export const getFollowers = async (
  garageId: number,
  page: number = 1,
  limit: number = 20
) => {
  const [follows, total] = await followRepo().findAndCount({
    where: { garageId },
    order: { createdAt: 'DESC' },
    skip: (page - 1) * limit,
    take: limit,
  });
  const followers = follows.map((f) => ({
    userId: f.userId,
    followedAt: f.createdAt,
  }));
  return {
    followers,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getFollowing = async (
  userId: number,
  page: number = 1,
  limit: number = 20
) => {
  const [follows, total] = await followRepo().findAndCount({
    where: { userId },
    relations: ['garage'],
    order: { createdAt: 'DESC' },
    skip: (page - 1) * limit,
    take: limit,
  });
  const garages = follows.map((f) => ({
    garageId: f.garageId,
    garage: f.garage,
    followedAt: f.createdAt,
  }));
  return {
    following: garages,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const followService = {
  followGarage,
  unfollowGarage,
  isFollowing,
  getFollowers,
  getFollowing,
};

export default followService;
