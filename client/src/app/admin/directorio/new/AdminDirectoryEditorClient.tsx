'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  FileText,
  ListFilter,
  Save,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import {
  createAdminProvider,
  getAdminProviders,
  getAuthTokenFromCookie,
  getUsers,
  updateAdminProvider,
  uploadProviderLogo,
  type AdminUser,
  type PublicProvider,
  type AdminProviderInput,
} from '@/lib/api';
import { PROVIDER_SECTORS, isImageLogo, sanitizeRichText } from '@/lib/provider-sectors';

type ProviderFormState = {
  name: string;
  slug: string;
  logo: string;
  tier: 'premium' | 'verified' | 'basic';
  shortDescription: string;
  about: string;
  selectedSectors: string[];
  otherSector: string;
  certifications: string;
  city: string;
  state: string;
  country: string;
  website: string;
  email: string;
  phone: string;
  whatsapp: string;
  usuarioEmail: string;
  socialNetworks: Array<{ nombre: string; url: string }>;
  isActive: boolean;
};

const emptyForm: ProviderFormState = {
  name: '',
  slug: '',
  logo: '',
  tier: 'basic',
  shortDescription: '',
  about: '',
  selectedSectors: [],
  otherSector: '',
  certifications: '',
  city: '',
  state: '',
  country: 'México',
  website: '',
  email: '',
  phone: '',
  whatsapp: '',
  usuarioEmail: '',
  socialNetworks: [{ nombre: '', url: '' }],
  isActive: true,
};

