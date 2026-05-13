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
  const title = `Editar: ${params.slug} | Admin InduMex`;

  return {
    title,
    description: 'Editor de artículos del panel administrativo de InduMex.',
    openGraph: {
      title,
      description: 'Editor de artículos del panel administrativo de InduMex.',
      type: 'website',
      url: `https://indumex.blog/admin/posts/${params.slug}/edit`,
      siteName: 'InduMex',
      locale: 'es_MX',
      images: [
        {
          url: 'https://indumex.blog/images/indumex-image.jpg',
          width: 1200,
          height: 630,
          alt: 'InduMex - Plataforma Industrial B2B',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: 'Editor de artículos del panel administrativo de InduMex.',
      images: ['https://indumex.blog/images/indumex-image.jpg'],
    },
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
