import { AppDataSource } from '../data-source';
import { PostLike } from '../entity/post-like';
import { Post } from '../entity/post';
import notificationService from './notification-service';

const likeRepo = () => AppDataSource.getRepository(PostLike);
const postRepo = () => AppDataSource.getRepository(Post);

export const likePost = async (postId: number, userId: number) => {
  const post = await postRepo().findOne({ where: { id: postId }, relations: ['garage'] });
  if (!post) throw new Error('Post not found');

  const existing = await likeRepo().findOne({ where: { postId, userId } });
  if (existing) {
    return { message: 'Already liked', isLiked: true, likesCount: post.likesCount };
  }

  await likeRepo().save({ postId, userId });
  await postRepo().increment({ id: postId }, 'likesCount', 1);

  // Notify post owner (garage owner) if not self-like
  const ownerId = post.garage?.ownerId;
  if (ownerId && ownerId !== userId) {
    await notificationService.createNotification({
      userId: ownerId,
      type: 'POST_LIKE',
      data: { actorUserId: userId, postId, postTitle: post.title, garageId: post.garageId, garageName: post.garage?.name },
    }).catch((err) => console.warn('Failed to create like notification:', err));
  }

  const updated = await postRepo().findOne({ where: { id: postId } });
  return {
    message: 'Post liked',
    isLiked: true,
    likesCount: updated?.likesCount ?? post.likesCount + 1,
  };
};

export const unlikePost = async (postId: number, userId: number) => {
  const result = await likeRepo().delete({ postId, userId });
  if (result.affected && result.affected > 0) {
    await postRepo().decrement({ id: postId }, 'likesCount', 1);
  }
  const updated = await postRepo().findOne({ where: { id: postId } });
  return {
    message: 'Post unliked',
    isLiked: false,
    likesCount: Math.max(0, updated?.likesCount ?? 0),
  };
};

export const isPostLiked = async (postId: number, userId: number): Promise<boolean> => {
  if (!userId) return false;
  const like = await likeRepo().findOne({ where: { postId, userId } });
  return !!like;
};

export const getPostLikes = async (postId: number, page: number = 1, limit: number = 20) => {
  const [likes, total] = await likeRepo().findAndCount({
    where: { postId },
    order: { createdAt: 'DESC' },
    skip: (page - 1) * limit,
    take: limit,
  });
  return {
    likes: likes.map((l) => ({ userId: l.userId, likedAt: l.createdAt })),
    total,
    pagination: { page, limit, totalPages: Math.ceil(total / limit) },
  };
};

const likeService = { likePost, unlikePost, isPostLiked, getPostLikes };
export default likeService;
