import { Router, Request, Response, NextFunction } from 'express';
import { createPost, updatePost, deletePost, getCategories, createCategory, getTags, createTag } from '../controllers/postsController';
import { requireAuth, requireAdminRole } from '../middleware/authMiddleware';

const router = Router();

/**
 * Middleware para autorizar múltiples roles
 */
function authorize(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth || !allowedRoles.includes(req.auth.rol)) {
      return res.status(403).json({
        success: false,
        data: null,
        error: 'Acceso restringido',
      });
    }
    next();
  };
}

/**
 * POST /api/v1/posts
 * Crea un nuevo post en WordPress
 * Requiere: autenticación y rol de editor/admin
 */
router.post('/posts', requireAuth, authorize(['editor', 'admin']), createPost);

/**
 * PUT /api/v1/posts/:postId
 * Actualiza un post existente en WordPress
 * Requiere: autenticación y rol de editor/admin
 */
router.put('/posts/:postId', requireAuth, authorize(['editor', 'admin']), updatePost);

/**
 * DELETE /api/v1/posts/:postId
 * Elimina un post de WordPress
 * Requiere: autenticación y rol de admin
 */
router.delete('/posts/:postId', requireAuth, requireAdminRole, deletePost);

// ── Taxonomías ──────────────────────────────────────────────────
/** GET /api/v1/posts/categories */
router.get('/posts/categories', requireAuth, authorize(['editor', 'admin']), getCategories);
/** POST /api/v1/posts/categories */
router.post('/posts/categories', requireAuth, authorize(['editor', 'admin']), createCategory);
/** GET /api/v1/posts/tags */
router.get('/posts/tags', requireAuth, authorize(['editor', 'admin']), getTags);
/** POST /api/v1/posts/tags */
router.post('/posts/tags', requireAuth, authorize(['editor', 'admin']), createTag);

export default router;
