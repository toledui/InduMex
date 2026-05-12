'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createMyMarketplaceCategoria,
  createMyMarketplaceProducto,
  deleteMyMarketplaceCategoria,
  deleteMyMarketplaceProducto,
  getMyMarketplaceCategorias,
  getMyMarketplaceProductos,
  type MarketplaceCategoria,
  type MarketplacePerfil,
  type MarketplaceProducto,
  type MarketplaceProductoCampo,
  type MarketplaceSuscripcionActual,
  updateMyMarketplaceProducto,
} from '@/lib/api';
import { Download, Pencil, Plus, RefreshCw, Search, Tags, Trash2, X } from 'lucide-react';

type MarketplaceManagerProps = {
  token: string;
  perfil: MarketplacePerfil | null;
  suscripcion: MarketplaceSuscripcionActual | null;
};

type CategoryForm = {
  nombre: string;
  descripcion: string;
};

type ProductForm = {
  categoriaId: string;
  sku: string;
  nombre: string;
  descripcion: string;
  precio: string;
  moneda: string;
  impuestoTipo: string;
  stock: string;
  unidadClave: string;
  unidadOtra: string;
  destacado: boolean;
  estado: 'borrador' | 'publicado' | 'archivado';
  imagenes: string;
  metadataJson: string;
  camposPersonalizados: Array<MarketplaceProductoCampo & { _key: string }>;
};

let customFieldKeyCounter = 0;

function createCustomFieldKey(): string {
  customFieldKeyCounter += 1;
  return `custom-field-${Date.now()}-${customFieldKeyCounter}`;
}

const emptyCategoryForm: CategoryForm = {
  nombre: '',
  descripcion: '',
};

const emptyProductForm: ProductForm = {
  categoriaId: '',
  sku: '',
  nombre: '',
  descripcion: '',
  precio: '',
  moneda: 'MXN',
  impuestoTipo: 'iva_16',
  stock: '0',
  unidadClave: 'pieza',
  unidadOtra: '',
  destacado: false,
  estado: 'borrador',
  imagenes: '',
  metadataJson: '{}',
  camposPersonalizados: [{ _key: createCustomFieldKey(), clave: '', valor: '' }],
};

const TAX_OPTIONS = [
  { value: 'iva_16', label: 'IVA 16%', percentage: 16 },
  { value: 'iva_8', label: 'IVA 8%', percentage: 8 },
  { value: 'tasa_0', label: 'Tasa 0%', percentage: 0 },
  { value: 'exento', label: 'Exento', percentage: 0 },
];

const UNIT_OPTIONS = [
  { value: 'pieza', label: 'Pieza' },
  { value: 'unidad', label: 'Unidad' },
  { value: 'caja', label: 'Caja' },
  { value: 'paquete', label: 'Paquete' },
  { value: 'kit', label: 'Kit' },
  { value: 'juego', label: 'Juego' },
  { value: 'metro', label: 'Metro' },
  { value: 'metro_cuadrado', label: 'Metro cuadrado' },
  { value: 'metro_cubico', label: 'Metro cúbico' },
  { value: 'kilogramo', label: 'Kilogramo' },
  { value: 'litro', label: 'Litro' },
  { value: 'par', label: 'Par' },
  { value: 'rollo', label: 'Rollo' },
  { value: 'otro', label: 'Otro' },
];

function formatMoney(value: number, currency: string): string {
  return Number(value || 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: currency || 'MXN',
  });
}

function toImageCsv(values: string[]): string {
  return values.join(', ');
}

function fromImageCsv(value: string): string[] {
  const raw = value.trim();
  if (!raw) return [];

  if (raw.startsWith('[')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean);
      }
    } catch {
      // fallback to manual split below
    }
  }

  return raw
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeMetadata(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }

  return raw as Record<string, unknown>;
}

function getTaxPercentage(impuestoTipo: string): number {
  return TAX_OPTIONS.find((option) => option.value === impuestoTipo)?.percentage ?? 16;
}

function getUnitLabel(unidadClave: string, unidadOtra: string): string {
  if (unidadClave === 'otro') {
    return unidadOtra.trim();
  }

  return UNIT_OPTIONS.find((option) => option.value === unidadClave)?.label ?? unidadClave;
}

