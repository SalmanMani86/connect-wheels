import { AppDataSource } from '../data-source';
import { Post } from '../entity/post';
import { PostMedia } from '../entity/post-media';
import { UserGarageFollow } from '../entity/user-garage-follow';

const postRepo = () => AppDataSource.getRepository(Post);
const mediaRepo = () => AppDataSource.getRepository(PostMedia);
const followRepo = () => AppDataSource.getRepository(UserGarageFollow);

export const getPersonalizedFeed = async (
  userId: number,
  page: number = 1,
  limit: number = 20
) => {
  const follows = await followRepo().find({
    where: { userId },
    select: ['garageId'],
  });
  const garageIds = follows.map((f) => f.garageId);
  if (garageIds.length === 0) {
    return { feed: [], pagination: { page, limit, total: 0, totalPages: 0 } };
  }

  const [posts, total] = await postRepo()
    .createQueryBuilder('post')
    .where('post.garageId IN (:...garageIds)', { garageIds })
    .andWhere('post.isPublished = :published', { published: true })
    .leftJoinAndSelect('post.garage', 'garage')
    .orderBy('post.createdAt', 'DESC')
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();

  const feed = await Promise.all(
    posts.map(async (p) => {
      const media = await mediaRepo().find({
        where: { postId: p.id },
        order: { displayOrder: 'ASC' },
      });
      return { ...p, media };
    })
  );

  return {
    feed,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const getTrendingPosts = async (
  timeframe: 'day' | 'week' | 'month' | 'all' = 'week',
  page: number = 1,
  limit: number = 20
) => {
  const qb = postRepo()
    .createQueryBuilder('post')
    .leftJoinAndSelect('post.garage', 'garage')
    .where('post.isPublished = :published', { published: true });

  if (timeframe !== 'all') {
    const date = new Date();
    if (timeframe === 'day') date.setDate(date.getDate() - 1);
    else if (timeframe === 'week') date.setDate(date.getDate() - 7);
    else if (timeframe === 'month') date.setMonth(date.getMonth() - 1);
    qb.andWhere('post.createdAt >= :since', { since: date });
  }

  qb.orderBy('post.likesCount', 'DESC')
    .addOrderBy('post.commentsCount', 'DESC')
    .addOrderBy('post.createdAt', 'DESC')
    .skip((page - 1) * limit)
    .take(limit);

  const [posts, total] = await qb.getManyAndCount();

  const feed = await Promise.all(
    posts.map(async (p) => {
      const media = await mediaRepo().find({
        where: { postId: p.id },
        order: { displayOrder: 'ASC' },
      });
      return { ...p, media };
    })
  );

  return {
    feed,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const feedService = {
  getPersonalizedFeed,
  getTrendingPosts,
};

export default feedService;
