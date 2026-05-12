import { Metadata } from 'next';
import { getPostBySlug } from '@/lib/wordpress';
import { notFound } from 'next/navigation';
import EditPostClient from './EditPostClient';

interface EditPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata(
  props: EditPostPageProps
): Promise<Metadata> {
  const params = await props.params;
  return {
    title: `Editar: ${params.slug} | Admin InduMex`,
  };
}

export default async function EditPostPage(props: EditPostPageProps) {
  const params = await props.params;
  
  let post = null;
  let error: string | null = null;

  try {
    post = await getPostBySlug(params.slug);
    if (!post) {
      notFound();
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Error al cargar el artículo';
    console.error('Error fetching post:', err);
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#010b17] text-white p-8">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-200">
          <p className="font-semibold">Error al cargar artículo</p>
          <p className="text-sm mt-1">{error || 'Artículo no encontrado'}</p>
        </div>
      </div>
    );
  }

  return <EditPostClient initialPost={post} slug={params.slug} />;
}