function stripProtocol(value: string): string {
  return value.trim().replace(/^https?:\/\//i, '');
}

function normalizeWebsite(value: string): string {
  const trimmed = stripProtocol(value);
  return trimmed ? `https://${trimmed}` : '';
}

function normalizeSocialUrl(value: string): string {
  const trimmed = stripProtocol(value);
  return trimmed ? `https://${trimmed}` : '';
}

function toCsv(value: string[]): string {
  return value.join(', ');
}

function fromCsv(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeForm(provider?: PublicProvider | null): ProviderFormState {
  if (!provider) {
    return emptyForm;
  }

  const selectedSectors = provider.sectors.filter((sector) => PROVIDER_SECTORS.includes(sector as (typeof PROVIDER_SECTORS)[number]));
  const otherSector = provider.sectors.find((sector) => !PROVIDER_SECTORS.includes(sector as (typeof PROVIDER_SECTORS)[number])) ?? '';

  return {
    name: provider.name,
    slug: provider.slug,
    logo: provider.logo,
    tier: provider.tier,
    shortDescription: provider.shortDescription,
    about: provider.about,
    selectedSectors,
    otherSector,
    certifications: toCsv(provider.certifications),
    city: provider.city,
    state: provider.state,
    country: provider.country,
    website: stripProtocol(provider.website),
    email: provider.email,
    phone: provider.phone,
    whatsapp: provider.whatsapp,
    usuarioEmail: provider.usuarioId ? provider.email : '',
    socialNetworks: provider.socialNetworks?.length
      ? provider.socialNetworks.map((item) => ({
          nombre: item.nombre,
          url: stripProtocol(item.url),
        }))
      : [{ nombre: '', url: '' }],
    isActive: provider.isActive,
  };
}

function buildPayload(form: ProviderFormState): AdminProviderInput {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    logo: form.logo.trim(),
    tier: form.tier,
    shortDescription: form.shortDescription.trim(),
    about: sanitizeRichText(form.about),
    sectors: [...form.selectedSectors, ...(form.otherSector.trim() ? [form.otherSector.trim()] : [])],
    certifications: fromCsv(form.certifications),
    socialNetworks: form.socialNetworks
      .map((item) => ({ nombre: item.nombre.trim(), url: normalizeSocialUrl(item.url) }))
      .filter((item) => item.nombre && item.url),
    city: form.city.trim(),
    state: form.state.trim(),
    country: form.country.trim(),
    website: normalizeWebsite(form.website),
    email: form.email.trim(),
    phone: form.phone.trim(),
    whatsapp: form.whatsapp.trim(),
    usuarioEmail: form.usuarioEmail.trim(),
    isActive: form.isActive,
  };
}

function ProviderEditorForm({
  initialProvider,
  users,
  onSave,
}: {
  initialProvider: PublicProvider | null;
  users: AdminUser[];
  onSave: (providerId: number | null, payload: AdminProviderInput) => Promise<PublicProvider>;
}) {
  const [form, setForm] = useState<ProviderFormState>(() => normalizeForm(initialProvider));
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setForm(normalizeForm(initialProvider));
  }, [initialProvider]);

  useEffect(() => {
    if (!initialProvider?.usuarioId || users.length === 0) return;
    const linkedUser = users.find((user) => user.id === initialProvider.usuarioId);
    if (linkedUser) {
      setForm((current) => ({ ...current, usuarioEmail: linkedUser.email }));
    }
  }, [initialProvider, users]);

  function updateField<K extends keyof ProviderFormState>(field: K, value: ProviderFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleSector(sector: string) {
    setForm((current) => ({
      ...current,
      selectedSectors: current.selectedSectors.includes(sector)
        ? current.selectedSectors.filter((item) => item !== sector)
        : [...current.selectedSectors, sector],
    }));
  }

  function addCustomSector() {
    const value = form.otherSector.trim();
    if (!value || form.selectedSectors.includes(value)) return;

    setForm((current) => ({
      ...current,
      selectedSectors: [...current.selectedSectors, value],
      otherSector: '',
    }));
  }

  function addSocialNetwork() {
    setForm((current) => ({
      ...current,
      socialNetworks: [...current.socialNetworks, { nombre: '', url: '' }],
    }));
  }

  function updateSocialNetwork(index: number, field: 'nombre' | 'url', value: string) {
    setForm((current) => ({
      ...current,
      socialNetworks: current.socialNetworks.map((item, currentIndex) =>
        currentIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  }

  function removeSocialNetwork(index: number) {
    setForm((current) => {
      const next = current.socialNetworks.filter((_, currentIndex) => currentIndex !== index);
      return {
        ...current,
        socialNetworks: next.length > 0 ? next : [{ nombre: '', url: '' }],
      };
    });
  }

  async function handleLogoUpload(file: File | null) {
    const token = getAuthTokenFromCookie();
    if (!token || !file) return;

    if (file.size > 1024 * 1024) {
      setError('El logo no puede pesar mas de 1 MB.');
      return;
    }

    setLogoUploading(true);
    setError(null);

    try {
      const result = await uploadProviderLogo(token, file);
      updateField('logo', result.url);
      setMessage('Logo cargado correctamente.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo subir el logo.');
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const saved = await onSave(initialProvider?.id ?? null, buildPayload(form));
      setForm(normalizeForm(saved));
      setMessage(initialProvider ? 'Proveedor actualizado correctamente.' : 'Proveedor creado correctamente.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo guardar el proveedor.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {error && <p className="mb-6 rounded-xl border border-red-600/30 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</p>}
      {message && <p className="mb-6 rounded-xl border border-emerald-600/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">{message}</p>}

      <form id="provider-editor-form" onSubmit={handleSubmit} className="grid grid-cols-12 gap-8">
        <div className="col-span-12 space-y-8 lg:col-span-8">
          <section className="rounded-2xl border border-white/10 bg-[#031c38] p-6">
            <h2 className="mb-5 text-lg font-bold text-white">Identidad corporativa</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <input className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white" placeholder="Nombre comercial" value={form.name} onChange={(e) => updateField('name', e.target.value)} />
              <input className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white" placeholder="Slug" value={form.slug} onChange={(e) => updateField('slug', e.target.value)} />
              <input className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white md:col-span-2" placeholder="Descripción corta" value={form.shortDescription} onChange={(e) => updateField('shortDescription', e.target.value)} />
              <textarea className="min-h-40 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white md:col-span-2" placeholder="Descripción completa" value={form.about} onChange={(e) => updateField('about', e.target.value)} />
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#031c38] p-6">
            <h2 className="mb-5 text-lg font-bold text-white">Operación y contacto</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <input className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white" placeholder="Ciudad" value={form.city} onChange={(e) => updateField('city', e.target.value)} />
              <input className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white" placeholder="Estado" value={form.state} onChange={(e) => updateField('state', e.target.value)} />
              <label className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white md:col-span-2">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/35">Sitio web</span>
                <span className="flex items-center gap-2">
                  <span className="text-white/45">https://</span>
                  <input className="w-full bg-transparent text-sm text-white outline-none" placeholder="tuempresa.com" value={form.website} onChange={(e) => updateField('website', stripProtocol(e.target.value))} />
                </span>
              </label>
              <input className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white" placeholder="Email" value={form.email} onChange={(e) => updateField('email', e.target.value)} />
              <input className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white" placeholder="Telefono" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} />
              <input className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white md:col-span-2" placeholder="WhatsApp" value={form.whatsapp} onChange={(e) => updateField('whatsapp', e.target.value)} />
              <div className="rounded-xl border border-[#004AAD]/30 bg-[#004AAD]/5 p-3 md:col-span-2">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#004AAD]">Usuario vinculado</p>
                <input
                  list="provider-users-list"
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                  value={form.usuarioEmail}
                  onChange={(e) => updateField('usuarioEmail', e.target.value)}
                  placeholder="Buscar y seleccionar usuario por nombre o email"
                />
                <datalist id="provider-users-list">
                  {users.map((user) => (
                    <option key={user.id} value={user.email}>{`${user.nombre} - ${user.email}`}</option>
                  ))}
                </datalist>
                <p className="mt-2 text-[11px] text-white/40">Escribe para buscar y selecciona del mismo campo. Si lo dejas vacío, se guarda sin vincular.</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#031c38] p-6">
            <h2 className="mb-5 text-lg font-bold text-white">Sectores</h2>
            <div className="flex flex-wrap gap-2">
              {PROVIDER_SECTORS.map((sector) => {
                const active = form.selectedSectors.includes(sector);
                return (
                  <button
                    key={sector}
                    type="button"
                    onClick={() => toggleSector(sector)}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold ${active ? 'border-[#F58634]/40 bg-[#F58634]/10 text-[#F58634]' : 'border-white/15 bg-white/5 text-slate-300'}`}
                  >
                    {sector}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex gap-2">
              <input className="flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white" placeholder="Otro sector" value={form.otherSector} onChange={(e) => updateField('otherSector', e.target.value)} />
              <button type="button" onClick={addCustomSector} className="rounded-xl border border-[#004AAD]/30 bg-[#004AAD]/10 px-4 py-3 text-xs font-bold uppercase tracking-widest text-[#004AAD]">Agregar</button>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#031c38] p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Redes sociales</h2>
                <p className="text-sm text-white/45">Agrega tantas como necesites.</p>
              </div>
              <button type="button" onClick={addSocialNetwork} className="rounded-xl border border-[#F58634]/30 bg-[#F58634]/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#F58634]">Agregar red</button>
            </div>

            <div className="space-y-3">
              {form.socialNetworks.map((social, index) => (
                <div key={`${index}-${social.nombre}-${social.url}`} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                  <input className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white" placeholder="Nombre" value={social.nombre} onChange={(e) => updateSocialNetwork(index, 'nombre', e.target.value)} />
                  <label className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/35">URL</span>
                    <span className="flex items-center gap-2">
                      <span className="text-white/45">https://</span>
                      <input className="w-full bg-transparent text-sm text-white outline-none" placeholder="instagram.com/tuempresa" value={stripProtocol(social.url)} onChange={(e) => updateSocialNetwork(index, 'url', e.target.value)} />
                    </span>
                  </label>
                  <button type="button" onClick={() => removeSocialNetwork(index)} className="rounded-xl border border-white/15 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white/60">Quitar</button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="col-span-12 space-y-8 lg:col-span-4">
          <section className="rounded-2xl border border-white/10 bg-[#031c38] p-6">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-white"><ListFilter className="h-5 w-5 text-[#F58634]" /> Clasificación</h2>
            <div className="space-y-3">
              {[
                { value: 'premium', label: 'Premium' },
                { value: 'verified', label: 'Verified' },
                { value: 'basic', label: 'Basic' },
              ].map((option) => (
                <label key={option.value} className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 ${form.tier === option.value ? 'border-[#F58634]/30 bg-[#F58634]/10 text-white' : 'border-white/10 bg-black/20 text-white/70'}`}>
                  <span className="text-sm font-semibold">{option.label}</span>
                  <input type="radio" name="tier" checked={form.tier === option.value} onChange={() => updateField('tier', option.value as ProviderFormState['tier'])} />
                </label>
              ))}
            </div>
            <label className="mt-4 flex items-center gap-3 text-sm text-slate-300">
              <input type="checkbox" checked={form.isActive} onChange={(e) => updateField('isActive', e.target.checked)} />
              Activo
            </label>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#031c38] p-6">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-white"><ShieldCheck className="h-5 w-5 text-[#F58634]" /> Logo</h2>
            <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-4 text-center">
              <div className="mx-auto flex h-44 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#021325]">
                {form.logo && isImageLogo(form.logo) ? (
                  <img src={form.logo} alt={form.name || 'Logo del proveedor'} className="h-full w-full object-contain p-3" />
                ) : (
                  <span className="text-sm text-white/35">Aún no hay logo</span>
                )}
              </div>
              <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white/70">
                <Upload className="h-4 w-4" />
                {logoUploading ? 'Subiendo...' : 'Subir logo'}
                <input type="file" accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => void handleLogoUpload(e.target.files?.[0] ?? null)} />
              </label>
            </div>
            <p className="mt-3 text-xs text-white/35">PNG, JPG, WebP o SVG. Máximo 1 MB.</p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#031c38] p-6">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-white"><FileText className="h-5 w-5 text-[#004AAD]" /> Vista previa</h2>
            <p className="text-sm text-white/60">{form.shortDescription || 'Sin descripción corta'}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/35">URL final</p>
            <p className="mt-1 break-all text-sm text-white/55">{form.website ? `https://${form.website}` : 'Sin sitio web'}</p>
          </section>
        </div>
      </form>
    </>
  );
}

export default function AdminDirectoryEditorClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingSlug = searchParams.get('slug');

  const [providers, setProviders] = useState<PublicProvider[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAuthTokenFromCookie();
    if (!token) {
      router.push('/admin/login');
      return;
    }

    void (async () => {
      try {
        setLoading(true);
        setPageError(null);
        const [providerData, userData] = await Promise.all([
          getAdminProviders(token),
          getUsers(token),
        ]);
        setProviders(providerData);
        setUsers(userData);
      } catch (requestError) {
        setPageError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los proveedores.');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const editingProvider = useMemo(
    () => providers.find((provider) => provider.slug === editingSlug) ?? null,
    [providers, editingSlug]
  );

  async function handleSave(providerId: number | null, payload: AdminProviderInput) {
    const token = getAuthTokenFromCookie();
    if (!token) {
      throw new Error('Sesion invalida.');
    }

    const saved = providerId
      ? await updateAdminProvider(token, providerId, payload)
      : await createAdminProvider(token, payload);

    const refreshed = await getAdminProviders(token);
    setProviders(refreshed);
    if (!providerId) {
      router.replace(`/admin/directorio/new?slug=${encodeURIComponent(saved.slug)}`);
    }

    return saved;
  }

  if (loading) {
    return <div className="mx-auto max-w-5xl px-6 py-12 text-white/60">Cargando proveedor...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 text-white">
      <div className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#F58634]">
            <Building2 className="h-4 w-4" /> Directorio B2B
          </div>
          <h1 className="text-3xl font-black tracking-tight">{editingProvider ? 'Editar proveedor' : 'Alta de proveedor'}</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/45">
            {editingProvider
              ? 'Haz click sobre una empresa desde el listado para editarla aquí.'
              : 'Crea un nuevo proveedor y asócialo al directorio B2B.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/directorio"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/70 transition-all hover:border-white/20 hover:text-white"
          >
            <ArrowLeft size={16} />
            Volver al listado
          </Link>
          <button
            type="submit"
            form="provider-editor-form"
            className="inline-flex items-center gap-2 rounded-xl bg-[#F58634] px-5 py-2.5 text-sm font-bold text-black transition-all hover:bg-[#e5762a] disabled:opacity-50"
          >
            <Save size={16} />
            {editingProvider ? 'Guardar cambios' : 'Crear proveedor'}
          </button>
        </div>
      </div>

      {pageError && <p className="mb-6 rounded-xl border border-red-600/30 bg-red-950/30 px-4 py-3 text-sm text-red-300">{pageError}</p>}

      <ProviderEditorForm key={editingProvider?.id ?? editingSlug ?? 'new'} initialProvider={editingProvider} users={users} onSave={handleSave} />
    </div>
  );
}
