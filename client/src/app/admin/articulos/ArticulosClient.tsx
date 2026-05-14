'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { WordPressPostCard } from '@/lib/wordpress';

interface ArticulosClientProps {
  initialPosts: WordPressPostCard[];
}

const ITEMS_PER_PAGE = 10;

export default function ArticulosClient({ initialPosts }: ArticulosClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Filtrar por búsqueda
  const filteredPosts = useMemo(() => {
    return initialPosts.filter((post) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [initialPosts, searchTerm]);

  // Paginación
  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);
  const paginatedPosts = filteredPosts.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este artículo?')) return;
    // TODO: Llamar API para eliminar de WordPress
    console.log('Eliminar:', slug);
  };

  const handleDuplicate = (slug: string) => {
    // TODO: Llamar API para duplicar artículo
    console.log('Duplicar:', slug);
  };

  const getImageUrl = (post: WordPressPostCard): string | null => {
    return post.featuredImage?.node?.sourceUrl || null;
  };

  const getPrimaryCategory = (post: WordPressPostCard): string => {
    return post.categories?.nodes?.[0]?.name || 'Sin categoría';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-[#031c38] border border-white/10 rounded-lg p-4 flex items-center gap-3">
        <Search size={20} className="text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por título o slug..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(0);
          }}
          className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none"
        />
      </div>

      {/* Tabla de Artículos */}
      {paginatedPosts.length > 0 ? (
        <div className="bg-[#031c38] border border-white/10 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-225">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10 text-sm font-semibold text-gray-300">
                <div className="col-span-5">Título</div>
                <div className="col-span-2">Categoría</div>
                <div className="col-span-2">Publicado</div>
                <div className="col-span-3 text-right">Acciones</div>
              </div>

              {/* Rows */}
              {paginatedPosts.map((post) => {
                const imageUrl = getImageUrl(post);
                const category = getPrimaryCategory(post);

                return (
                  <div
                    key={post.id}
                    className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/10/50 hover:bg-white/5 transition-colors items-center"
                  >
                    {/* Título con imagen */}
                    <div className="col-span-5 flex items-center gap-3">
                      {imageUrl ? (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-800">
                          <Image
                            src={imageUrl}
                            alt={post.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center shrink-0">
                          <span className="text-xs text-gray-400">IMG</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{post.title}</p>
                        <p className="text-xs text-gray-400">/{post.slug}</p>
                      </div>
                    </div>

                    {/* Categoría */}
                    <div className="col-span-2">
                      <span className="text-sm text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg">
                        {category}
                      </span>
                    </div>

                    {/* Fecha */}
                    <div className="col-span-2">
                      <p className="text-sm text-gray-400">{formatDate(post.date)}</p>
                    </div>

                    {/* Acciones */}
                    <div className="col-span-3 flex items-center justify-end gap-2 relative">
                      <Link
                        href={post.uri || `/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                        title="Ver en el sitio"
                      >
                        <Eye size={18} />
                      </Link>

                      <button
                        onClick={() =>
                          setOpenMenuId(openMenuId === post.id ? null : post.id)
                        }
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {/* Dropdown Menu */}
                      {openMenuId === post.id && (
                        <div className="absolute right-0 top-full mt-2 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl z-50 min-w-48">
                          <Link
                            href={`/admin/posts/${post.slug}/edit`}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-white transition-colors border-b border-white/10"
                          >
                            <Edit size={16} />
                            <span>Editar</span>
                          </Link>

                          <button
                            onClick={() => {
                              handleDuplicate(post.slug);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 text-white transition-colors border-b border-white/10 text-left"
                          >
                            <Copy size={16} />
                            <span>Duplicar</span>
                          </button>

                          <button
                            onClick={() => {
                              handleDelete(post.slug);
                              setOpenMenuId(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors text-left"
                          >
                            <Trash2 size={16} />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#031c38] border border-white/10 rounded-lg p-12 text-center">
          <p className="text-gray-400 mb-4">
            {searchTerm ? 'No se encontraron artículos' : 'No hay artículos aún'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-[#004AAD] hover:text-blue-400 underline text-sm"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#031c38] border border-white/10 rounded-lg p-4">
          <p className="text-sm text-gray-400">
            Página {currentPage + 1} de {totalPages} ({filteredPosts.length} artículos)
          </p>

          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const page =
                currentPage <= 2
                  ? i
                  : currentPage >= totalPages - 3
                    ? totalPages - 5 + i
                    : currentPage - 2 + i;

              if (page < 0 || page >= totalPages) return null;

              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-10 h-10 rounded-lg transition-colors font-semibold ${
                    currentPage === page
                      ? 'bg-[#004AAD] text-white'
                      : 'hover:bg-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {page + 1}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
