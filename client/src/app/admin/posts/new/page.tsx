'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bold,
  Italic,
  Link,
  Image as ImageIcon,
  List,
  Upload,
  Clock,
  Tag,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Code,
  FileText,
  Plus,
  X,
  FolderOpen,
} from 'lucide-react';
import {
  createPost,
  getAuthTokenFromCookie,
  getWpCategories,
  createWpCategory,
  getWpTags,
  createWpTag,
  WpTaxonomy,
} from '@/lib/api';

interface ArticleData {
  title: string;
  excerpt: string;
  content: string;
  categoryIds: number[];
  tagIds: number[];
  featuredImage: File | null;
}

export default function NewPostPage() {
  const router = useRouter();
  const [article, setArticle] = useState<ArticleData>({
    title: '',
    excerpt: '',
    content: '',
    categoryIds: [],
    tagIds: [],
    featuredImage: null,
  });

  // Taxonomías desde WordPress
  const [categories, setCategories] = useState<WpTaxonomy[]>([]);
  const [tags, setTags] = useState<WpTaxonomy[]>([]);
  const [taxonomyLoading, setTaxonomyLoading] = useState(true);

  // Crear nueva categoría / etiqueta inline
  const [newCatName, setNewCatName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [creatingCat, setCreatingCat] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);

  // Editor mode: 'visual' | 'html'
  const [editorMode, setEditorMode] = useState<'visual' | 'html'>('html');

  const [isDragging, setIsDragging] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  // Cargar taxonomías de WordPress al montar
  useEffect(() => {
    async function loadTaxonomies() {
      const token = getAuthTokenFromCookie() ?? '';
      try {
        const [cats, tgs] = await Promise.all([
          getWpCategories(token),
          getWpTags(token),
        ]);
        setCategories(cats);
        setTags(tgs);
      } catch {
        // Si WP no está conectado dejamos arrays vacíos
      } finally {
        setTaxonomyLoading(false);
      }
    }
    loadTaxonomies();
  }, []);
  // Imagen destacada
  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.target === dragRef.current) setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files?.[0]) setArticle(a => ({ ...a, featuredImage: files[0] }));
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setArticle(a => ({ ...a, featuredImage: e.target.files![0] }));
  };
  // Toggles taxonomias
  const toggleCategory = (id: number) => setArticle(a => ({
    ...a, categoryIds: a.categoryIds.includes(id) ? a.categoryIds.filter(c => c !== id) : [...a.categoryIds, id],
  }));
  const toggleTag = (id: number) => setArticle(a => ({
    ...a, tagIds: a.tagIds.includes(id) ? a.tagIds.filter(t => t !== id) : [...a.tagIds, id],
  }));
  // Crear categoria inline
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setCreatingCat(true);
    try {
      const token = getAuthTokenFromCookie() ?? '';
      const cat = await createWpCategory(token, newCatName.trim());
      setCategories(prev => [...prev, cat]);
      setArticle(a => ({ ...a, categoryIds: [...a.categoryIds, cat.id] }));
      setNewCatName('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al crear categoría');
    } finally {
      setCreatingCat(false);
    }
  };
  // Crear etiqueta inline
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    setCreatingTag(true);
    try {
      const token = getAuthTokenFromCookie() ?? '';
      const tag = await createWpTag(token, newTagName.trim());
      setTags(prev => [...prev, tag]);
      setArticle(a => ({ ...a, tagIds: [...a.tagIds, tag.id] }));
      setNewTagName('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al crear etiqueta');
    } finally {
      setCreatingTag(false);
    }
  };
  // Publicar / Borrador
  async function submitPost(status: 'publish' | 'draft') {
    if (!article.title.trim()) { setResult({ ok: false, msg: 'El título es obligatorio.' }); return; }
    if (!article.content.trim()) { setResult({ ok: false, msg: 'El contenido es obligatorio.' }); return; }
    if (status === 'publish') setIsPublishing(true);
    else setIsSavingDraft(true);
    setResult(null);
    try {
      const token = getAuthTokenFromCookie() ?? '';
      const post = await createPost(token, {
        title: article.title,
        content: article.content,
        excerpt: article.excerpt || undefined,
        categories: article.categoryIds.length > 0 ? article.categoryIds : undefined,
        tags: article.tagIds.length > 0 ? article.tagIds : undefined,
        status,
      });
      setResult({
        ok: true,
        msg: status === 'publish' ? `¡Publicado! -> ${post.link}` : `Borrador guardado. Slug: /${post.slug}`,
      });
      setTimeout(() => router.push('/admin/articulos'), 1800);
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : 'Error al guardar el artículo.' });
    } finally {
      setIsPublishing(false);
      setIsSavingDraft(false);
    }
  }

  const selectedCatNames = categories.filter(c => article.categoryIds.includes(c.id)).map(c => c.name);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight" style={{ fontFamily: 'Space_Grotesk' }}>
          Crear Nuevo Artículo
        </h1>
        <p className="text-gray-400 mt-2">Añade contenido nuevo al blog de InduMex</p>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* COLUMNA IZQUIERDA 8/12 */}
        <div className="col-span-8 space-y-8">

          {/* Título */}
          <div>
            <input
              type="text"
              placeholder="Título del artículo..."
              value={article.title}
              onChange={(e) => setArticle(a => ({ ...a, title: e.target.value }))}
              className="w-full bg-transparent text-5xl font-black placeholder-gray-600 focus:outline-none focus:border-b-2 focus:border-[#004AAD] pb-4 transition-colors"
              style={{ fontFamily: 'Space_Grotesk' }}
            />
          </div>

          {/* Extracto */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">Extracto (Resumen SEO)</label>
            <textarea
              placeholder="Resumen breve para SEO y redes sociales..."
              value={article.excerpt}
              onChange={(e) => setArticle(a => ({ ...a, excerpt: e.target.value }))}
              className="w-full bg-[#111] border border-white/10 rounded-lg p-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#004AAD] focus:ring-1 focus:ring-[#004AAD]/30 transition-all resize-none"
              rows={3}
            />
            <p className="text-xs text-gray-400 mt-2">{article.excerpt.length}/160 caracteres</p>
          </div>

          {/* Editor */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-300">Contenido del Artículo</label>
              {/* Toggle Visual / HTML */}
              <div className="flex items-center bg-[#1a1a1a] border border-white/10 rounded-lg p-1 gap-1">
                <button
                  onClick={() => setEditorMode('visual')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${editorMode === 'visual' ? 'bg-[#004AAD] text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <FileText size={13} /> Visual
                </button>
                <button
                  onClick={() => setEditorMode('html')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${editorMode === 'html' ? 'bg-[#004AAD] text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <Code size={13} /> HTML / Código
                </button>
              </div>
            </div>

            {editorMode === 'visual' ? (
              <>
                <div className="bg-[#111] border border-white/10 rounded-t-lg p-3 flex items-center gap-1 flex-wrap border-b border-gray-800">
                  {([Bold, Italic, Link, ImageIcon, List] as React.ElementType[]).map((Icon, i) => (
                    <button key={i} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-300 hover:text-white">
                      <Icon size={16} />
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Escribe el contenido del artículo. Soporta HTML básico."
                  value={article.content}
                  onChange={(e) => setArticle(a => ({ ...a, content: e.target.value }))}
                  className="w-full bg-[#111] border border-white/10 rounded-b-lg p-6 text-white placeholder-gray-500 focus:outline-none focus:border-[#004AAD] transition-all resize-none font-sans"
                  rows={18}
                />
              </>
            ) : (
              <>
                <div className="bg-[#0d1117] border border-[#30363d] rounded-t-lg px-4 py-2 flex items-center gap-2">
                  <Code size={14} className="text-[#58a6ff]" />
                  <span className="text-xs text-[#8b949e] font-mono">HTML Editor - el contenido se guarda tal cual en WordPress</span>
                  <span className="ml-auto text-xs text-[#3fb950]">{article.content.length.toLocaleString()} chars</span>
                </div>
                <textarea
                  placeholder={`<!-- Pega aquí tu HTML completo, JSON-LD, scripts, etc. -->\n<div class="indumex-post">\n  <h2>Subtítulo</h2>\n  <p>Contenido...</p>\n</div>`}
                  value={article.content}
                  onChange={(e) => setArticle(a => ({ ...a, content: e.target.value }))}
                  className="w-full bg-[#0d1117] border border-[#30363d] border-t-0 rounded-b-lg p-6 text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff] transition-all resize-none font-mono text-sm leading-relaxed"
                  rows={22}
                  spellCheck={false}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Pega HTML completo, bloques de Gutenberg, JSON-LD con &lt;script type=&quot;application/ld+json&quot;&gt;, estilos CSS o cualquier codigo. Se guarda exactamente en WordPress.
                </p>
              </>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA 4/12 */}
        <div className="col-span-4 space-y-6">

          {/* Publicación */}
          <div className="bg-[#111] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
            <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
              <Clock size={16} /> Estado
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => submitPost('publish')}
                disabled={isPublishing || isSavingDraft}
                className="w-full bg-[#F58634] hover:bg-[#E67A1F] text-white font-bold py-3 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
              >
                {isPublishing ? <><Loader2 size={16} className="animate-spin" /> Publicando...</> : 'Publicar Artículo'}
              </button>
              <button
                onClick={() => submitPost('draft')}
                disabled={isPublishing || isSavingDraft}
                className="w-full bg-transparent border border-white/20 hover:border-white/40 text-white font-semibold py-3 rounded-lg transition-all hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSavingDraft ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : 'Guardar Borrador'}
              </button>
            </div>
            {result && (
              <div className={`mt-4 flex items-start gap-2.5 text-xs px-4 py-3 rounded-xl border ${result.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                {result.ok ? <CheckCircle2 size={14} className="shrink-0 mt-0.5" /> : <AlertCircle size={14} className="shrink-0 mt-0.5" />}
                <span className="break-all">{result.msg}</span>
              </div>
            )}
          </div>

          {/* Categorías */}
          <div className="bg-[#111] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
            <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
              <FolderOpen size={16} /> Categorías
              {article.categoryIds.length > 0 && (
                <span className="ml-auto text-xs bg-[#004AAD]/30 text-blue-300 px-2 py-0.5 rounded-full">{article.categoryIds.length}</span>
              )}
            </h3>
            {taxonomyLoading ? (
              <p className="text-xs text-gray-500 flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> Cargando de WordPress...</p>
            ) : categories.length === 0 ? (
              <p className="text-xs text-gray-500">No hay categorías. Crea una abajo.</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {categories.map(cat => (
                  <label key={cat.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group">
                    <input type="checkbox" checked={article.categoryIds.includes(cat.id)} onChange={() => toggleCategory(cat.id)} className="w-4 h-4 rounded accent-[#004AAD] cursor-pointer" />
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors flex-1">{cat.name}</span>
                    <span className="text-xs text-gray-600">{cat.count}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500 mb-2">Nueva categoría:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                  className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#004AAD] transition-colors"
                />
                <button
                  onClick={handleCreateCategory}
                  disabled={creatingCat || !newCatName.trim()}
                  className="p-2 bg-[#004AAD] hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-40"
                >
                  {creatingCat ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Etiquetas */}
          <div className="bg-[#111] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
            <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
              <Tag size={16} /> Etiquetas
              {article.tagIds.length > 0 && (
                <span className="ml-auto text-xs bg-[#F58634]/20 text-orange-300 px-2 py-0.5 rounded-full">{article.tagIds.length}</span>
              )}
            </h3>
            {article.tagIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {tags.filter(t => article.tagIds.includes(t.id)).map(tag => (
                  <span key={tag.id} className="flex items-center gap-1 bg-[#F58634]/15 border border-[#F58634]/30 text-orange-300 text-xs px-2.5 py-1 rounded-full">
                    {tag.name}
                    <button onClick={() => toggleTag(tag.id)} className="hover:text-white transition-colors"><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
            {taxonomyLoading ? (
              <p className="text-xs text-gray-500 flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> Cargando...</p>
            ) : (
              <div className="max-h-32 overflow-y-auto pr-1">
                <div className="flex flex-wrap gap-1.5">
                  {tags.filter(t => !article.tagIds.includes(t.id)).map(tag => (
                    <button key={tag.id} onClick={() => toggleTag(tag.id)} className="text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/30 px-2.5 py-1 rounded-full transition-all hover:bg-white/5">
                      + {tag.name}
                    </button>
                  ))}
                </div>
                {tags.filter(t => !article.tagIds.includes(t.id)).length === 0 && tags.length > 0 && (
                  <p className="text-xs text-gray-600">Todas las etiquetas seleccionadas.</p>
                )}
                {!taxonomyLoading && tags.length === 0 && <p className="text-xs text-gray-500">No hay etiquetas aún.</p>}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500 mb-2">Nueva etiqueta:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                  className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#F58634] transition-colors"
                />
                <button
                  onClick={handleCreateTag}
                  disabled={creatingTag || !newTagName.trim()}
                  className="p-2 bg-[#F58634] hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-40"
                >
                  {creatingTag ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Imagen Destacada */}
          <div className="bg-[#111] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
            <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
              <ImageIcon size={16} /> Imagen Destacada
            </h3>
            <div
              ref={dragRef}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${isDragging ? 'border-[#F58634] bg-orange-500/10' : 'border-gray-600 hover:border-[#004AAD]'}`}
            >
              {article.featuredImage ? (
                <div className="space-y-3">
                  <div className="text-green-400 font-semibold text-sm">Seleccionada: {article.featuredImage.name}</div>
                  <button onClick={() => setArticle(a => ({ ...a, featuredImage: null }))} className="text-xs text-[#F58634] hover:text-orange-400 underline">Cambiar imagen</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload size={28} className={`${isDragging ? 'text-[#F58634]' : 'text-gray-500'} mx-auto`} />
                  <p className="text-sm text-gray-300">Arrastra o selecciona imagen</p>
                  <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id="featured-image-input" />
                  <label htmlFor="featured-image-input" className="inline-block text-xs text-[#004AAD] hover:text-blue-400 underline cursor-pointer">Seleccionar archivo</label>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-3">1200x630px recomendado, max 5MB</p>
          </div>

          {/* Preview SEO */}
          <div className="bg-[#111] border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
            <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
              <Eye size={16} /> Preview SEO
            </h3>
            <div className="bg-white/5 rounded-lg p-4 space-y-1.5">
              <p className="text-xs font-semibold text-[#004AAD] truncate">indumex.blog &gt; {selectedCatNames[0] ?? 'Categoría'}</p>
              <p className="text-sm font-semibold text-white line-clamp-2">{article.title || 'Tu título aquí...'}</p>
              <p className="text-xs text-gray-400 line-clamp-2">{article.excerpt || 'Tu resumen SEO aparecerá aquí...'}</p>
            </div>
            {article.tagIds.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {tags.filter(t => article.tagIds.includes(t.id)).map(t => (
                  <span key={t.id} className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">#{t.name}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



