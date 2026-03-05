import { Response } from 'express';
import { validationResult } from 'express-validator';
import commentService from '../service/comment-service';
import likeService from '../service/like-service';
import { AuthRequest } from '../../../common/auth-middleware/auth_middleware';

const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

  try {
    const postId = parseInt(req.params.postId, 10);
    const userId = req.user?.id ?? req.user?.userId;
    const content = req.body.content?.trim();
    const parentCommentId = req.body.parentCommentId
      ? parseInt(req.body.parentCommentId, 10)
      : undefined;

    if (isNaN(postId)) { res.status(400).json({ message: 'Invalid post ID' }); return; }
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }
    if (!content || content.length === 0) { res.status(400).json({ message: 'Content is required' }); return; }

    const result = await commentService.addComment(postId, userId, content, parentCommentId);
    res.status(201).json(result); return;
  } catch (error: any) {
    if (error?.message === 'Post not found') { res.status(404).json({ message: error.message }); return; }
    console.error(error);
    res.status(500).json({ message: 'Error adding comment' });
  }
};

const getPostComments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const postId = parseInt(req.params.postId, 10);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const sort = (req.query.sort as 'recent' | 'popular' | 'oldest') || 'recent';

    if (isNaN(postId)) { res.status(400).json({ message: 'Invalid post ID' }); return; }

    const result = await commentService.getPostComments(postId, page, limit, sort);
    res.status(200).json(result); return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching comments' });
  }
};

const updateComment = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

  try {
    const commentId = parseInt(req.params.commentId, 10);
    const userId = req.user?.id ?? req.user?.userId;
    const content = req.body.content?.trim();

    if (isNaN(commentId)) { res.status(400).json({ message: 'Invalid comment ID' }); return; }
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }
    if (!content || content.length === 0) { res.status(400).json({ message: 'Content is required' }); return; }

    const comment = await commentService.updateComment(commentId, userId, content);
    res.status(200).json({ comment }); return;
  } catch (error: any) {
    if (error?.message === 'Comment not found') { res.status(404).json({ message: error.message }); return; }
    if (error?.message?.includes('Forbidden')) { res.status(403).json({ message: error.message }); return; }
    console.error(error);
    res.status(500).json({ message: 'Error updating comment' });
  }
};

const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const commentId = parseInt(req.params.commentId, 10);
    const userId = req.user?.id ?? req.user?.userId;

    if (isNaN(commentId)) { res.status(400).json({ message: 'Invalid comment ID' }); return; }
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    await commentService.deleteComment(commentId, userId);
    res.status(200).json({ message: 'Comment deleted successfully' }); return;
  } catch (error: any) {
    if (error?.message === 'Comment not found') { res.status(404).json({ message: error.message }); return; }
    if (error?.message?.includes('Forbidden')) { res.status(403).json({ message: error.message }); return; }
    console.error(error);
    res.status(500).json({ message: 'Error deleting comment' });
  }
};

const likePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const postId = parseInt(req.params.postId, 10);
    const userId = req.user?.id ?? req.user?.userId;

    if (isNaN(postId)) { res.status(400).json({ message: 'Invalid post ID' }); return; }
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const result = await likeService.likePost(postId, userId);
    res.status(200).json(result); return;
  } catch (error: any) {
    if (error?.message === 'Post not found') { res.status(404).json({ message: error.message }); return; }
    console.error(error);
    res.status(500).json({ message: 'Error liking post' });
  }
};

const unlikePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const postId = parseInt(req.params.postId, 10);
    const userId = req.user?.id ?? req.user?.userId;

    if (isNaN(postId)) { res.status(400).json({ message: 'Invalid post ID' }); return; }
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const result = await likeService.unlikePost(postId, userId);
    res.status(200).json(result); return;
  } catch (error: any) {
    if (error?.message === 'Post not found') { res.status(404).json({ message: error.message }); return; }
    console.error(error);
    res.status(500).json({ message: 'Error unliking post' });
  }
};

const getPostLikes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const postId = parseInt(req.params.postId, 10);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (isNaN(postId)) { res.status(400).json({ message: 'Invalid post ID' }); return; }

    const result = await likeService.getPostLikes(postId, page, limit);
    res.status(200).json(result); return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching likes' });
  }
};

const likeComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const commentId = parseInt(req.params.commentId, 10);
    const userId = req.user?.id ?? req.user?.userId;

    if (isNaN(commentId)) { res.status(400).json({ message: 'Invalid comment ID' }); return; }
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const result = await commentService.likeComment(commentId, userId);
    res.status(200).json(result); return;
  } catch (error: any) {
    if (error?.message === 'Comment not found') { res.status(404).json({ message: error.message }); return; }
    console.error(error);
    res.status(500).json({ message: 'Error liking comment' });
  }
};

const unlikeComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const commentId = parseInt(req.params.commentId, 10);
    const userId = req.user?.id ?? req.user?.userId;

    if (isNaN(commentId)) { res.status(400).json({ message: 'Invalid comment ID' }); return; }
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const result = await commentService.unlikeComment(commentId, userId);
    res.status(200).json(result); return;
  } catch (error: any) {
    if (error?.message === 'Comment not found') { res.status(404).json({ message: error.message }); return; }
    console.error(error);
    res.status(500).json({ message: 'Error unliking comment' });
  }
};

const controller = {
  addComment,
  getPostComments,
  updateComment,
  deleteComment,
  likePost,
  unlikePost,
  getPostLikes,
  likeComment,
  unlikeComment,
};

export default controller;
