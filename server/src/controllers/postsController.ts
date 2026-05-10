import { Request, Response } from 'express';
import axios from 'axios';
import wordpressService, { WordPressService } from '../services/wordpressService';

interface CreatePostRequest extends Request {
  body: {
    title: string;
    content: string;
    excerpt?: string;
    categories?: number[];
    featured_media?: number;
    status?: 'draft' | 'publish';
  };
}

interface UpdatePostRequest extends Request {
  body: {
    title?: string;
    content?: string;
    excerpt?: string;
    categories?: number[];
    featured_media?: number;
    status?: 'draft' | 'publish';
  };
  params: {
    postId: string;
  };
}

interface DeletePostRequest extends Request {
  params: {
    postId: string;
  };
}

export const createPost = async (req: CreatePostRequest, res: Response): Promise<void> => {
  try {
    const { title, content, excerpt, categories, featured_media, status = 'draft' } = req.body;

    if (!title || !content) {
      res.status(400).json({
        success: false,
        data: null,
        error: 'Título y contenido son requeridos',
      });
      return;
    }

    const post = await wordpressService.createPost({
      title,
      content,
      excerpt,
      categories,
      featured_media,
      status,
    });

    res.status(201).json({
      success: true,
      data: {
        id: post.id,
        slug: post.slug,
        title: post.title.rendered,
        status: post.status,
        link: post.link,
      },
      error: null,
    });
  } catch (error) {
    const msg = WordPressService.extractErrorMessage(error);
    console.error('Error creating post:', msg);
    const status = axios.isAxiosError(error) && error.response?.status === 401 ? 401 : 500;
    res.status(status).json({
      success: false,
      data: null,
      error: msg,
    });
  }
};

export const updatePost = async (req: UpdatePostRequest, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const { title, content, excerpt, categories, featured_media, status } = req.body;

    if (!postId) {
      res.status(400).json({
        success: false,
        data: null,
        error: 'ID del post es requerido',
      });
      return;
    }

    const updateData: Record<string, unknown> = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (categories) updateData.categories = categories;
    if (featured_media !== undefined) updateData.featured_media = featured_media;
    if (status) updateData.status = status;

    const post = await wordpressService.updatePost(parseInt(postId), updateData);

    res.status(200).json({
      success: true,
      data: {
        id: post.id,
        slug: post.slug,
        title: post.title.rendered,
        status: post.status,
        link: post.link,
      },
      error: null,
    });
  } catch (error) {
    const msg = WordPressService.extractErrorMessage(error);
    console.error('Error updating post:', msg);
    res.status(500).json({
      success: false,
      data: null,
      error: msg,
    });
  }
};

export const deletePost = async (req: DeletePostRequest, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;

    if (!postId) {
      res.status(400).json({
        success: false,
        data: null,
        error: 'ID del post es requerido',
      });
      return;
    }

    await wordpressService.deletePost(parseInt(postId));

    res.status(200).json({
      success: true,
      data: null,
      error: null,
    });
  } catch (error) {
    const msg = WordPressService.extractErrorMessage(error);
    console.error('Error deleting post:', msg);
    res.status(500).json({
      success: false,
      data: null,
      error: msg,
    });
  }
};

// ────────────────────────────────────────────────────────────────
// TAXONOMÍAS: Categorías y Etiquetas
// ────────────────────────────────────────────────────────────────

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await wordpressService.getCategories();
    res.status(200).json({ success: true, data: categories, error: null });
  } catch (error) {
    const msg = WordPressService.extractErrorMessage(error);
    res.status(500).json({ success: false, data: null, error: msg });
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body as { name?: string };
  if (!name?.trim()) {
    res.status(400).json({ success: false, data: null, error: 'El nombre es requerido' });
    return;
  }
  try {
    const category = await wordpressService.createCategory(name.trim());
    res.status(201).json({ success: true, data: category, error: null });
  } catch (error) {
    const msg = WordPressService.extractErrorMessage(error);
    res.status(500).json({ success: false, data: null, error: msg });
  }
};

export const getTags = async (_req: Request, res: Response): Promise<void> => {
  try {
    const tags = await wordpressService.getTags();
    res.status(200).json({ success: true, data: tags, error: null });
  } catch (error) {
    const msg = WordPressService.extractErrorMessage(error);
    res.status(500).json({ success: false, data: null, error: msg });
  }
};

export const createTag = async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body as { name?: string };
  if (!name?.trim()) {
    res.status(400).json({ success: false, data: null, error: 'El nombre es requerido' });
    return;
  }
  try {
    const tag = await wordpressService.createTag(name.trim());
    res.status(201).json({ success: true, data: tag, error: null });
  } catch (error) {
    const msg = WordPressService.extractErrorMessage(error);
    res.status(500).json({ success: false, data: null, error: msg });
  }
};