function mapProductToForm(product: MarketplaceProducto): ProductForm {
  const metadata = normalizeMetadata(product.metadata);
  const metadataForEditor = { ...metadata };
  delete metadataForEditor.impuestoTipo;
  delete metadataForEditor.impuestoPorcentaje;
  delete metadataForEditor.unidadClave;
  delete metadataForEditor.unidadLabel;

  return {
    categoriaId: String(product.categoriaId),
    sku: product.sku,
    nombre: product.nombre,
    descripcion: product.descripcion ?? '',
    precio: String(product.precio),
    moneda: product.moneda,
    impuestoTipo: typeof metadata.impuestoTipo === 'string' ? metadata.impuestoTipo : 'iva_16',
    stock: String(product.stock),
    unidadClave: typeof metadata.unidadClave === 'string' ? metadata.unidadClave : 'pieza',
    unidadOtra: typeof metadata.unidadLabel === 'string' && metadata.unidadClave === 'otro' ? metadata.unidadLabel : '',
    destacado: product.destacado,
    estado: product.estado,
    imagenes: toImageCsv(product.imagenes ?? []),
    metadataJson: JSON.stringify(metadataForEditor, null, 2),
    camposPersonalizados:
      product.camposPersonalizados.length > 0
        ? product.camposPersonalizados.map((item) => ({
            _key: createCustomFieldKey(),
            clave: item.clave,
            valor: item.valor,
          }))
        : [{ _key: createCustomFieldKey(), clave: '', valor: '' }],
  };
}

