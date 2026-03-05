import { IsNull } from 'typeorm';
import { AppDataSource } from '../data-source';
import { PostComment } from '../entity/post-comment';
import { CommentLike } from '../entity/comment-like';
import { Post } from '../entity/post';
import notificationService from './notification-service';

const commentRepo = () => AppDataSource.getRepository(PostComment);
const likeRepo = () => AppDataSource.getRepository(CommentLike);
const postRepo = () => AppDataSource.getRepository(Post);

export const addComment = async (
  postId: number,
  userId: number,
  content: string,
  parentCommentId?: number
) => {
  const post = await postRepo().findOne({ where: { id: postId }, relations: ['garage'] });
  if (!post) throw new Error('Post not found');

  const comment = await commentRepo().save({
    postId,
    userId,
    content,
    ...(parentCommentId != null && { parentCommentId }),
  });

  await postRepo().increment({ id: postId }, 'commentsCount', 1);

  // Notify post owner (garage owner) if not self-comment
  const ownerId = post.garage?.ownerId;
  if (ownerId && ownerId !== userId) {
    await notificationService.createNotification({
      userId: ownerId,
      type: 'POST_COMMENT',
      data: {
        actorUserId: userId,
        postId,
        postTitle: post.title,
        garageId: post.garageId,
        garageName: post.garage?.name,
        commentId: comment.id,
        commentPreview: content.slice(0, 100),
      },
    }).catch((err) => console.warn('Failed to create comment notification:', err));
  }

  if (parentCommentId) {
    await commentRepo().increment({ id: parentCommentId }, 'repliesCount', 1);
  }

  return {
    message: 'Comment added',
    comment: {
      id: comment.id,
      postId,
      userId,
      content: comment.content,
      likesCount: 0,
      repliesCount: 0,
      parentCommentId: comment.parentCommentId,
      createdAt: comment.createdAt,
    },
  };
};

export const getPostComments = async (
  postId: number,
  page: number = 1,
  limit: number = 20,
  sort: 'recent' | 'popular' | 'oldest' = 'recent'
) => {
  const order: Record<string, 'ASC' | 'DESC'> =
    sort === 'oldest'
      ? { createdAt: 'ASC' }
      : sort === 'popular'
        ? { likesCount: 'DESC', createdAt: 'DESC' }
        : { createdAt: 'DESC' };

  const [comments, total] = await commentRepo().findAndCount({
    where: { postId, parentCommentId: IsNull() },
    order,
    skip: (page - 1) * limit,
    take: limit,
  });

  const withReplies = await Promise.all(
    comments.map(async (c) => {
      const replies = await commentRepo().find({
        where: { parentCommentId: c.id },
        order: { createdAt: 'ASC' },
      });
      return { ...c, replies };
    })
  );

  return {
    comments: withReplies,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const updateComment = async (commentId: number, userId: number, content: string) => {
  const comment = await commentRepo().findOne({ where: { id: commentId } });
  if (!comment) throw new Error('Comment not found');
  if (comment.userId !== userId) throw new Error('Forbidden: Not comment owner');

  await commentRepo().update(commentId, { content, isEdited: true });
  return commentRepo().findOne({ where: { id: commentId } });
};

const countReplies = async (commentId: number): Promise<number> => {
  const replies = await commentRepo().find({ where: { parentCommentId: commentId } });
  let count = replies.length;
  for (const r of replies) {
    count += await countReplies(r.id);
  }
  return count;
};

export const deleteComment = async (commentId: number, userId: number) => {
  const comment = await commentRepo().findOne({ where: { id: commentId } });
  if (!comment) throw new Error('Comment not found');
  if (comment.userId !== userId) throw new Error('Forbidden: Not comment owner');

  const repliesCount = await countReplies(commentId);
  const totalToRemove = 1 + repliesCount;

  await commentRepo().delete(commentId);
  await postRepo().decrement({ id: comment.postId }, 'commentsCount', totalToRemove);
  if (comment.parentCommentId) {
    await commentRepo().decrement({ id: comment.parentCommentId }, 'repliesCount', 1);
  }
  return { message: 'Comment deleted successfully' };
};

export const likeComment = async (commentId: number, userId: number) => {
  const comment = await commentRepo().findOne({ where: { id: commentId } });
  if (!comment) throw new Error('Comment not found');

  const existing = await likeRepo().findOne({ where: { commentId, userId } });
  if (existing) {
    return { isLiked: true, likesCount: comment.likesCount };
  }

  await likeRepo().save({ commentId, userId });
  await commentRepo().increment({ id: commentId }, 'likesCount', 1);
  const updated = await commentRepo().findOne({ where: { id: commentId } });
  return { isLiked: true, likesCount: updated?.likesCount ?? comment.likesCount + 1 };
};

export const unlikeComment = async (commentId: number, userId: number) => {
  const result = await likeRepo().delete({ commentId, userId });
  if (result.affected && result.affected > 0) {
    await commentRepo().decrement({ id: commentId }, 'likesCount', 1);
  }
  const updated = await commentRepo().findOne({ where: { id: commentId } });
  return { isLiked: false, likesCount: Math.max(0, updated?.likesCount ?? 0) };
};

const commentService = {
  addComment,
  getPostComments,
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment,
};
export default commentService;
