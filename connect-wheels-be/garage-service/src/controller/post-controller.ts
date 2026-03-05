import { Response } from 'express';
import { validationResult } from 'express-validator';
import postService from '../service/post-service';
import feedService from '../service/feed-service';
import { AuthRequest } from '../../../common/auth-middleware/auth_middleware';

const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

  try {
    const garageId = parseInt(req.params.garageId, 10);
    const userId = req.user?.id ?? req.user?.userId;
    if (isNaN(garageId)) { res.status(400).json({ message: 'Invalid garage ID' }); return; }
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    // Files saved to disk by multer; build relative paths
    const uploadedFiles = (req.files ?? []) as Express.Multer.File[];
    const mediaUrls = uploadedFiles.map((f) => `/api/garage/uploads/posts/${f.filename}`);

    const data = {
      title: req.body.title,
      caption: req.body.caption,
      content: req.body.content,
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      isPublished: req.body.isPublished,
    };

    const result = await postService.createPost(garageId, userId, data);
    res.status(201).json(result); return;
  } catch (error: any) {
    if (error?.message === 'Garage not found') { res.status(404).json({ message: error.message }); return; }
    if (error?.message?.includes('Forbidden')) { res.status(403).json({ message: error.message }); return; }
    console.error(error);
    res.status(500).json({ message: 'Error creating post' });
  }
};

const getPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const postId = parseInt(req.params.postId, 10);
    if (isNaN(postId)) { res.status(400).json({ message: 'Invalid post ID' }); return; }

    const post = await postService.getPostById(postId);
    await postService.incrementViewCount(postId);
    res.status(200).json({ post }); return;
  } catch (error: any) {
    if (error?.message === 'Post not found') { res.status(404).json({ message: error.message }); return; }
    console.error(error);
    res.status(500).json({ message: 'Error fetching post' });
  }
};

const getGaragePosts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const garageId = parseInt(req.params.garageId, 10);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    if (isNaN(garageId)) { res.status(400).json({ message: 'Invalid garage ID' }); return; }

    const result = await postService.getGaragePosts(garageId, page, limit);
    res.status(200).json(result); return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching posts' });
  }
};

const updatePost = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) { res.status(400).json({ errors: errors.array() }); return; }

  try {
    const postId = parseInt(req.params.postId, 10);
    const userId = req.user?.id ?? req.user?.userId;
    if (isNaN(postId)) { res.status(400).json({ message: 'Invalid post ID' }); return; }
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const data = {
      title: req.body.title,
      caption: req.body.caption,
      content: req.body.content,
      isPublished: req.body.isPublished,
    };

    const post = await postService.updatePost(postId, userId, data);
    res.status(200).json({ post }); return;
  } catch (error: any) {
    if (error?.message === 'Post not found') { res.status(404).json({ message: error.message }); return; }
    if (error?.message?.includes('Forbidden')) { res.status(403).json({ message: error.message }); return; }
    console.error(error);
    res.status(500).json({ message: 'Error updating post' });
  }
};

const deletePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const postId = parseInt(req.params.postId, 10);
    const userId = req.user?.id ?? req.user?.userId;
    if (isNaN(postId)) { res.status(400).json({ message: 'Invalid post ID' }); return; }
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    await postService.deletePost(postId, userId);
    res.status(200).json({ message: 'Post deleted successfully' }); return;
  } catch (error: any) {
    if (error?.message === 'Post not found') { res.status(404).json({ message: error.message }); return; }
    if (error?.message?.includes('Forbidden')) { res.status(403).json({ message: error.message }); return; }
    console.error(error);
    res.status(500).json({ message: 'Error deleting post' });
  }
};

const getFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id ?? req.user?.userId;
    if (!userId) { res.status(401).json({ message: 'Authentication required' }); return; }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await feedService.getPersonalizedFeed(userId, page, limit);
    res.status(200).json(result); return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching feed' });
  }
};

const getTrendingPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const timeframe = (req.query.timeframe as 'day' | 'week' | 'month' | 'all') || 'week';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await feedService.getTrendingPosts(timeframe, page, limit);
    res.status(200).json(result); return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching trending posts' });
  }
};

const controller = {
  createPost,
  getPost,
  getGaragePosts,
  updatePost,
  deletePost,
  getFeed,
  getTrendingPosts,
};

export default controller;
