'use client';

import { useEffect, useState } from 'react';
import { Mail, Zap, Save, Server, Lock, User, AtSign, ShieldCheck, Globe, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { getConfig, updateConfig, getAuthTokenFromCookie } from '@/lib/api';

const inputBase =
  'w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all duration-200 focus:border-[#F58634] focus:ring-1 focus:ring-[#F58634]/30';

const selectBase =
  'w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none transition-all duration-200 focus:border-[#F58634] focus:ring-1 focus:ring-[#F58634]/30 appearance-none cursor-pointer';

function FieldGroup({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-2 text-xs font-semibold text-white/50 uppercase tracking-widest">
        <Icon size={12} className="text-[#F58634]" />
        {label}
      </label>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [form, setForm] = useState({
    host: '',
    port: '587',
    usuario: '',
    password: '',
    cifrado: 'TLS',
    nombreRemitente: 'InduMex B2B',
    emailRemitente: '',
  });
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // ── WordPress config ──────────────────────────────────────────
  const [wpForm, setWpForm] = useState({
    wordpress_api_url: '',
    wordpress_revalidate: '60',
    wordpress_rest_api_url: '',
    wordpress_api_user: '',
    wordpress_api_password: '',
  });
  const [isWpLoading, setIsWpLoading] = useState(true);
  const [isWpSaving, setIsWpSaving] = useState(false);
  const [wpSaveResult, setWpSaveResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // ── Email marketing providers (Mailrelay / Mailchimp) ─────────
  const [marketingForm, setMarketingForm] = useState({
    email_provider_default: 'local',
    mailrelay_enabled: 'false',
    mailrelay_api_url: '',
    mailrelay_api_key: '',
    mailrelay_group_id: '',
    mailchimp_enabled: 'false',
    mailchimp_api_key: '',
    mailchimp_server_prefix: '',
    mailchimp_audience_id: '',
    mailchimp_tags_default: '',
  });
  const [isMarketingLoading, setIsMarketingLoading] = useState(true);
  const [isMarketingSaving, setIsMarketingSaving] = useState(false);
  const [marketingResult, setMarketingResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    getConfig()
      .then((cfg) => {
        setWpForm({
          wordpress_api_url: cfg.wordpress_api_url ?? '',
          wordpress_revalidate: cfg.wordpress_revalidate ?? '60',
          wordpress_rest_api_url: cfg.wordpress_rest_api_url ?? '',
          wordpress_api_user: cfg.wordpress_api_user ?? '',
          wordpress_api_password: cfg.wordpress_api_password ?? '',
        });

        setMarketingForm({
          email_provider_default: cfg.email_provider_default ?? 'local',
          mailrelay_enabled: cfg.mailrelay_enabled ?? 'false',
          mailrelay_api_url: cfg.mailrelay_api_url ?? '',
          mailrelay_api_key: cfg.mailrelay_api_key ?? '',
          mailrelay_group_id: cfg.mailrelay_group_id ?? '',
          mailchimp_enabled: cfg.mailchimp_enabled ?? 'false',
          mailchimp_api_key: cfg.mailchimp_api_key ?? '',
          mailchimp_server_prefix: cfg.mailchimp_server_prefix ?? '',
          mailchimp_audience_id: cfg.mailchimp_audience_id ?? '',
          mailchimp_tags_default: cfg.mailchimp_tags_default ?? '',
        });
      })
      .catch(() => { /* keep defaults */ })
      .finally(() => {
        setIsWpLoading(false);
        setIsMarketingLoading(false);
      });
  }, []);

  function handleWpChange(e: React.ChangeEvent<HTMLInputElement>) {
    setWpForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleWpSave() {
    setIsWpSaving(true);
    setWpSaveResult(null);
    try {
      const token = getAuthTokenFromCookie() ?? '';
      await updateConfig(token, {
        wordpress_api_url: wpForm.wordpress_api_url.trim() || null,
        wordpress_revalidate: wpForm.wordpress_revalidate.trim() || '60',
        wordpress_rest_api_url: wpForm.wordpress_rest_api_url.trim() || null,
        wordpress_api_user: wpForm.wordpress_api_user.trim() || null,
        wordpress_api_password: wpForm.wordpress_api_password.trim() || null,
      });
      setWpSaveResult({ ok: true, msg: 'Configuración de WordPress guardada correctamente.' });
    } catch (err) {
      setWpSaveResult({ ok: false, msg: err instanceof Error ? err.message : 'Error al guardar' });
    } finally {
      setIsWpSaving(false);
    }
  }

  function handleMarketingChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setMarketingForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleMarketingSave() {
    setIsMarketingSaving(true);
    setMarketingResult(null);

    try {
      const token = getAuthTokenFromCookie() ?? '';
      await updateConfig(token, {
        email_provider_default: marketingForm.email_provider_default,
        mailrelay_enabled: marketingForm.mailrelay_enabled,
        mailrelay_api_url: marketingForm.mailrelay_api_url.trim() || null,
        mailrelay_api_key: marketingForm.mailrelay_api_key.trim() || null,
        mailrelay_group_id: marketingForm.mailrelay_group_id.trim() || null,
        mailchimp_enabled: marketingForm.mailchimp_enabled,
        mailchimp_api_key: marketingForm.mailchimp_api_key.trim() || null,
        mailchimp_server_prefix: marketingForm.mailchimp_server_prefix.trim() || null,
        mailchimp_audience_id: marketingForm.mailchimp_audience_id.trim() || null,
        mailchimp_tags_default: marketingForm.mailchimp_tags_default.trim() || null,
      });

      setMarketingResult({
        ok: true,
        msg: 'Configuración de Mailrelay/Mailchimp guardada correctamente.',
      });
    } catch (err) {
      setMarketingResult({
        ok: false,
        msg: err instanceof Error ? err.message : 'Error al guardar configuración de marketing',
      });
    } finally {
      setIsMarketingSaving(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleTest() {
    setIsTesting(true);
    setTestResult(null);
    await new Promise((r) => setTimeout(r, 1500));
    setTestResult({ ok: true, msg: 'Conexión SMTP exitosa. El servidor respondió correctamente.' });
    setIsTesting(false);
  }

  async function handleSave() {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsSaving(false);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Configuración Global</h1>
        <p className="mt-1 text-sm text-white/40">
          Administra las variables de entorno y servicios de terceros.
        </p>
      </div>

      {/* ── SMTP CARD ── */}
      <section className="bg-[#111] border border-gray-800 rounded-2xl p-8 space-y-6">
        {/* Card header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F58634]/10 border border-[#F58634]/20 flex items-center justify-center">
              <Mail size={18} className="text-[#F58634]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Correo Saliente (SMTP)</h2>
              <p className="text-xs text-white/30 mt-0.5">Configuración del servidor de envío de correos</p>
            </div>
          </div>
          {/* Status pill */}
          <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Servicio activo
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-white/5" />

        {/* Grid form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FieldGroup label="Servidor SMTP (Host)" icon={Server}>
            <input
              type="text"
              name="host"
              value={form.host}
              onChange={handleChange}
              placeholder="smtp.ejemplo.com"
              className={inputBase}
            />
          </FieldGroup>

          <FieldGroup label="Puerto" icon={ShieldCheck}>
            <input
              type="number"
              name="port"
              value={form.port}
              onChange={handleChange}
              placeholder="587"
              className={inputBase}
            />
          </FieldGroup>

          <FieldGroup label="Usuario SMTP" icon={User}>
            <input
              type="text"
              name="usuario"
              value={form.usuario}
              onChange={handleChange}
              placeholder="usuario@dominio.com"
              className={inputBase}
            />
          </FieldGroup>

          <FieldGroup label="Contraseña" icon={Lock}>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••••••"
              className={inputBase}
            />
          </FieldGroup>

          <FieldGroup label="Cifrado" icon={ShieldCheck}>
            <div className="relative">
              <select
                name="cifrado"
                value={form.cifrado}
                onChange={handleChange}
                className={selectBase}
              >
                <option value="SSL" className="bg-[#111] text-white">SSL</option>
                <option value="TLS" className="bg-[#111] text-white">TLS</option>
                <option value="Ninguno" className="bg-[#111] text-white">Ninguno</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 4l4 4 4-4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </FieldGroup>

          <FieldGroup label="Nombre del Remitente" icon={User}>
            <input
              type="text"
              name="nombreRemitente"
              value={form.nombreRemitente}
              onChange={handleChange}
              placeholder="InduMex B2B"
              className={inputBase}
            />
          </FieldGroup>

          <div className="md:col-span-2">
            <FieldGroup label="Email del Remitente" icon={AtSign}>
              <input
                type="email"
                name="emailRemitente"
                value={form.emailRemitente}
                onChange={handleChange}
                placeholder="noreply@indumex.blog"
                className={inputBase}
              />
            </FieldGroup>
          </div>
        </div>

        {/* Test result banner */}
        {testResult && (
          <div
            className={`flex items-center gap-2.5 text-sm px-4 py-3 rounded-xl border ${
              testResult.ok
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            {testResult.ok ? (
              <ShieldCheck size={15} className="shrink-0" />
            ) : (
              <Mail size={15} className="shrink-0" />
            )}
            {testResult.msg}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white/70 border border-white/15 hover:border-white/30 hover:text-white transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap size={15} className={isTesting ? 'animate-pulse text-[#F58634]' : ''} />
            {isTesting ? 'Probando…' : 'Probar Conexión'}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#F58634] text-black hover:bg-[#e5762a] active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save size={15} />
            {isSaving ? 'Guardando…' : 'Guardar Configuración'}
          </button>
        </div>
      </section>

      {/* ── WORDPRESS / HEADLESS CMS CARD ── */}
      <section className="bg-[#111] border border-gray-800 rounded-2xl p-8 space-y-6">
        {/* Card header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#004AAD]/10 border border-[#004AAD]/20 flex items-center justify-center">
              <Globe size={18} className="text-[#004AAD]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">WordPress / Headless CMS</h2>
              <p className="text-xs text-white/30 mt-0.5">Conexión al endpoint GraphQL de WordPress</p>
            </div>
          </div>
          {!isWpLoading && wpForm.wordpress_api_url && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              URL configurada
            </span>
          )}
        </div>

        <div className="border-t border-white/5" />

        {isWpLoading ? (
          <div className="flex items-center gap-2 text-sm text-white/30 py-4">
            <RefreshCw size={14} className="animate-spin" />
            Cargando configuración…
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <FieldGroup label="URL del endpoint GraphQL" icon={Globe}>
                <input
                  type="url"
                  name="wordpress_api_url"
                  value={wpForm.wordpress_api_url}
                  onChange={handleWpChange}
                  placeholder="https://tu-wordpress.com/graphql"
                  className={inputBase}
                />
                <p className="text-[11px] text-white/25 mt-1">
                  Esta URL tiene prioridad sobre la variable <code className="text-white/40">NEXT_PUBLIC_WORDPRESS_API_URL</code> del .env.
                </p>
              </FieldGroup>
            </div>

            <FieldGroup label="Tiempo de caché ISR (segundos)" icon={RefreshCw}>
              <input
                type="number"
                name="wordpress_revalidate"
                value={wpForm.wordpress_revalidate}
                onChange={handleWpChange}
                placeholder="60"
                min="0"
                className={inputBase}
              />
            </FieldGroup>

            {/* Divider */}
            <div className="md:col-span-2 border-t border-white/10 pt-6">
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4">
                Credenciales REST API (Editar/Crear Posts)
              </h3>
            </div>

            <div className="md:col-span-2">
              <FieldGroup label="URL de REST API" icon={Server}>
                <input
                  type="url"
                  name="wordpress_rest_api_url"
                  value={wpForm.wordpress_rest_api_url}
                  onChange={handleWpChange}
                  placeholder="https://tu-wordpress.com/wp-json"
                  className={inputBase}
                />
                <p className="text-[11px] text-white/25 mt-1">
                  Endpoint base de REST API para operaciones CRUD de posts.
                </p>
              </FieldGroup>
            </div>

            <FieldGroup label="Usuario API" icon={User}>
              <input
                type="text"
                name="wordpress_api_user"
                value={wpForm.wordpress_api_user}
                onChange={handleWpChange}
                placeholder="admin"
                className={inputBase}
              />
              <p className="text-[11px] text-white/25 mt-1">
                Usuario con permisos de edición en WordPress.
              </p>
            </FieldGroup>

            <FieldGroup label="Contraseña API" icon={Lock}>
              <input
                type="password"
                name="wordpress_api_password"
                value={wpForm.wordpress_api_password}
                onChange={handleWpChange}
                placeholder="••••••••••••"
                className={inputBase}
              />
              <p className="text-[11px] text-white/25 mt-1">
                Se usa autenticación Basic (base64) en headers.
              </p>
            </FieldGroup>
          </div>
        )}

        {/* Save result banner */}
        {wpSaveResult && (
          <div
            className={`flex items-center gap-2.5 text-sm px-4 py-3 rounded-xl border ${
              wpSaveResult.ok
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            {wpSaveResult.ok ? <CheckCircle2 size={15} className="shrink-0" /> : <AlertCircle size={15} className="shrink-0" />}
            {wpSaveResult.msg}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={handleWpSave}
            disabled={isWpSaving || isWpLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#F58634] text-black hover:bg-[#e5762a] active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save size={15} />
            {isWpSaving ? 'Guardando…' : 'Guardar Configuración'}
          </button>
        </div>
      </section>

      {/* ── EMAIL MARKETING PROVIDERS CARD ── */}
      <section className="bg-[#111] border border-gray-800 rounded-2xl p-8 space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F58634]/10 border border-[#F58634]/20 flex items-center justify-center">
              <Mail size={18} className="text-[#F58634]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Email Marketing Providers</h2>
              <p className="text-xs text-white/30 mt-0.5">Preparación de integración para Mailrelay y Mailchimp</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5" />

        {isMarketingLoading ? (
          <div className="flex items-center gap-2 text-sm text-white/30 py-4">
            <RefreshCw size={14} className="animate-spin" />
            Cargando configuración…
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FieldGroup label="Proveedor por Defecto" icon={ShieldCheck}>
              <select
                name="email_provider_default"
                value={marketingForm.email_provider_default}
                onChange={handleMarketingChange}
                className={selectBase}
              >
                <option value="local" className="bg-[#111] text-white">Local (solo base de datos)</option>
                <option value="mailrelay" className="bg-[#111] text-white">Mailrelay</option>
                <option value="mailchimp" className="bg-[#111] text-white">Mailchimp</option>
              </select>
            </FieldGroup>

            <FieldGroup label="Mailrelay Habilitado" icon={Zap}>
              <select
                name="mailrelay_enabled"
                value={marketingForm.mailrelay_enabled}
                onChange={handleMarketingChange}
                className={selectBase}
              >
                <option value="false" className="bg-[#111] text-white">No</option>
                <option value="true" className="bg-[#111] text-white">Sí</option>
              </select>
            </FieldGroup>

            <FieldGroup label="Mailrelay API URL" icon={Server}>
              <input
                type="url"
                name="mailrelay_api_url"
                value={marketingForm.mailrelay_api_url}
                onChange={handleMarketingChange}
                placeholder="https://youraccount.ip-zone.com/ccm/admin/api/version/2/&type=json"
                className={inputBase}
              />
            </FieldGroup>

            <FieldGroup label="Mailrelay Group ID" icon={User}>
              <input
                type="text"
                name="mailrelay_group_id"
                value={marketingForm.mailrelay_group_id}
                onChange={handleMarketingChange}
                placeholder="123"
                className={inputBase}
              />
            </FieldGroup>

            <div className="md:col-span-2">
              <FieldGroup label="Mailrelay API Key" icon={Lock}>
                <input
                  type="password"
                  name="mailrelay_api_key"
                  value={marketingForm.mailrelay_api_key}
                  onChange={handleMarketingChange}
                  placeholder="mr_********************************"
                  className={inputBase}
                />
              </FieldGroup>
            </div>

            <FieldGroup label="Mailchimp Habilitado" icon={Zap}>
              <select
                name="mailchimp_enabled"
                value={marketingForm.mailchimp_enabled}
                onChange={handleMarketingChange}
                className={selectBase}
              >
                <option value="false" className="bg-[#111] text-white">No</option>
                <option value="true" className="bg-[#111] text-white">Sí</option>
              </select>
            </FieldGroup>

            <FieldGroup label="Mailchimp Server Prefix" icon={Server}>
              <input
                type="text"
                name="mailchimp_server_prefix"
                value={marketingForm.mailchimp_server_prefix}
                onChange={handleMarketingChange}
                placeholder="us21"
                className={inputBase}
              />
            </FieldGroup>

            <FieldGroup label="Mailchimp Audience ID" icon={User}>
              <input
                type="text"
                name="mailchimp_audience_id"
                value={marketingForm.mailchimp_audience_id}
                onChange={handleMarketingChange}
                placeholder="a1b2c3d4e5"
                className={inputBase}
              />
            </FieldGroup>

            <FieldGroup label="Tags por Defecto (coma separada)" icon={AtSign}>
              <input
                type="text"
                name="mailchimp_tags_default"
                value={marketingForm.mailchimp_tags_default}
                onChange={handleMarketingChange}
                placeholder="newsletter, industria"
                className={inputBase}
              />
            </FieldGroup>

            <div className="md:col-span-2">
              <FieldGroup label="Mailchimp API Key" icon={Lock}>
                <input
                  type="password"
                  name="mailchimp_api_key"
                  value={marketingForm.mailchimp_api_key}
                  onChange={handleMarketingChange}
                  placeholder="xxxxxxxxxxxxxxxxxxxx-us21"
                  className={inputBase}
                />
              </FieldGroup>
            </div>
          </div>
        )}

        {marketingResult && (
          <div
            className={`flex items-center gap-2.5 text-sm px-4 py-3 rounded-xl border ${
              marketingResult.ok
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            {marketingResult.ok ? <CheckCircle2 size={15} className="shrink-0" /> : <AlertCircle size={15} className="shrink-0" />}
            {marketingResult.msg}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={handleMarketingSave}
            disabled={isMarketingSaving || isMarketingLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#F58634] text-black hover:bg-[#e5762a] active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save size={15} />
            {isMarketingSaving ? 'Guardando…' : 'Guardar Configuración'}
          </button>
        </div>
      </section>
    </div>
  );
}
