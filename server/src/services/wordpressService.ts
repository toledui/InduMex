/**
 * Servicio para manejar operaciones con WordPress REST API
 * Permite crear, actualizar y eliminar posts sin necesidad de base de datos local
 * Las credenciales se cargan de la tabla configuraciones en la BD
 */

import axios, { AxiosError } from 'axios';
import Configuracion from '../models/Configuracion';

interface WordPressPost {
  title: string;
  content: string;
  excerpt?: string;
  categories?: number[];
  tags?: number[];
  featured_media?: number;
  status?: 'draft' | 'publish' | 'pending' | 'private';
  slug?: string;
}

interface WpTaxonomy {
  id: number;
  name: string;
  slug: string;
  count: number;
}

interface WordPressPostResponse {
  id: number;
  slug: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  featured_media: number;
  categories: number[];
  date: string;
  modified: string;
  status: string;
  link: string;
}

class WordPressService {
  /**
   * Carga las credenciales frescas desde la BD en cada operación.
   * Así los cambios en Settings se aplican de inmediato sin reiniciar.
   */
  private async getCredentials(): Promise<{ restApiUrl: string; auth: string }> {
    try {
      const [urlConfig, userConfig, passConfig] = await Promise.all([
        Configuracion.findOne({ where: { clave: 'wordpress_rest_api_url' } }),
        Configuracion.findOne({ where: { clave: 'wordpress_api_user' } }),
        Configuracion.findOne({ where: { clave: 'wordpress_api_password' } }),
      ]);

      const restApiUrl =
        urlConfig?.valor?.trim() ||
        process.env.WORDPRESS_REST_API_URL ||
        'http://localhost/wp-json';

      const user =
        userConfig?.valor?.trim() ||
        process.env.WORDPRESS_API_USER ||
        'admin';

      const password =
        passConfig?.valor?.trim() ||
        process.env.WORDPRESS_API_PASSWORD ||
        'admin';

      return { restApiUrl, auth: Buffer.from(`${user}:${password}`).toString('base64') };
    } catch {
      // Fallback a .env si la BD no responde
      const restApiUrl = process.env.WORDPRESS_REST_API_URL || 'http://localhost/wp-json';
      const user = process.env.WORDPRESS_API_USER || 'admin';
      const password = process.env.WORDPRESS_API_PASSWORD || 'admin';
      return { restApiUrl, auth: Buffer.from(`${user}:${password}`).toString('base64') };
    }
  }

  /**
   * Crea un nuevo post en WordPress
   */
  async createPost(post: WordPressPost): Promise<WordPressPostResponse> {
    const { restApiUrl, auth } = await this.getCredentials();
    const response = await axios.post<WordPressPostResponse>(
      `${restApiUrl}/wp/v2/posts`,
      post,
      { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' } }
    );
    return response.data;
  }

  /**
   * Actualiza un post existente en WordPress
   */
  async updatePost(postId: number, post: Partial<WordPressPost>): Promise<WordPressPostResponse> {
    const { restApiUrl, auth } = await this.getCredentials();
    const response = await axios.post<WordPressPostResponse>(
      `${restApiUrl}/wp/v2/posts/${postId}`,
      post,
      { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' } }
    );
    return response.data;
  }

  /**
   * Elimina un post de WordPress
   */
  async deletePost(postId: number, force = true): Promise<void> {
    const { restApiUrl, auth } = await this.getCredentials();
    await axios.delete(`${restApiUrl}/wp/v2/posts/${postId}`, {
      params: { force },
      headers: { Authorization: `Basic ${auth}` },
    });
  }

  /**
   * Obtiene un post por ID
   */
  async getPost(postId: number): Promise<WordPressPostResponse> {
    const { restApiUrl, auth } = await this.getCredentials();
    const response = await axios.get<WordPressPostResponse>(
      `${restApiUrl}/wp/v2/posts/${postId}`,
      { headers: { Authorization: `Basic ${auth}` } }
    );
    return response.data;
  }

  /**
   * Obtiene un post por slug
   */
  async getPostBySlug(slug: string): Promise<WordPressPostResponse | null> {
    const { restApiUrl, auth } = await this.getCredentials();
    const response = await axios.get<WordPressPostResponse[]>(
      `${restApiUrl}/wp/v2/posts`,
      { params: { slug, _embed: true }, headers: { Authorization: `Basic ${auth}` } }
    );
    return response.data.length > 0 ? response.data[0] : null;
  }

  /**
   * Sube una imagen y retorna el ID del media
   */
  async uploadMedia(fileBuffer: Buffer, filename: string): Promise<number> {
    const { restApiUrl, auth } = await this.getCredentials();
    const formData = new FormData();
    const uint8Array = new Uint8Array(fileBuffer);
    const blob = new Blob([uint8Array], { type: 'image/jpeg' });
    formData.append('file', blob, filename);
    const response = await axios.post<{ id: number }>(
      `${restApiUrl}/wp/v2/media`,
      formData,
      { headers: { Authorization: `Basic ${auth}`, 'Content-Disposition': `attachment; filename="${filename}"` } }
    );
    return response.data.id;
  }

  /**
   * Obtiene todas las categorías de WordPress
   */
  async getCategories(): Promise<WpTaxonomy[]> {
    const { restApiUrl, auth } = await this.getCredentials();
    const response = await axios.get<WpTaxonomy[]>(`${restApiUrl}/wp/v2/categories`, {
      params: { per_page: 100, orderby: 'name', order: 'asc' },
      headers: { Authorization: `Basic ${auth}` },
    });
    return response.data;
  }

  /**
   * Crea una nueva categoría en WordPress
   */
  async createCategory(name: string): Promise<WpTaxonomy> {
    const { restApiUrl, auth } = await this.getCredentials();
    const response = await axios.post<WpTaxonomy>(
      `${restApiUrl}/wp/v2/categories`,
      { name },
      { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' } }
    );
    return response.data;
  }

  /**
   * Obtiene todas las etiquetas de WordPress
   */
  async getTags(): Promise<WpTaxonomy[]> {
    const { restApiUrl, auth } = await this.getCredentials();
    const response = await axios.get<WpTaxonomy[]>(`${restApiUrl}/wp/v2/tags`, {
      params: { per_page: 100, orderby: 'name', order: 'asc' },
      headers: { Authorization: `Basic ${auth}` },
    });
    return response.data;
  }

  /**
   * Crea una nueva etiqueta en WordPress
   */
  async createTag(name: string): Promise<WpTaxonomy> {
    const { restApiUrl, auth } = await this.getCredentials();
    const response = await axios.post<WpTaxonomy>(
      `${restApiUrl}/wp/v2/tags`,
      { name },
      { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' } }
    );
    return response.data;
  }

  /**
   * Extrae el mensaje de error real de una respuesta de WordPress
   */
  static extractErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ code?: string; message?: string }>;
      const wpMessage = axiosError.response?.data?.message;
      const wpCode = axiosError.response?.data?.code;
      const status = axiosError.response?.status;
      if (wpMessage) return `WP ${status ?? ''} [${wpCode ?? 'error'}]: ${wpMessage}`;
      return `HTTP ${status ?? 'error'}: ${axiosError.message}`;
    }
    return error instanceof Error ? error.message : 'Error desconocido';
  }
}

export { WordPressService };
export default new WordPressService();
