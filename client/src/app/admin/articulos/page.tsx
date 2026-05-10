import { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getAllPostsUnlimited, WordPressPostCard } from '@/lib/wordpress';
import ArticulosClient from './ArticulosClient';

export const metadata: Metadata = {
  title: 'Artículos | Admin InduMex',
  description: 'Gestiona todos los artículos del blog',
};

export default async function ArticulosPage() {
  let posts: WordPressPostCard[] = [];
  let error: string | null = null;

  try {
    posts = await getAllPostsUnlimited(50, 100);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Error al cargar artículos';
    console.error('Error fetching posts:', err);
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-4xl font-black tracking-tight"
            style={{ fontFamily: 'Space_Grotesk' }}
          >
            Artículos
          </h1>
          <p className="text-gray-400 mt-2">
            {posts.length} artículos publicados
          </p>
        </div>

        <Link
          href="/admin/posts/new"
          className="flex items-center gap-2 bg-[#F58634] hover:bg-[#E67A1F] text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20"
        >
          <Plus size={20} />
          Nuevo Artículo
        </Link>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-8 bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-200">
          <p className="font-semibold">Error al cargar artículos</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Artículos Client Component */}
      <ArticulosClient initialPosts={posts} />
    </div>
  );
}
