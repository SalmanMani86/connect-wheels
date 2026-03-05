import { AppDataSource } from '../data-source';
import { Post } from '../entity/post';
import { PostMedia } from '../entity/post-media';
import { Garage } from '../entity/garage';
import { PostDTO, PostUpdateDTO } from '../dtos/post-dto';

const postRepo = () => AppDataSource.getRepository(Post);
const mediaRepo = () => AppDataSource.getRepository(PostMedia);
const garageRepo = () => AppDataSource.getRepository(Garage);

export const createPost = async (
  garageId: number,
  ownerId: number,
  data: Omit<PostDTO, 'garageId'>
) => {
  const garage = await garageRepo().findOne({ where: { id: garageId } });
  if (!garage) throw new Error('Garage not found');
  if (garage.ownerId !== ownerId) throw new Error('Forbidden: Not garage owner');

  const postEntity = postRepo().create({
    garageId,
    title: data.title ?? undefined,
    caption: data.caption ?? undefined,
    content: data.content ?? undefined,
    isPublished: data.isPublished ?? true,
  });
  const post = await postRepo().save(postEntity);

  if (data.mediaUrls?.length) {
    const mediaItems = data.mediaUrls.map((url, i) => ({
      postId: post.id,
      mediaUrl: url,
      mediaType: 'image',
      displayOrder: i,
    }));
    await mediaRepo().save(mediaItems);
  }

  await garageRepo().increment({ id: garageId }, 'postsCount', 1);

  const created = await postRepo().findOne({
    where: { id: post.id },
    relations: ['garage'],
  });
  const media = await mediaRepo().find({
    where: { postId: post.id },
    order: { displayOrder: 'ASC' },
  });

  return {
    message: 'Post created successfully',
    post: { ...created, media },
  };
};

export const getPostById = async (postId: number) => {
  const post = await postRepo().findOne({
    where: { id: postId },
    relations: ['garage'],
  });
  if (!post) throw new Error('Post not found');
  const media = await mediaRepo().find({
    where: { postId },
    order: { displayOrder: 'ASC' },
  });
  return { ...post, media };
};

export const getGaragePosts = async (
  garageId: number,
  page: number = 1,
  limit: number = 10
) => {
  const [posts, total] = await postRepo().findAndCount({
    where: { garageId, isPublished: true },
    relations: ['garage'],
    order: { createdAt: 'DESC' },
    skip: (page - 1) * limit,
    take: limit,
  });

  const postsWithMedia = await Promise.all(
    posts.map(async (p) => {
      const media = await mediaRepo().find({
        where: { postId: p.id },
        order: { displayOrder: 'ASC' },
      });
      return { ...p, media };
    })
  );

  return {
    posts: postsWithMedia,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const updatePost = async (
  postId: number,
  ownerId: number,
  data: PostUpdateDTO
) => {
  const post = await postRepo().findOne({ where: { id: postId }, relations: ['garage'] });
  if (!post) throw new Error('Post not found');
  if (post.garage.ownerId !== ownerId) throw new Error('Forbidden: Not post owner');

  await postRepo().update(postId, {
    ...(data.title !== undefined && { title: data.title }),
    ...(data.caption !== undefined && { caption: data.caption }),
    ...(data.content !== undefined && { content: data.content }),
    ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
  });
  return getPostById(postId);
};

export const deletePost = async (postId: number, ownerId: number) => {
  const post = await postRepo().findOne({ where: { id: postId }, relations: ['garage'] });
  if (!post) throw new Error('Post not found');
  if (post.garage.ownerId !== ownerId) throw new Error('Forbidden: Not post owner');

  await postRepo().delete(postId);
  await garageRepo().decrement({ id: post.garageId }, 'postsCount', 1);
  return { message: 'Post deleted successfully' };
};

export const incrementViewCount = async (postId: number) => {
  await postRepo().increment({ id: postId }, 'viewsCount', 1);
};

const postService = {
  createPost,
  getPostById,
  getGaragePosts,
  updatePost,
  deletePost,
  incrementViewCount,
};

export default postService;