export default function MarketplaceManager({ token, perfil, suscripcion }: MarketplaceManagerProps) {
  const [loading, setLoading] = useState(true);
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCategoryComboboxOpen, setIsCategoryComboboxOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [categories, setCategories] = useState<MarketplaceCategoria[]>([]);
  const [products, setProducts] = useState<MarketplaceProducto[]>([]);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategoryForm);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const productLimit = perfil?.maxProductosOverride ?? suscripcion?.plan?.maxProductos ?? 0;
  const featuredLimit = suscripcion?.plan?.maxProductosDestacados ?? 0;
  const currentFeaturedCount = useMemo(
    () => products.filter((item) => item.destacado).length,
    [products]
  );
  const filteredCategories = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    if (!query) return categories;

    return categories.filter((category) => {
      const haystack = `${category.nombre} ${category.slug} ${category.descripcion ?? ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [categories, categorySearch]);
  const selectedCategory = useMemo(
    () => categories.find((category) => String(category.id) === productForm.categoriaId) ?? null,
    [categories, productForm.categoriaId]
  );
  const canCreateProduct = productLimit <= 0 || products.length < productLimit || editingProductId !== null;

  const loadData = useCallback(async () => {
    if (!perfil?.habilitado) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [categoryRows, productRows] = await Promise.all([
        getMyMarketplaceCategorias(token),
        getMyMarketplaceProductos(token),
      ]);
      setCategories(categoryRows);
      setProducts(productRows);
      setProductForm((prev) => ({
        ...prev,
        categoriaId: prev.categoriaId || (categoryRows[0] ? String(categoryRows[0].id) : ''),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el administrador de marketplace.');
    } finally {
      setLoading(false);
    }
  }, [perfil?.habilitado, token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function resetProductForm() {
    setEditingProductId(null);
    setCategorySearch('');
    setIsCategoryComboboxOpen(false);
    setProductForm({
      ...emptyProductForm,
      categoriaId: categories[0] ? String(categories[0].id) : '',
    });
  }

  function addCustomField() {
    setProductForm((prev) => ({
      ...prev,
      camposPersonalizados: [...prev.camposPersonalizados, { _key: createCustomFieldKey(), clave: '', valor: '' }],
    }));
  }

  function updateCustomField(index: number, field: 'clave' | 'valor', value: string) {
    setProductForm((prev) => ({
      ...prev,
      camposPersonalizados: prev.camposPersonalizados.map((item, currentIndex) =>
        currentIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  }

  function removeCustomField(index: number) {
    setProductForm((prev) => {
      const next = prev.camposPersonalizados.filter((_, currentIndex) => currentIndex !== index);
      return {
        ...prev,
        camposPersonalizados: next.length > 0 ? next : [{ _key: createCustomFieldKey(), clave: '', valor: '' }],
      };
    });
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!categoryForm.nombre.trim()) {
      setError('El nombre de la categoría es obligatorio.');
      return;
    }

    try {
      setSavingCategory(true);
      const created = await createMyMarketplaceCategoria(token, {
        nombre: categoryForm.nombre.trim(),
        descripcion: categoryForm.descripcion.trim() || null,
      });
      setCategories((prev) => [...prev, created].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
      setCategoryForm(emptyCategoryForm);
      setCategorySearch(created.nombre);
      setProductForm((prev) => ({
        ...prev,
        categoriaId: String(created.id),
      }));
      setIsCategoryComboboxOpen(false);
      setIsCategoryModalOpen(false);
      setMessage('Categoría creada correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la categoría.');
    } finally {
      setSavingCategory(false);
    }
  }

  async function handleDeleteCategory(id: number) {
    if (!window.confirm('¿Eliminar esta categoría? Debe estar vacía para poder borrarse.')) return;

    setDeletingCategoryId(id);
    setError(null);
    setMessage(null);

    try {
      await deleteMyMarketplaceCategoria(token, id);
      setCategories((prev) => prev.filter((item) => item.id !== id));
      setMessage('Categoría eliminada.');
      if (productForm.categoriaId === String(id)) {
        const nextCategory = categories.find((item) => item.id !== id);
        setProductForm((prev) => ({
          ...prev,
          categoriaId: nextCategory ? String(nextCategory.id) : '',
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la categoría.');
    } finally {
      setDeletingCategoryId(null);
    }
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!productForm.categoriaId) {
      setError('Selecciona una categoría.');
      return;
    }

    if (!productForm.sku.trim() || !productForm.nombre.trim()) {
      setError('SKU y nombre son obligatorios.');
      return;
    }

    if (productForm.unidadClave === 'otro' && !productForm.unidadOtra.trim()) {
      setError('Escribe la unidad del producto cuando selecciones "Otro".');
      return;
    }

    if (!canCreateProduct) {
      setError('Ya alcanzaste el límite de productos permitido por tu plan.');
      return;
    }

    let metadataParsed: Record<string, unknown> = {};
    try {
      const parsed = productForm.metadataJson.trim() ? JSON.parse(productForm.metadataJson) : {};
      metadataParsed = normalizeMetadata(parsed);
    } catch {
      setError('El JSON de metadata no es válido.');
      return;
    }

    if (productForm.destacado && featuredLimit <= 0) {
      setError('Tu plan actual no permite productos destacados.');
      return;
    }

    if (
      productForm.destacado &&
      editingProductId === null &&
      featuredLimit > 0 &&
      currentFeaturedCount >= featuredLimit
    ) {
      setError('Ya alcanzaste el límite de productos destacados de tu plan.');
      return;
    }

    const payload = {
      categoriaId: Number(productForm.categoriaId),
      sku: productForm.sku.trim(),
      nombre: productForm.nombre.trim(),
      descripcion: productForm.descripcion.trim() || null,
      precio: Number(productForm.precio),
      moneda: productForm.moneda,
      stock: Number(productForm.stock || 0),
      destacado: productForm.destacado,
      estado: productForm.estado,
      imagenes: fromImageCsv(productForm.imagenes),
      metadata: {
        ...metadataParsed,
        impuestoTipo: productForm.impuestoTipo,
        impuestoPorcentaje: getTaxPercentage(productForm.impuestoTipo),
        unidadClave: productForm.unidadClave,
        unidadLabel: getUnitLabel(productForm.unidadClave, productForm.unidadOtra),
      },
      camposPersonalizados: productForm.camposPersonalizados.filter(
        (item) => item.clave.trim() && item.valor.trim()
      ),
    };

    try {
      setSavingProduct(true);
      if (editingProductId) {
        const updated = await updateMyMarketplaceProducto(token, editingProductId, payload);
        setProducts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setMessage('Producto actualizado correctamente.');
      } else {
        const created = await createMyMarketplaceProducto(token, payload);
        setProducts((prev) => [created, ...prev]);
        setMessage('Producto creado correctamente.');
      }
      resetProductForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el producto.');
    } finally {
      setSavingProduct(false);
    }
  }

  function handleEditProduct(product: MarketplaceProducto) {
    setEditingProductId(product.id);
    setProductForm(mapProductToForm(product));
    setCategorySearch(product.categoria?.nombre ?? '');
    setMessage(null);
    setError(null);
  }

  async function handleDeleteProduct(id: number) {
    if (!window.confirm('¿Eliminar este producto?')) return;

    setDeletingProductId(id);
    setError(null);
    setMessage(null);

    try {
      await deleteMyMarketplaceProducto(token, id);
      setProducts((prev) => prev.filter((item) => item.id !== id));
      if (editingProductId === id) {
        resetProductForm();
      }
      setMessage('Producto eliminado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el producto.');
    } finally {
      setDeletingProductId(null);
    }
  }

  function handleDownloadTemplate() {
    const csv = [
      'sku,nombre,categoria,precio,moneda,stock,estado,destacado,descripcion,imagenes,campos_personalizados_json',
      'SKU-001,Sensor inductivo M18,Sensores,1250,MXN,15,publicado,false,Sensor industrial de proximidad,"https://ejemplo.com/sensor.jpg","[{""clave"":""voltaje"",""valor"":""24VDC""}]"',
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'indumex-marketplace-template.csv';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  function openCategoryModal() {
    setError(null);
    setMessage(null);
    setIsCategoryModalOpen(true);
  }

  function closeCategoryModal() {
    if (savingCategory) return;
    setIsCategoryModalOpen(false);
    setCategoryForm(emptyCategoryForm);
  }

  function handleCategorySelect(categoryId: string) {
    setProductForm((prev) => ({
      ...prev,
      categoriaId: categoryId,
    }));

    const nextCategory = categories.find((category) => String(category.id) === categoryId);
    setCategorySearch(nextCategory?.nombre ?? '');
    setIsCategoryComboboxOpen(false);
  }

  if (!perfil?.habilitado) {
    return null;
  }

  return (
    <div className="mt-6 space-y-6">
      {error && <p className="rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</p>}
      {message && <p className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">{message}</p>}

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">Límite de productos</p>
          <p className="mt-2 text-3xl font-black text-white">{products.length}/{productLimit || 0}</p>
          <p className="mt-2 text-sm text-white/55">Productos activos dentro de tu plan actual.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">Productos destacados</p>
          <p className="mt-2 text-3xl font-black text-white">{currentFeaturedCount}/{featuredLimit}</p>
          <p className="mt-2 text-sm text-white/55">Controla la visibilidad premium dentro del marketplace.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">Carga masiva</p>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#004AAD]/30 bg-[#004AAD]/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#9cc3ff]"
          >
            <Download className="h-4 w-4" /> Descargar template CSV
          </button>
          <p className="mt-3 text-sm text-white/55">Usa este formato para preparar tu catálogo antes de la importación masiva.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <section className="rounded-2xl border border-white/10 bg-[#021325] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-['Rubik'] text-xl font-bold text-white">Productos</h3>
              <p className="mt-1 text-sm text-white/50">Alta manual con categoría, SKU, estado, imágenes y campos personalizados.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openCategoryModal}
                className="inline-flex items-center gap-2 rounded-lg border border-[#004AAD]/30 bg-[#004AAD]/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#9cc3ff]"
              >
                <Plus className="h-4 w-4" /> Crear categoría
              </button>
              <button
                type="button"
                onClick={() => void loadData()}
                className="rounded-lg border border-white/15 p-2 text-white/55 hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              {editingProductId && (
                <button
                  type="button"
                  onClick={resetProductForm}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold uppercase tracking-widest text-white/65"
                >
                  <X className="h-4 w-4" /> Cancelar edición
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSaveProduct} className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 md:col-span-2">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">Categoría del producto</p>
                  <p className="mt-1 text-sm text-white/50">Busca una categoría existente o crea una nueva sin salir del formulario.</p>
                </div>
                <button
                  type="button"
                  onClick={openCategoryModal}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#F58634]/30 bg-[#F58634]/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#F58634]"
                >
                  <Plus className="h-4 w-4" /> Nueva categoría
                </button>
              </div>

              <div className="mt-4">
                <div className="relative rounded-lg border border-white/15 bg-[#021325] px-4 py-3 text-sm text-white focus-within:border-[#004AAD] focus-within:ring-1 focus-within:ring-[#004AAD]/30">
                  <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/35">
                    <Search className="h-3.5 w-3.5" /> Categoría
                  </span>
                  <input
                    value={categorySearch}
                    onFocus={() => setIsCategoryComboboxOpen(true)}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCategorySearch(value);
                      setIsCategoryComboboxOpen(true);

                      if (!value.trim()) {
                        setProductForm((prev) => ({ ...prev, categoriaId: '' }));
                      }
                    }}
                    onBlur={() => {
                      window.setTimeout(() => {
                        setIsCategoryComboboxOpen(false);
                        if (selectedCategory) {
                          setCategorySearch(selectedCategory.nombre);
                        }
                      }, 120);
                    }}
                    placeholder="Busca y selecciona una categoría"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                  />

                  {isCategoryComboboxOpen && (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-xl border border-white/10 bg-[#031c38] shadow-2xl">
                      {filteredCategories.length > 0 ? (
                        <div className="max-h-64 overflow-y-auto py-2">
                          {filteredCategories.map((category) => {
                            const isSelected = String(category.id) === productForm.categoriaId;

                            return (
                              <button
                                key={category.id}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleCategorySelect(String(category.id))}
                                className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors ${
                                  isSelected ? 'bg-[#004AAD]/15 text-white' : 'text-white/75 hover:bg-white/5 hover:text-white'
                                }`}
                              >
                                <span>
                                  <span className="block text-sm font-semibold">{category.nombre}</span>
                                  <span className="mt-1 block text-xs text-white/40">/{category.slug}</span>
                                </span>
                                {isSelected && (
                                  <span className="rounded-full border border-[#004AAD]/30 bg-[#004AAD]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#9cc3ff]">
                                    Seleccionada
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="px-4 py-4 text-sm text-white/45">
                          No hay categorías que coincidan con tu búsqueda.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/55">
                <span className="rounded-full border border-white/15 px-2.5 py-1">
                  {filteredCategories.length} resultado{filteredCategories.length === 1 ? '' : 's'}
                </span>
                {selectedCategory ? (
                  <span className="rounded-full border border-[#004AAD]/30 bg-[#004AAD]/10 px-2.5 py-1 text-[#9cc3ff]">
                    Seleccionada: {selectedCategory.nombre}
                  </span>
                ) : (
                  <span className="rounded-full border border-white/15 px-2.5 py-1">Aún no seleccionas categoría</span>
                )}
              </div>
            </div>
            <label className="rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white focus-within:border-[#004AAD] focus-within:ring-1 focus-within:ring-[#004AAD]/30">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/35">SKU</span>
              <input
                value={productForm.sku}
                onChange={(e) => setProductForm((prev) => ({ ...prev, sku: e.target.value }))}
                placeholder="Ej. SKU-001"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
              />
            </label>
            <label className="md:col-span-2 rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white focus-within:border-[#004AAD] focus-within:ring-1 focus-within:ring-[#004AAD]/30">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/35">Nombre del producto</span>
              <input
                value={productForm.nombre}
                onChange={(e) => setProductForm((prev) => ({ ...prev, nombre: e.target.value }))}
                placeholder="Nombre comercial del producto"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
              />
            </label>
            <label className="md:col-span-2 rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white focus-within:border-[#004AAD] focus-within:ring-1 focus-within:ring-[#004AAD]/30">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/35">Descripción</span>
              <textarea
                value={productForm.descripcion}
                onChange={(e) => setProductForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Describe especificaciones, aplicaciones o beneficios"
                rows={3}
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
              />
            </label>
            <label className="rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white focus-within:border-[#004AAD] focus-within:ring-1 focus-within:ring-[#004AAD]/30">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/35">Precio base</span>
              <input
                value={productForm.precio}
                type="number"
                min="0"
                step="0.01"
                onChange={(e) => setProductForm((prev) => ({ ...prev, precio: e.target.value }))}
                placeholder="0.00"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
              />
            </label>
            <label className="rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white focus-within:border-[#004AAD] focus-within:ring-1 focus-within:ring-[#004AAD]/30">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/35">Moneda del precio</span>
              <select
                value={productForm.moneda}
                onChange={(e) => setProductForm((prev) => ({ ...prev, moneda: e.target.value }))}
                className="scheme-dark w-full rounded-md bg-[#021325] px-0 text-sm text-white outline-none"
              >
                <option value="MXN" className="bg-[#021325] text-white">MXN</option>
                <option value="USD" className="bg-[#021325] text-white">USD</option>
                <option value="EUR" className="bg-[#021325] text-white">EUR</option>
              </select>
            </label>
            <label className="rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white focus-within:border-[#004AAD] focus-within:ring-1 focus-within:ring-[#004AAD]/30">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/35">Impuesto</span>
              <select
                value={productForm.impuestoTipo}
                onChange={(e) => setProductForm((prev) => ({ ...prev, impuestoTipo: e.target.value }))}
                className="scheme-dark w-full rounded-md bg-[#021325] px-0 text-sm text-white outline-none"
              >
                {TAX_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#021325] text-white">
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white focus-within:border-[#004AAD] focus-within:ring-1 focus-within:ring-[#004AAD]/30">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/35">Stock disponible</span>
              <input
                value={productForm.stock}
                type="number"
                min="0"
                onChange={(e) => setProductForm((prev) => ({ ...prev, stock: e.target.value }))}
                placeholder="0"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
              />
            </label>
            <label className="rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white focus-within:border-[#004AAD] focus-within:ring-1 focus-within:ring-[#004AAD]/30">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/35">Unidad del producto</span>
              <select
                value={productForm.unidadClave}
                onChange={(e) => setProductForm((prev) => ({ ...prev, unidadClave: e.target.value, unidadOtra: e.target.value === 'otro' ? prev.unidadOtra : '' }))}
                className="scheme-dark w-full rounded-md bg-[#021325] px-0 text-sm text-white outline-none"
              >
                {UNIT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#021325] text-white">
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {productForm.unidadClave === 'otro' && (
              <label className="rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white focus-within:border-[#004AAD] focus-within:ring-1 focus-within:ring-[#004AAD]/30">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/35">Especifica la unidad</span>
                <input
                  value={productForm.unidadOtra}
                  onChange={(e) => setProductForm((prev) => ({ ...prev, unidadOtra: e.target.value }))}
                  placeholder="Ej. Tarima, galón, tonelada"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                />
              </label>
            )}
            <label className="rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white focus-within:border-[#004AAD] focus-within:ring-1 focus-within:ring-[#004AAD]/30">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/35">Estado del producto</span>
              <select
                value={productForm.estado}
                onChange={(e) => setProductForm((prev) => ({ ...prev, estado: e.target.value as ProductForm['estado'] }))}
                className="scheme-dark w-full rounded-md bg-[#021325] px-0 text-sm text-white outline-none"
              >
                <option value="borrador" className="bg-[#021325] text-white">Borrador</option>
                <option value="publicado" className="bg-[#021325] text-white">Publicado</option>
                <option value="archivado" className="bg-[#021325] text-white">Archivado</option>
              </select>
            </label>
            <label className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white">
              <input
                type="checkbox"
                checked={productForm.destacado}
                onChange={(e) => setProductForm((prev) => ({ ...prev, destacado: e.target.checked }))}
                className="h-4 w-4 accent-[#F58634]"
              />
              Producto destacado
            </label>
            <label className="md:col-span-2 rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white focus-within:border-[#004AAD] focus-within:ring-1 focus-within:ring-[#004AAD]/30">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/35">URLs de imágenes</span>
              <input
                value={productForm.imagenes}
                onChange={(e) => setProductForm((prev) => ({ ...prev, imagenes: e.target.value }))}
                placeholder="Separa múltiples URLs con coma"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
              />
            </label>
            <label className="md:col-span-2 rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white focus-within:border-[#004AAD] focus-within:ring-1 focus-within:ring-[#004AAD]/30">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/35">Metadata adicional JSON</span>
              <textarea
                value={productForm.metadataJson}
                onChange={(e) => setProductForm((prev) => ({ ...prev, metadataJson: e.target.value }))}
                rows={4}
                placeholder='Ej. {"marca":"Siemens","modelo":"3RT"}'
                className="w-full bg-transparent font-mono text-sm text-white outline-none placeholder:text-white/35"
              />
            </label>

            <div className="md:col-span-2 rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">Campos personalizados</p>
                  <p className="mt-1 text-xs text-white/45">Agrega pares clave/valor según lo que necesite tu ficha.</p>
                </div>
                <button
                  type="button"
                  onClick={addCustomField}
                  className="rounded-full border border-[#F58634]/30 bg-[#F58634]/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#F58634]"
                >
                  Agregar campo
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {productForm.camposPersonalizados.map((field, index) => (
                  <div key={field._key} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                    <input
                      value={field.clave}
                      onChange={(e) => updateCustomField(index, 'clave', e.target.value)}
                      placeholder="Clave"
                      className="rounded-lg border border-white/15 bg-[#021325] px-4 py-3 text-sm text-white"
                    />
                    <input
                      value={field.valor}
                      onChange={(e) => updateCustomField(index, 'valor', e.target.value)}
                      placeholder="Valor"
                      className="rounded-lg border border-white/15 bg-[#021325] px-4 py-3 text-sm text-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeCustomField(index)}
                      className="rounded-lg border border-white/15 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white/60"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProduct || !categories.length}
              className="md:col-span-2 rounded-lg bg-[#F58634] px-4 py-3 text-xs font-bold uppercase tracking-widest text-black disabled:opacity-50"
            >
              {savingProduct ? 'Guardando...' : editingProductId ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            {products.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white/45">
                Todavía no has capturado productos en tu catálogo.
              </div>
            ) : (
              products.map((product) => (
                <article key={product.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-white">{product.nombre}</p>
                        <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/55">
                          {product.estado}
                        </span>
                        {product.destacado && (
                          <span className="rounded-full border border-[#F58634]/30 bg-[#F58634]/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#F58634]">
                            Destacado
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/55">
                        <span>SKU: {product.sku}</span>
                        <span>Categoría: {product.categoria?.nombre ?? 'Sin categoría'}</span>
                        <span>{formatMoney(product.precio, product.moneda)}</span>
                        <span>Stock: {product.stock}</span>
                      </div>
                      {product.descripcion && <p className="mt-3 text-sm text-white/65">{product.descripcion}</p>}
                      {product.camposPersonalizados.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {product.camposPersonalizados.map((field, index) => (
                            <span key={`${product.id}-${index}`} className="rounded-full border border-white/15 px-2.5 py-1 text-[11px] text-white/60">
                              {field.clave}: {field.valor}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditProduct(product)}
                        className="rounded-lg border border-white/15 p-2 text-white/55 hover:text-white"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteProduct(product.id)}
                        disabled={deletingProductId === product.id}
                        className="rounded-lg border border-white/15 p-2 text-white/55 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#021325] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-['Rubik'] text-xl font-bold text-white">Crear categoría</h3>
                <p className="mt-1 text-sm text-white/50">Agrega una categoría y selecciónala de inmediato para tu producto.</p>
              </div>
              <button
                type="button"
                onClick={closeCategoryModal}
                className="rounded-lg border border-white/15 p-2 text-white/55 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="mt-5 grid gap-3 md:grid-cols-2">
              <input
                value={categoryForm.nombre}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, nombre: e.target.value }))}
                placeholder="Nombre de la categoría"
                className="rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white md:col-span-2"
              />
              <textarea
                value={categoryForm.descripcion}
                onChange={(e) => setCategoryForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Descripción opcional"
                rows={3}
                className="rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white md:col-span-2"
              />
              <div className="md:col-span-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeCategoryModal}
                  className="rounded-lg border border-white/15 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-white/65"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#F58634] px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-black disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" /> {savingCategory ? 'Guardando...' : 'Crear categoría'}
                </button>
              </div>
            </form>

            <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">Categorías actuales</p>
                  <p className="mt-1 text-sm text-white/50">Puedes revisar o eliminar categorías vacías desde aquí.</p>
                </div>
                <span className="rounded-full border border-white/15 px-2.5 py-1 text-xs text-white/55">
                  {categories.length} categor{categories.length === 1 ? 'ía' : 'ías'}
                </span>
              </div>

              <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
                {categories.length === 0 ? (
                  <div className="rounded-xl border border-white/10 bg-[#021325] p-4 text-sm text-white/45">
                    Crea tu primera categoría para empezar a capturar productos.
                  </div>
                ) : (
                  categories.map((category) => (
                    <div key={category.id} className="rounded-xl border border-white/10 bg-[#021325] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{category.nombre}</p>
                          <p className="mt-1 text-xs text-white/45">/{category.slug}</p>
                          {category.descripcion && <p className="mt-2 text-sm text-white/55">{category.descripcion}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleDeleteCategory(category.id)}
                          disabled={deletingCategoryId === category.id}
                          className="rounded-lg border border-white/15 p-2 text-white/45 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
        <div className="flex items-start gap-3">
          <Tags className="mt-0.5 h-5 w-5 text-[#004AAD]" />
          <div>
            <p className="text-sm font-semibold text-white">Importación CSV</p>
            <p className="mt-1 text-sm text-white/55">
              Ya puedes descargar el template oficial. En el siguiente paso conectamos la subida masiva y la vista previa de filas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
