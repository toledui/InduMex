'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, CreditCard, Download, LogOut, ShoppingBag, Upload, UserCircle2 } from 'lucide-react';
import MarketplaceManager from '@/components/MarketplaceManager';
import SimpleRichTextEditor from '@/components/SimpleRichTextEditor';
import {
  cancelMyMarketplaceSubscriptionRenewal,
  cancelMyProviderSubscriptionRenewal,
  clearClientSession,
  createMyMarketplaceSubscription,
  createMyProviderSubscription,
  createMyProviderProfile,
  downloadMyPaymentReceipt,
  getClientMe,
  getMarketplacePlans,
  getClientTokenFromCookie,
  getMyMarketplacePerfil,
  getMyMarketplaceSubscription,
  getMyPaymentLinks,
  getMyPayments,
  getMyProviderProfile,
  getMyProviderSubscription,
  getProviderSubscriptionPlans,
  loginClient,
  registerClient,
  updateClientMe,
  updateMyProviderProfile,
  uploadProviderLogo,
  type ClientPaymentLink,
  type ClientVenta,
  type ClientAuthUser,
  type MarketplacePerfil,
  type MarketplacePlanPublic,
  type MarketplaceSuscripcionActual,
  type PublicProvider,
  type ProveedorSuscripcionActual,
  type ProveedorSuscripcionPlanPublic,
} from '@/lib/api';
import { isImageLogo, PROVIDER_SECTORS, sanitizeRichText } from '@/lib/provider-sectors';

type AuthMode = 'login' | 'register';
type AccountSection = 'profile' | 'provider' | 'marketplace' | 'payments';

const ACCOUNT_SECTIONS: AccountSection[] = ['profile', 'provider', 'marketplace', 'payments'];

type ProviderForm = {
  name: string;
  logo: string;
  shortDescription: string;
  about: string;
  selectedSectors: string[];
  useOtherSector: boolean;
  otherSector: string;
  certifications: string;
  city: string;
  state: string;
  country: string;
  website: string;
  phone: string;
  whatsapp: string;
  email: string;
  socialNetworks: Array<{ nombre: string; url: string }>;
  isActive: boolean;
};

type CancelRenewalTarget = 'provider' | 'marketplace' | null;

const emptyProviderForm: ProviderForm = {
  name: '',
  logo: '',
  shortDescription: '',
  about: '',
  selectedSectors: [],
  useOtherSector: false,
  otherSector: '',
  certifications: '',
  city: '',
  state: '',
  country: 'Mexico',
  website: '',
  phone: '',
  whatsapp: '',
  email: '',
  socialNetworks: [],
  isActive: true,
};

function toCsv(values: string[]): string {
  return values.join(', ');
}

function fromCsv(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function stripWebsiteProtocol(value: string): string {
  return value.trim().replace(/^https?:\/\//i, '');
}

function normalizeWebsite(value: string): string {
  const trimmed = stripWebsiteProtocol(value);
  return trimmed ? `https://${trimmed}` : '';
}

function normalizeSocialUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function stripSocialProtocol(value: string): string {
  return value.trim().replace(/^https?:\/\//i, '');
}

function mapProviderToForm(provider: PublicProvider): ProviderForm {
  const selectedSectors = provider.sectors.filter((sector) => PROVIDER_SECTORS.includes(sector as (typeof PROVIDER_SECTORS)[number]));
  const customSectors = provider.sectors.filter((sector) => !PROVIDER_SECTORS.includes(sector as (typeof PROVIDER_SECTORS)[number]));

  return {
    name: provider.name,
    logo: provider.logo,
    shortDescription: provider.shortDescription,
    about: provider.about,
    selectedSectors,
    useOtherSector: customSectors.length > 0,
    otherSector: customSectors[0] ?? '',
    certifications: toCsv(provider.certifications),
    city: provider.city,
    state: provider.state,
    country: provider.country,
    website: stripWebsiteProtocol(provider.website),
    phone: provider.phone,
    whatsapp: provider.whatsapp,
    email: provider.email,
    socialNetworks: provider.socialNetworks?.length
      ? provider.socialNetworks.map((social) => ({
          nombre: social.nombre,
          url: stripSocialProtocol(social.url),
        }))
      : [{ nombre: '', url: '' }],
    isActive: provider.isActive,
  };
}

function normalizeStringList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeBenefits(raw: unknown): string[] {
  return normalizeStringList(raw);
}

function formatMoney(value: number, currency: string): string {
  return Number(value || 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: currency || 'MXN',
  });
}

function formatTierLabel(tier?: string): string {
  if (tier === 'premium') return 'Patrocinado';
  if (tier === 'verified') return 'Verificado';
  return 'Basic';
}

function getTierRank(tier?: string): number {
  if (tier === 'basic') return 0;
  if (tier === 'verified') return 1;
  if (tier === 'premium') return 2;
  return 0;
}

function getTierRankByPlanStatus(status: 'verificado' | 'patrocinado'): number {
  return status === 'patrocinado' ? 2 : 1;
}

function formatFeatureLabel(value: string): string {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function parseAccountSection(value: string | null | undefined): AccountSection {
  return ACCOUNT_SECTIONS.find((section) => section === value) ?? 'provider';
}

export default function MiCuentaClient() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [activeSection, setActiveSection] = useState<AccountSection>('provider');
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<ClientAuthUser | null>(null);
  const [provider, setProvider] = useState<PublicProvider | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<ProveedorSuscripcionActual | null>(null);
  const [providerPlans, setProviderPlans] = useState<ProveedorSuscripcionPlanPublic[]>([]);
  const [upgradeLoading, setUpgradeLoading] = useState<number | null>(null);
  const [showProviderPlanSelector, setShowProviderPlanSelector] = useState(false);
  const [providerCancelLoading, setProviderCancelLoading] = useState(false);
  const [marketplaceSubscription, setMarketplaceSubscription] = useState<MarketplaceSuscripcionActual | null>(null);
  const [marketplacePlans, setMarketplacePlans] = useState<MarketplacePlanPublic[]>([]);
  const [marketplacePerfil, setMarketplacePerfil] = useState<MarketplacePerfil | null>(null);
  const [marketplaceLoading, setMarketplaceLoading] = useState<number | null>(null);
  const [marketplaceCancelLoading, setMarketplaceCancelLoading] = useState(false);
  const [showMarketplacePlanSelector, setShowMarketplacePlanSelector] = useState(false);
  const [cancelRenewalTarget, setCancelRenewalTarget] = useState<CancelRenewalTarget>(null);
  const [payments, setPayments] = useState<ClientVenta[]>([]);
  const [paymentLinks, setPaymentLinks] = useState<ClientPaymentLink[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [downloadingReceiptId, setDownloadingReceiptId] = useState<number | null>(null);

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    nombre: '',
    apellido: '',
    empresa: '',
    email: '',
    telefono: '',
    password: '',
    aceptaTerminos: false,
  });

  const [profileData, setProfileData] = useState({
    nombre: '',
    apellido: '',
    empresa: '',
    telefono: '',
    password: '',
  });
  const [providerForm, setProviderForm] = useState<ProviderForm>(emptyProviderForm);

  const isLoggedIn = Boolean(token);
  const activeProviderPlans = useMemo(
    () => providerPlans.filter((plan) => plan.activo),
    [providerPlans]
  );
  const currentProviderPlanId = currentSubscription?.plan?.id ?? null;
  const hasProviderSubscription = currentProviderPlanId !== null;
  const isMonthlyProviderSubscription = currentSubscription?.plan?.periodicidad === 'mensual';
  const availableProviderUpgradePlans = useMemo(
    () =>
      activeProviderPlans
        .filter((plan) => getTierRankByPlanStatus(plan.status) > getTierRank(provider?.tier))
        .filter((plan) => (hasProviderSubscription ? plan.id !== currentProviderPlanId : true)),
    [activeProviderPlans, provider?.tier, hasProviderSubscription, currentProviderPlanId]
  );
  const shouldHideProviderPlansByDefault = hasProviderSubscription && isMonthlyProviderSubscription;
  const canChangeProviderPlan = shouldHideProviderPlansByDefault && availableProviderUpgradePlans.length > 0;
  const shouldShowProviderPlanSelector = !shouldHideProviderPlansByDefault || showProviderPlanSelector;

  const activeMarketplacePlans = useMemo(
    () => marketplacePlans.filter((plan) => plan.activo),
    [marketplacePlans]
  );
  const currentMarketplacePlanId = marketplaceSubscription?.plan?.id ?? null;
  const hasMarketplaceSubscription = currentMarketplacePlanId !== null;
  const availableMarketplacePlans = useMemo(
    () =>
      activeMarketplacePlans.filter((plan) =>
        hasMarketplaceSubscription ? plan.id !== currentMarketplacePlanId : true
      ),
    [activeMarketplacePlans, currentMarketplacePlanId, hasMarketplaceSubscription]
  );
  const shouldShowMarketplacePlanSelector = !hasMarketplaceSubscription || showMarketplacePlanSelector;
  const canChangeMarketplacePlan = hasMarketplaceSubscription && availableMarketplacePlans.length > 0;

  function updateSectionInUrl(section: AccountSection): void {
    if (typeof window === 'undefined') return;

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('section', section);
    window.history.replaceState(window.history.state, '', nextUrl.toString());
  }

  function handleSectionChange(section: AccountSection): void {
    setActiveSection(section);
    updateSectionInUrl(section);

    if (section === 'payments' && token) {
      void reloadPayments(token);
    }
  }

  useEffect(() => {
    setToken(getClientTokenFromCookie());
    if (typeof window !== 'undefined') {
      setActiveSection(parseAccountSection(new URL(window.location.href).searchParams.get('section')));
    }
    setIsHydrated(true);

    if (typeof window !== 'undefined') {
      const previous = window.history.scrollRestoration;
      window.history.scrollRestoration = 'manual';
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      });

      return () => {
        window.history.scrollRestoration = previous;
      };
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) return;

      try {
        const me = await getClientMe(token);
        setUser(me);
        setProfileData({
          nombre: me.nombre,
          apellido: me.apellido ?? '',
          empresa: me.empresa ?? '',
          telefono: me.telefono ?? '',
          password: '',
        });
      } catch {
        clearClientSession();
        setToken(null);
        setUser(null);
        setProvider(null);
        setCurrentSubscription(null);
        setProviderPlans([]);
        setMarketplaceSubscription(null);
        setMarketplacePlans([]);
        setMarketplacePerfil(null);
        setPayments([]);
        setPaymentLinks([]);
        return;
      }

      // Secondary data should not force logout if one request fails.
      const [providerRes, paymentsRes, paymentLinksRes, subscriptionRes, plansRes, marketplaceSubRes, marketplacePlansRes, marketplacePerfilRes] = await Promise.allSettled([
        getMyProviderProfile(token),
        getMyPayments(token),
        getMyPaymentLinks(token),
        getMyProviderSubscription(token),
        getProviderSubscriptionPlans(),
        getMyMarketplaceSubscription(token),
        getMarketplacePlans(),
        getMyMarketplacePerfil(token),
      ]);

      if (providerRes.status === 'fulfilled') {
        setProvider(providerRes.value);
        if (providerRes.value) {
          setProviderForm(mapProviderToForm(providerRes.value));
        }
      }

      if (paymentsRes.status === 'fulfilled') {
        setPayments(paymentsRes.value);
      }

      if (paymentLinksRes.status === 'fulfilled') {
        setPaymentLinks(paymentLinksRes.value);
      }

      if (subscriptionRes.status === 'fulfilled') {
        setCurrentSubscription(subscriptionRes.value);
      }

      if (plansRes.status === 'fulfilled') {
        setProviderPlans(
          plansRes.value.map((plan) => ({
            ...plan,
            beneficios: normalizeBenefits(plan.beneficios),
          }))
        );
      }

      if (marketplaceSubRes.status === 'fulfilled') {
        setMarketplaceSubscription(marketplaceSubRes.value);
      }

      if (marketplacePlansRes.status === 'fulfilled') {
        setMarketplacePlans(
          marketplacePlansRes.value.map((plan) => ({
            ...plan,
            caracteristicas: normalizeStringList(plan.caracteristicas),
          }))
        );
      }

      if (marketplacePerfilRes.status === 'fulfilled') {
        setMarketplacePerfil(marketplacePerfilRes.value);
      }
    };

    bootstrap();
  }, [token]);

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    updateSectionInUrl(activeSection);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [activeSection, isHydrated]);

  useEffect(() => {
    if (!shouldHideProviderPlansByDefault || !canChangeProviderPlan) {
      setShowProviderPlanSelector(false);
    }
  }, [shouldHideProviderPlansByDefault, canChangeProviderPlan, currentProviderPlanId]);

  useEffect(() => {
    if (!hasMarketplaceSubscription) {
      setShowMarketplacePlanSelector(false);
      return;
    }

    if (!canChangeMarketplacePlan) {
      setShowMarketplacePlanSelector(false);
    }
  }, [canChangeMarketplacePlan, hasMarketplaceSubscription, currentMarketplacePlanId]);

  async function reloadPayments(currentToken: string): Promise<void> {
    setPaymentsLoading(true);
    try {
      const [salesRows, linkRows] = await Promise.all([
        getMyPayments(currentToken),
        getMyPaymentLinks(currentToken),
      ]);
      setPayments(salesRows);
      setPaymentLinks(linkRows);
    } finally {
      setPaymentsLoading(false);
    }
  }

  async function handleDownloadReceipt(ventaId: number): Promise<void> {
    if (!token) return;

    setDownloadingReceiptId(ventaId);
    setError(null);

    try {
      const fileBlob = await downloadMyPaymentReceipt(token, ventaId);
      const fileUrl = URL.createObjectURL(fileBlob);
      const anchor = document.createElement('a');
      anchor.href = fileUrl;
      anchor.download = `indumex-recibo-${ventaId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(fileUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo descargar el recibo.');
    } finally {
      setDownloadingReceiptId(null);
    }
  }

  const providerPayload = useMemo(() => {
    const sectors = [...providerForm.selectedSectors];
    if (providerForm.useOtherSector && providerForm.otherSector.trim()) {
      sectors.push(providerForm.otherSector.trim());
    }

    return {
      name: providerForm.name,
      logo: providerForm.logo,
      shortDescription: providerForm.shortDescription,
      about: sanitizeRichText(providerForm.about),
      sectors,
      certifications: fromCsv(providerForm.certifications),
      city: providerForm.city,
      state: providerForm.state,
      country: providerForm.country,
      website: normalizeWebsite(providerForm.website),
      phone: providerForm.phone,
      whatsapp: providerForm.whatsapp,
      email: providerForm.email.trim(),
      socialNetworks: providerForm.socialNetworks
        .map((item) => ({
          nombre: item.nombre.trim(),
          url: normalizeSocialUrl(item.url),
        }))
        .filter((item) => item.nombre && item.url),
      isActive: providerForm.isActive,
    };
  }, [providerForm]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const result = await loginClient(loginData.email, loginData.password);
      document.cookie = `indumex_client_token=${encodeURIComponent(result.token)}; Max-Age=${60 * 60 * 8}; Path=/; SameSite=Lax`;
      document.cookie = `indumex_client_user=${encodeURIComponent(JSON.stringify(result.usuario))}; Max-Age=${60 * 60 * 8}; Path=/; SameSite=Lax`;
      setToken(result.token);
      setUser(result.usuario as ClientAuthUser);
      setProfileData({
        nombre: result.usuario.nombre,
        apellido: result.usuario.apellido ?? '',
        empresa: result.usuario.empresa ?? '',
        telefono: result.usuario.telefono ?? '',
        password: '',
      });
      handleSectionChange('provider');
      setMessage('Sesion iniciada correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesion.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (!registerData.aceptaTerminos) {
      setError('Debes aceptar los terminos y condiciones para crear tu cuenta.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const result = await registerClient(registerData);
      document.cookie = `indumex_client_token=${encodeURIComponent(result.token)}; Max-Age=${60 * 60 * 8}; Path=/; SameSite=Lax`;
      document.cookie = `indumex_client_user=${encodeURIComponent(JSON.stringify(result.usuario))}; Max-Age=${60 * 60 * 8}; Path=/; SameSite=Lax`;
      setToken(result.token);
      setUser(result.usuario as ClientAuthUser);
      setProfileData({
        nombre: result.usuario.nombre,
        apellido: result.usuario.apellido ?? '',
        empresa: result.usuario.empresa ?? '',
        telefono: result.usuario.telefono ?? '',
        password: '',
      });
      handleSectionChange('provider');
      setMessage('Cuenta creada correctamente. Ya estas dentro de Mi Cuenta.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const payload: {
        nombre?: string;
        apellido?: string;
        empresa?: string;
        telefono?: string;
        password?: string;
      } = {
        nombre: profileData.nombre,
        apellido: profileData.apellido,
        empresa: profileData.empresa,
        telefono: profileData.telefono,
      };

      if (profileData.password.trim()) {
        payload.password = profileData.password;
      }

      const updated = await updateClientMe(token, payload);
      setUser(updated);
      document.cookie = `indumex_client_user=${encodeURIComponent(JSON.stringify(updated))}; Max-Age=${60 * 60 * 8}; Path=/; SameSite=Lax`;
      setProfileData((prev) => ({ ...prev, password: '' }));
      setMessage('Perfil actualizado correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el perfil.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogoUpload(file: File | null) {
    if (!token || !file) return;

    if (file.size > 1024 * 1024) {
      setError('El logo no puede pesar mas de 1 MB.');
      return;
    }

    setLogoUploading(true);
    setError(null);

    try {
      const result = await uploadProviderLogo(token, file);
      setProviderForm((prev) => ({ ...prev, logo: result.url }));
      setMessage('Logo cargado correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir el logo.');
    } finally {
      setLogoUploading(false);
    }
  }

  async function handleProviderSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const updatedProvider = provider
        ? await updateMyProviderProfile(token, providerPayload)
        : await createMyProviderProfile(token, providerPayload);

      setProvider(updatedProvider);
      setProviderForm(mapProviderToForm(updatedProvider));
      setMessage(provider ? 'Perfil de proveedor actualizado.' : 'Perfil de proveedor creado como basic.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el perfil de proveedor.');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgradeProviderTier(planId: number) {
    if (!token) return;

    setUpgradeLoading(planId);
    setError(null);
    setMessage(null);

    try {
      const result = await createMyProviderSubscription(token, planId);
      setCurrentSubscription(result.suscripcion);
      setMessage('Generamos tu suscripción y la línea de pago. Te estamos redirigiendo al checkout.');
      window.location.href = `/pagar/${result.paymentLink.token}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar el proceso de upgrade.');
    } finally {
      setUpgradeLoading(null);
    }
  }

  async function handleCancelProviderRenewal() {
    if (!token || !currentSubscription || currentSubscription.autoRenovacionCancelada) return;

    setProviderCancelLoading(true);
    setError(null);
    setMessage(null);

    try {
      const updated = await cancelMyProviderSubscriptionRenewal(token);
      setCurrentSubscription(updated);
      setMessage('Renovación automática del plan de proveedor cancelada. Tu plan seguirá activo hasta su vencimiento.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cancelar la renovación automática del proveedor.');
    } finally {
      setProviderCancelLoading(false);
    }
  }

  async function handleActivateMarketplace(planId: number) {
    if (!token) return;

    setMarketplaceLoading(planId);
    setError(null);
    setMessage(null);

    try {
      const result = await createMyMarketplaceSubscription(token, planId);
      setMarketplaceSubscription(result.suscripcion);
      setMessage('Generamos tu suscripción de marketplace y te redirigimos al checkout.');
      window.location.href = `/pagar/${result.paymentLink.token}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar marketplace.');
    } finally {
      setMarketplaceLoading(null);
    }
  }

  async function handleCancelMarketplaceRenewal() {
    if (!token || !marketplaceSubscription || marketplaceSubscription.autoRenovacionCancelada) return;

    setMarketplaceCancelLoading(true);
    setError(null);
    setMessage(null);

    try {
      const updated = await cancelMyMarketplaceSubscriptionRenewal(token);
      setMarketplaceSubscription(updated);
      setMessage('Renovación automática del plan de marketplace cancelada. Tu acceso seguirá vigente hasta la fecha de vencimiento.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cancelar la renovación automática de marketplace.');
    } finally {
      setMarketplaceCancelLoading(false);
    }
  }

  function toggleSector(sector: string) {
    setProviderForm((prev) => ({
      ...prev,
      selectedSectors: prev.selectedSectors.includes(sector)
        ? prev.selectedSectors.filter((item) => item !== sector)
        : [...prev.selectedSectors, sector],
    }));
  }

  function addSocialNetwork() {
    setProviderForm((prev) => ({
      ...prev,
      socialNetworks: [...prev.socialNetworks, { nombre: '', url: '' }],
    }));
  }

  function updateSocialNetwork(index: number, field: 'nombre' | 'url', value: string) {
    setProviderForm((prev) => ({
      ...prev,
      socialNetworks: prev.socialNetworks.map((item, currentIndex) =>
        currentIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  }

  function removeSocialNetwork(index: number) {
    setProviderForm((prev) => {
      const next = prev.socialNetworks.filter((_, currentIndex) => currentIndex !== index);
      return {
        ...prev,
        socialNetworks: next.length > 0 ? next : [{ nombre: '', url: '' }],
      };
    });
  }

  function handleLogout() {
    clearClientSession();
    setToken(null);
    setUser(null);
    setProvider(null);
    setMarketplaceSubscription(null);
    setMarketplacePlans([]);
    setMarketplacePerfil(null);
    setPayments([]);
    setPaymentLinks([]);
    setProfileData({ nombre: '', apellido: '', empresa: '', telefono: '', password: '' });
    setProviderForm(emptyProviderForm);
    setMessage('Sesion cerrada.');
    setError(null);
  }

  async function handleConfirmCancelRenewal() {
    if (cancelRenewalTarget === 'provider') {
      await handleCancelProviderRenewal();
      setCancelRenewalTarget(null);
      return;
    }

    if (cancelRenewalTarget === 'marketplace') {
      await handleCancelMarketplaceRenewal();
      setCancelRenewalTarget(null);
    }
  }

  const isCancelModalOpen = cancelRenewalTarget !== null;
  const isCancelModalLoading =
    cancelRenewalTarget === 'provider' ? providerCancelLoading : cancelRenewalTarget === 'marketplace' ? marketplaceCancelLoading : false;
  const cancelModalTitle =
    cancelRenewalTarget === 'provider' ? 'Cancelar renovación de plan proveedor' : 'Cancelar renovación de marketplace';
  const cancelModalDescription =
    cancelRenewalTarget === 'provider'
      ? 'Dejarás de recibir links de pago para renovación. Tu plan de proveedor seguirá activo hasta su fecha de vencimiento actual.'
      : 'Dejarás de recibir links de pago para renovación. Tu acceso a marketplace seguirá activo hasta su fecha de vencimiento actual.';

  if (!isHydrated) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-32 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-white/10 bg-[#021325] p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F58634]">Mi Cuenta</p>
          <h1 className="mt-2 font-['Rubik'] text-3xl font-black text-white sm:text-4xl">
            Tu espacio de cliente InduMex
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-300 sm:text-base">
            Cargando tu cuenta...
          </p>
        </header>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-32 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-white/10 bg-[#021325] p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F58634]">Mi Cuenta</p>
        <h1 className="mt-2 font-['Rubik'] text-3xl font-black text-white sm:text-4xl">
          Tu espacio de cliente InduMex
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-300 sm:text-base">
          Crea tu cuenta, administra tus datos y construye tu perfil de proveedor con mas espacio para editar.
        </p>
      </header>

      {error && <p className="mt-6 rounded-xl border border-red-600/30 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</p>}
      {message && (
        <p className="mt-6 rounded-xl border border-emerald-600/30 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
          {message}
        </p>
      )}

      {!isLoggedIn ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-2xl border border-white/10 bg-[#031c38] p-6">
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest ${
                  authMode === 'login' ? 'bg-[#F58634] text-black' : 'border border-white/20 text-white/70'
                }`}
              >
                Iniciar sesion
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest ${
                  authMode === 'register' ? 'bg-[#F58634] text-black' : 'border border-white/20 text-white/70'
                }`}
              >
                Crear cuenta
              </button>
            </div>

            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="Email"
                  className="w-full rounded-lg border border-white/15 bg-black/20 px-4 py-2.5 text-sm text-white"
                  value={loginData.email}
                  onChange={(e) => setLoginData((prev) => ({ ...prev, email: e.target.value }))}
                />
                <input
                  type="password"
                  required
                  placeholder="Contrasena"
                  className="w-full rounded-lg border border-white/15 bg-black/20 px-4 py-2.5 text-sm text-white"
                  value={loginData.password}
                  onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-[#F58634] px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-black disabled:opacity-50"
                >
                  Entrar
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  required
                  placeholder="Nombre"
                  className="rounded-lg border border-white/15 bg-black/20 px-4 py-2.5 text-sm text-white"
                  value={registerData.nombre}
                  onChange={(e) => setRegisterData((prev) => ({ ...prev, nombre: e.target.value }))}
                />
                <input
                  type="text"
                  required
                  placeholder="Apellido"
                  className="rounded-lg border border-white/15 bg-black/20 px-4 py-2.5 text-sm text-white"
                  value={registerData.apellido}
                  onChange={(e) => setRegisterData((prev) => ({ ...prev, apellido: e.target.value }))}
                />
                <input
                  type="text"
                  required
                  placeholder="Empresa"
                  className="sm:col-span-2 rounded-lg border border-white/15 bg-black/20 px-4 py-2.5 text-sm text-white"
                  value={registerData.empresa}
                  onChange={(e) => setRegisterData((prev) => ({ ...prev, empresa: e.target.value }))}
                />
                <input
                  type="email"
                  required
                  placeholder="Email"
                  className="sm:col-span-2 rounded-lg border border-white/15 bg-black/20 px-4 py-2.5 text-sm text-white"
                  value={registerData.email}
                  onChange={(e) => setRegisterData((prev) => ({ ...prev, email: e.target.value }))}
                />
                <input
                  type="tel"
                  placeholder="Telefono"
                  className="rounded-lg border border-white/15 bg-black/20 px-4 py-2.5 text-sm text-white"
                  value={registerData.telefono}
                  onChange={(e) => setRegisterData((prev) => ({ ...prev, telefono: e.target.value }))}
                />
                <input
                  type="password"
                  required
                  placeholder="Contrasena"
                  className="rounded-lg border border-white/15 bg-black/20 px-4 py-2.5 text-sm text-white"
                  value={registerData.password}
                  onChange={(e) => setRegisterData((prev) => ({ ...prev, password: e.target.value }))}
                />
                <label className="sm:col-span-2 flex items-start gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    required
                    checked={registerData.aceptaTerminos}
                    onChange={(e) => setRegisterData((prev) => ({ ...prev, aceptaTerminos: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 accent-[#F58634]"
                  />
                  <span>
                    Acepto los{' '}
                    <Link href="/terminos-y-condiciones" className="text-[#F58634] hover:underline">
                      terminos y condiciones
                    </Link>
                    .
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="sm:col-span-2 w-full rounded-lg bg-[#F58634] px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-black disabled:opacity-50"
                >
                  Crear cuenta
                </button>
              </form>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#031c38] p-6 text-sm text-slate-300">
            <h2 className="font-['Rubik'] text-xl font-bold text-white">Que incluye Mi Cuenta</h2>
            <ul className="mt-4 space-y-3">
              <li>Registro como cliente con datos completos de contacto y empresa.</li>
              <li>Alta automatica en suscriptores desde el momento del registro.</li>
              <li>Perfil de proveedor con logo, sectores guiados y editor enriquecido.</li>
            </ul>
          </section>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-white/10 bg-[#031c38] p-4 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#F58634]">Cuenta activa</p>
              <h2 className="mt-2 text-lg font-bold text-white">{user?.nombre} {user?.apellido ?? ''}</h2>
              <p className="mt-1 text-sm text-slate-400">{user?.email}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/35">{user?.empresa?.trim() || provider?.name?.trim() || 'Sin empresa'}</p>
            </div>

            <nav className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => handleSectionChange('profile')}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors ${
                  activeSection === 'profile' ? 'bg-[#004AAD] text-white' : 'border border-white/10 text-slate-300 hover:border-white/20'
                }`}
              >
                <UserCircle2 className="h-4 w-4" /> Datos del perfil
              </button>
              <button
                type="button"
                onClick={() => handleSectionChange('provider')}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors ${
                  activeSection === 'provider' ? 'bg-[#F58634] text-black' : 'border border-white/10 text-slate-300 hover:border-white/20'
                }`}
              >
                <Building2 className="h-4 w-4" /> Perfil de empresa
              </button>
              <button
                type="button"
                onClick={() => handleSectionChange('marketplace')}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors ${
                  activeSection === 'marketplace' ? 'bg-[#004AAD] text-white' : 'border border-white/10 text-slate-300 hover:border-white/20'
                }`}
              >
                <ShoppingBag className="h-4 w-4" /> Perfil marketplace
              </button>
              <button
                type="button"
                onClick={() => handleSectionChange('payments')}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors ${
                  activeSection === 'payments' ? 'bg-[#0f5132] text-white' : 'border border-white/10 text-slate-300 hover:border-white/20'
                }`}
              >
                <CreditCard className="h-4 w-4" /> Historial de pagos
              </button>
            </nav>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-300 hover:border-white/25 hover:text-white"
            >
              <LogOut className="h-4 w-4" /> Cerrar sesion
            </button>
          </aside>

          <div className="min-w-0 rounded-2xl border border-white/10 bg-[#031c38] p-6 lg:p-8">
            {activeSection === 'profile' ? (
              <section>
                <h2 className="font-['Rubik'] text-2xl font-bold text-white">Datos del perfil</h2>
                <p className="mt-2 text-sm text-slate-400">Actualiza tu informacion de contacto y acceso.</p>

                <form onSubmit={handleProfileSave} className="mt-6 grid gap-4 md:grid-cols-2">
                  <input
                    type="text"
                    required
                    placeholder="Nombre"
                    className="rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white"
                    value={profileData.nombre}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, nombre: e.target.value }))}
                  />
                  <input
                    type="text"
                    required
                    placeholder="Apellido"
                    className="rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white"
                    value={profileData.apellido}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, apellido: e.target.value }))}
                  />
                  <input
                    type="text"
                    required
                    placeholder="Empresa"
                    className="rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white"
                    value={profileData.empresa}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, empresa: e.target.value }))}
                  />
                  <input
                    type="tel"
                    placeholder="Telefono"
                    className="rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white"
                    value={profileData.telefono}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, telefono: e.target.value }))}
                  />
                  <input
                    type="email"
                    disabled
                    value={user?.email ?? ''}
                    className="md:col-span-2 rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/60"
                  />
                  <input
                    type="password"
                    placeholder="Nueva contrasena (opcional)"
                    className="md:col-span-2 rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white"
                    value={profileData.password}
                    onChange={(e) => setProfileData((prev) => ({ ...prev, password: e.target.value }))}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="md:col-span-2 rounded-lg bg-[#004AAD] px-4 py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50"
                  >
                    Guardar perfil
                  </button>
                </form>
              </section>
            ) : activeSection === 'provider' ? (
              <section>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="font-['Rubik'] text-2xl font-bold text-white">Perfil de empresa</h2>
                    <p className="mt-2 text-sm text-slate-400">Construye tu ficha de proveedor y gestiona tu plan para escalar visibilidad en el directorio.</p>
                  </div>
                  <span className="inline-flex rounded-full border border-[#F58634]/30 bg-[#F58634]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#F58634]">
                    Tier actual: {formatTierLabel(provider?.tier)}
                  </span>
                </div>

                <div className="mt-6 rounded-2xl border border-[#004AAD]/25 bg-[#004AAD]/10 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#80aef0]">Plan activo</p>
                      <h3 className="mt-1 text-lg font-bold text-white">
                        {currentSubscription?.plan?.nombre ?? `Tier ${formatTierLabel(provider?.tier)}`}
                      </h3>
                      <p className="mt-1 text-sm text-white/65">
                        Estado: {currentSubscription?.estado ?? 'sin suscripción'}
                        {currentSubscription?.fechaVencimiento
                          ? ` · Vence: ${new Date(currentSubscription.fechaVencimiento).toLocaleDateString('es-MX')}`
                          : ''}
                      </p>
                    </div>
                    {currentSubscription?.plan && (
                      <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-right">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">{currentSubscription.plan.periodicidad}</p>
                        <p className="text-lg font-black text-white">{formatMoney(currentSubscription.plan.precio, currentSubscription.plan.moneda)}</p>
                      </div>
                    )}
                  </div>

                  {canChangeProviderPlan && (
                    <div className="mt-4 border-t border-white/10 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowProviderPlanSelector((prev) => !prev)}
                        className="inline-flex items-center justify-center rounded-lg border border-[#F58634]/40 bg-[#F58634]/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#F58634] hover:bg-[#F58634]/20"
                      >
                        {showProviderPlanSelector ? 'Ocultar planes' : 'Cambiar plan'}
                      </button>
                    </div>
                  )}

                  {currentSubscription && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                      <p className="text-xs text-white/60">
                        {currentSubscription.autoRenovacionCancelada
                          ? 'Renovación automática cancelada. El plan se mantiene activo hasta su vencimiento.'
                          : 'Puedes cancelar la renovación automática para evitar nuevos links de pago al finalizar el periodo.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setCancelRenewalTarget('provider')}
                        disabled={providerCancelLoading || Boolean(currentSubscription.autoRenovacionCancelada)}
                        className="rounded-lg border border-red-500/35 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-200 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {currentSubscription.autoRenovacionCancelada
                          ? 'Renovación cancelada'
                          : providerCancelLoading
                            ? 'Cancelando...'
                            : 'Cancelar renovación'}
                      </button>
                    </div>
                  )}
                </div>

                {shouldShowProviderPlanSelector && (
                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    {availableProviderUpgradePlans.map((plan) => (
                      <article key={plan.id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F58634]">
                              Upgrade {plan.status === 'patrocinado' ? 'Patrocinado' : 'Verificado'}
                            </p>
                            <h3 className="mt-1 text-lg font-bold text-white">{plan.nombre}</h3>
                            <p className="mt-1 text-sm text-white/60">{plan.descripcion || 'Plan mensual para aumentar visibilidad.'}</p>
                          </div>
                          <p className="text-base font-black text-white">{formatMoney(plan.precio, plan.moneda)}</p>
                        </div>

                        <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/35">Cobro {plan.periodicidad}</p>

                        {plan.beneficios.length > 0 && (
                          <ul className="mt-4 space-y-1 text-sm text-white/75">
                            {plan.beneficios.slice(0, 5).map((beneficio, i) => (
                              <li key={`${plan.id}-${i}`} className="flex items-start gap-2">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#F58634]" />
                                <span>{beneficio}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        <button
                          type="button"
                          onClick={() => void handleUpgradeProviderTier(plan.id)}
                          disabled={loading || upgradeLoading === plan.id}
                          className="mt-5 w-full rounded-lg bg-[#F58634] px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-black disabled:opacity-50"
                        >
                          {upgradeLoading === plan.id ? 'Generando pago...' : 'Aumentar tier y pagar'}
                        </button>
                      </article>
                    ))}
                  </div>
                )}

                <form onSubmit={handleProviderSave} className="mt-6 space-y-6">
                  <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">Logo de la empresa</p>
                      <div className="mt-4 flex h-48 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#021325] p-4">
                        {providerForm.logo && isImageLogo(providerForm.logo) ? (
                          <img src={providerForm.logo} alt="Logo de empresa" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <span className="text-center text-sm text-slate-500">Sube un logo PNG, JPG, WebP o SVG de maximo 1 MB.</span>
                        )}
                      </div>
                      <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white hover:border-[#F58634]/50 hover:text-[#F58634]">
                        <Upload className="h-4 w-4" />
                        {logoUploading ? 'Subiendo...' : 'Subir logo'}
                        <input
                          type="file"
                          accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
                          className="hidden"
                          onChange={(e) => void handleLogoUpload(e.target.files?.[0] ?? null)}
                        />
                      </label>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <input
                        type="text"
                        required
                        placeholder="Nombre comercial"
                        className="md:col-span-2 rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white"
                        value={providerForm.name}
                        onChange={(e) => setProviderForm((prev) => ({ ...prev, name: e.target.value }))}
                      />
                      <input
                        type="text"
                        placeholder="Descripcion corta"
                        className="md:col-span-2 rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white"
                        value={providerForm.shortDescription}
                        onChange={(e) => setProviderForm((prev) => ({ ...prev, shortDescription: e.target.value }))}
                      />
                      <label className="rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white focus-within:border-[#F58634] focus-within:ring-1 focus-within:ring-[#F58634]/30">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/35">Sitio web</span>
                        <span className="flex items-center gap-2">
                          <span className="text-white/45">https://</span>
                          <input
                            type="text"
                            required
                            placeholder="tuempresa.com"
                            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                            value={providerForm.website}
                            onChange={(e) =>
                              setProviderForm((prev) => ({
                                ...prev,
                                website: stripWebsiteProtocol(e.target.value),
                              }))
                            }
                          />
                        </span>
                      </label>
                      <input
                        type="tel"
                        placeholder="Telefono"
                        className="rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white"
                        value={providerForm.phone}
                        onChange={(e) => setProviderForm((prev) => ({ ...prev, phone: e.target.value }))}
                      />
                      <input
                        type="tel"
                        placeholder="WhatsApp"
                        className="rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white"
                        value={providerForm.whatsapp}
                        onChange={(e) => setProviderForm((prev) => ({ ...prev, whatsapp: e.target.value }))}
                      />
                      <input
                        type="email"
                        placeholder="Correo electrónico"
                        className="md:col-span-2 rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white"
                        value={providerForm.email}
                        onChange={(e) => setProviderForm((prev) => ({ ...prev, email: e.target.value }))}
                      />
                      <input
                        type="text"
                        required
                        placeholder="Ciudad"
                        className="rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white"
                        value={providerForm.city}
                        onChange={(e) => setProviderForm((prev) => ({ ...prev, city: e.target.value }))}
                      />
                      <input
                        type="text"
                        required
                        placeholder="Estado"
                        className="rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white"
                        value={providerForm.state}
                        onChange={(e) => setProviderForm((prev) => ({ ...prev, state: e.target.value }))}
                      />
                      <input
                        type="text"
                        placeholder="Pais"
                        className="rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-sm text-white"
                        value={providerForm.country}
                        onChange={(e) => setProviderForm((prev) => ({ ...prev, country: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">Sectores</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {PROVIDER_SECTORS.map((sector) => {
                        const active = providerForm.selectedSectors.includes(sector);
                        return (
                          <button
                            key={sector}
                            type="button"
                            onClick={() => toggleSector(sector)}
                            className={`rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                              active
                                ? 'border-[#F58634]/40 bg-[#F58634]/10 text-[#F58634]'
                                : 'border-white/15 bg-white/5 text-slate-300 hover:border-white/30'
                            }`}
                          >
                            {sector}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setProviderForm((prev) => ({ ...prev, useOtherSector: !prev.useOtherSector, otherSector: prev.useOtherSector ? '' : prev.otherSector }))}
                        className={`rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                          providerForm.useOtherSector
                            ? 'border-[#004AAD]/40 bg-[#004AAD]/10 text-[#80aef0]'
                            : 'border-white/15 bg-white/5 text-slate-300 hover:border-white/30'
                        }`}
                      >
                        Otro
                      </button>
                    </div>
                    {providerForm.useOtherSector && (
                      <input
                        type="text"
                        placeholder="Escribe el sector si no existe en la lista"
                        className="mt-4 w-full rounded-lg border border-white/15 bg-[#021325] px-4 py-3 text-sm text-white"
                        value={providerForm.otherSector}
                        onChange={(e) => setProviderForm((prev) => ({ ...prev, otherSector: e.target.value }))}
                      />
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/35">Acerca de tu empresa</p>
                    <SimpleRichTextEditor
                      value={providerForm.about}
                      onChange={(value) => setProviderForm((prev) => ({ ...prev, about: value }))}
                      placeholder="Explica capacidades, certificaciones, alcance geografico, especialidades y casos de uso."
                    />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-white/35">Certificaciones</p>
                    <input
                      type="text"
                      placeholder="Ejemplo: ISO 9001, AS9100, NOM"
                      className="w-full rounded-lg border border-white/15 bg-[#021325] px-4 py-3 text-sm text-white"
                      value={providerForm.certifications}
                      onChange={(e) => setProviderForm((prev) => ({ ...prev, certifications: e.target.value }))}
                    />
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">Redes sociales</p>
                        <p className="mt-1 text-xs text-white/35">Agrega tantas como necesites.</p>
                      </div>
                      <button
                        type="button"
                        onClick={addSocialNetwork}
                        className="rounded-full border border-[#F58634]/30 bg-[#F58634]/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#F58634]"
                      >
                        Agregar red
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {providerForm.socialNetworks.map((social, index) => (
                        <div key={index} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                          <input
                            type="text"
                            placeholder="Nombre de la red"
                            className="rounded-lg border border-white/15 bg-[#021325] px-4 py-3 text-sm text-white"
                            value={social.nombre}
                            onChange={(e) => updateSocialNetwork(index, 'nombre', e.target.value)}
                          />
                          <label className="rounded-lg border border-white/15 bg-[#021325] px-4 py-3 text-sm text-white focus-within:border-[#F58634] focus-within:ring-1 focus-within:ring-[#F58634]/30">
                            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-white/35">URL</span>
                            <span className="flex items-center gap-2">
                              <span className="text-white/45">https://</span>
                              <input
                                type="text"
                                placeholder="instagram.com/tuempresa"
                                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                                value={stripSocialProtocol(social.url)}
                                onChange={(e) => updateSocialNetwork(index, 'url', e.target.value)}
                              />
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => removeSocialNetwork(index)}
                            className="rounded-lg border border-white/15 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white/60"
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-3 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={providerForm.isActive}
                      onChange={(e) => setProviderForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                    />
                    Perfil activo
                  </label>

                  <button
                    type="submit"
                    disabled={loading || logoUploading}
                    className="w-full rounded-lg bg-[#F58634] px-4 py-3 text-xs font-bold uppercase tracking-widest text-black disabled:opacity-50"
                  >
                    {provider ? 'Actualizar perfil de empresa' : 'Crear perfil de empresa'}
                  </button>
                </form>
              </section>
            ) : activeSection === 'marketplace' ? (
              <section>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="font-['Rubik'] text-2xl font-bold text-white">Perfil marketplace</h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Activa tu acceso al marketplace para administrar categorías y productos desde tu cuenta.
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${
                      marketplacePerfil?.habilitado
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : 'border-white/20 bg-white/5 text-white/60'
                    }`}
                  >
                    {marketplacePerfil?.habilitado ? 'Marketplace habilitado' : 'Marketplace no habilitado'}
                  </span>
                </div>

                <div className="mt-6 rounded-2xl border border-[#004AAD]/25 bg-[#004AAD]/10 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#80aef0]">Plan marketplace actual</p>
                      <h3 className="mt-1 text-lg font-bold text-white">
                        {marketplaceSubscription?.plan?.nombre ?? 'Sin plan activo'}
                      </h3>
                      <p className="mt-1 text-sm text-white/65">
                        Estado: {marketplaceSubscription?.estado ?? 'sin suscripción'}
                        {marketplaceSubscription?.fechaVencimiento
                          ? ` · Vence: ${new Date(marketplaceSubscription.fechaVencimiento).toLocaleDateString('es-MX')}`
                          : ''}
                      </p>
                    </div>
                    {marketplaceSubscription?.plan && (
                      <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-right">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">
                          {marketplaceSubscription.plan.periodicidad}
                        </p>
                        <p className="text-lg font-black text-white">
                          {formatMoney(marketplaceSubscription.plan.precio, marketplaceSubscription.plan.moneda)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Límite de productos</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {marketplacePerfil?.maxProductosOverride ?? marketplaceSubscription?.plan?.maxProductos ?? 0}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Productos destacados</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {marketplaceSubscription?.plan?.maxProductosDestacados ?? 0}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">Vigencia perfil</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {marketplacePerfil?.vigenciaHasta
                          ? new Date(marketplacePerfil.vigenciaHasta).toLocaleDateString('es-MX')
                          : 'Sin fecha'}
                      </p>
                    </div>
                  </div>

                  {canChangeMarketplacePlan && (
                    <div className="mt-5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowMarketplacePlanSelector((prev) => !prev)}
                        className="rounded-lg border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/75 hover:border-white/30 hover:text-white"
                      >
                        {showMarketplacePlanSelector ? 'Ocultar planes' : 'Cambiar plan'}
                      </button>
                    </div>
                  )}

                  {marketplaceSubscription && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                      <p className="text-xs text-white/60">
                        {marketplaceSubscription.autoRenovacionCancelada
                          ? 'Renovación automática cancelada. El acceso de marketplace se mantiene hasta su vencimiento.'
                          : 'Puedes cancelar la renovación automática para evitar nuevos links de pago al finalizar el periodo.'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setCancelRenewalTarget('marketplace')}
                        disabled={marketplaceCancelLoading || Boolean(marketplaceSubscription.autoRenovacionCancelada)}
                        className="rounded-lg border border-red-500/35 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-200 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {marketplaceSubscription.autoRenovacionCancelada
                          ? 'Renovación cancelada'
                          : marketplaceCancelLoading
                            ? 'Cancelando...'
                            : 'Cancelar renovación'}
                      </button>
                    </div>
                  )}
                </div>

                {!marketplacePerfil?.habilitado && (
                  <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
                    Tu perfil marketplace se habilita automáticamente cuando se confirma el pago del plan.
                  </div>
                )}

                {shouldShowMarketplacePlanSelector && (
                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    {availableMarketplacePlans.map((plan) => (
                      <article key={plan.id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F58634]">
                              Marketplace {plan.nivelVisibilidad}
                            </p>
                            <h3 className="mt-1 text-lg font-bold text-white">{plan.nombre}</h3>
                            <p className="mt-1 text-sm text-white/60">
                              {plan.descripcion || 'Plan para vender productos en el marketplace industrial.'}
                            </p>
                          </div>
                          <p className="text-base font-black text-white">{formatMoney(plan.precio, plan.moneda)}</p>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/65">
                          <p>Periodicidad: {plan.periodicidad}</p>
                          <p>Productos: {plan.maxProductos}</p>
                          <p>Destacados: {plan.maxProductosDestacados}</p>
                          <p>Visibilidad: {plan.nivelVisibilidad}</p>
                        </div>

                        {plan.caracteristicas.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {plan.caracteristicas.map((feature) => (
                              <span
                                key={`${plan.id}-${feature}`}
                                className="rounded-full border border-white/15 px-2.5 py-1 text-[11px] text-white/60"
                              >
                                {formatFeatureLabel(feature)}
                              </span>
                            ))}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => void handleActivateMarketplace(plan.id)}
                          disabled={loading || marketplaceLoading === plan.id}
                          className="mt-5 w-full rounded-lg bg-[#F58634] px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-black disabled:opacity-50"
                        >
                          {marketplaceLoading === plan.id
                            ? 'Generando pago...'
                            : hasMarketplaceSubscription
                              ? 'Cambiar a este plan'
                              : 'Activar marketplace y pagar'}
                        </button>
                      </article>
                    ))}
                  </div>
                )}

                {marketplacePerfil?.habilitado && token && (
                  <MarketplaceManager
                    token={token}
                    perfil={marketplacePerfil}
                    suscripcion={marketplaceSubscription}
                  />
                )}
              </section>
            ) : (
              <section>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="font-['Rubik'] text-2xl font-bold text-white">Historial de pagos</h2>
                    <p className="mt-2 text-sm text-slate-400">Aqui puedes consultar tus pagos realizados y descargar tu recibo.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => token && void reloadPayments(token)}
                    className="rounded-lg border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-200 hover:border-white/30"
                  >
                    Actualizar
                  </button>
                </div>

                <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-xs text-amber-200">
                  Nota: El recibo descargable es informativo y no constituye un comprobante fiscal CFDI 4.0.
                </div>

                {paymentsLoading ? (
                  <p className="mt-6 text-sm text-slate-400">Cargando historial...</p>
                ) : (
                  <div className="mt-6 space-y-6">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-white/55">Links de pago vinculados</h3>
                      {paymentLinks.length === 0 ? (
                        <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-slate-400">
                          Aun no tienes links de pago vinculados.
                        </div>
                      ) : (
                        <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
                          <div className="overflow-x-auto">
                            <table className="min-w-190 divide-y divide-white/10 text-sm">
                            <thead className="bg-black/30 text-xs uppercase tracking-widest text-slate-400">
                              <tr>
                                <th className="px-4 py-3 text-left">Link</th>
                                <th className="px-4 py-3 text-left">Descripcion</th>
                                <th className="px-4 py-3 text-left">Monto</th>
                                <th className="px-4 py-3 text-left">Estado</th>
                                <th className="px-4 py-3 text-left">Accion</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 bg-[#0c0c0c] text-slate-200">
                              {paymentLinks.map((link) => {
                                const canPay = link.estado === 'pending';
                                const statusClass =
                                  link.estado === 'paid'
                                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                                    : link.estado === 'pending'
                                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                                      : 'border-white/20 bg-white/5 text-white/60';

                                return (
                                  <tr key={link.id}>
                                    <td className="px-4 py-3 font-mono text-xs text-white/70">#{link.id}</td>
                                    <td className="px-4 py-3 text-slate-300">{link.descripcion ?? 'Pago InduMex'}</td>
                                    <td className="px-4 py-3 font-semibold text-white">
                                      {Number(link.monto).toLocaleString('es-MX', { style: 'currency', currency: link.moneda })}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${statusClass}`}>
                                        {link.estado}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      {canPay ? (
                                        <Link
                                          href={`/pagar/${link.token}`}
                                          className="inline-flex items-center gap-2 rounded-lg border border-[#F58634]/40 bg-[#F58634]/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#F8B379] hover:border-[#F58634]/70"
                                        >
                                          Pagar ahora
                                        </Link>
                                      ) : (
                                        <span className="text-xs text-white/35">Sin accion</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-white/55">Pagos realizados</h3>
                      {payments.length === 0 ? (
                        <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-6 text-sm text-slate-400">
                          Aun no tienes pagos registrados.
                        </div>
                      ) : (
                        <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
                          <div className="overflow-x-auto">
                            <table className="min-w-190 divide-y divide-white/10 text-sm">
                            <thead className="bg-black/30 text-xs uppercase tracking-widest text-slate-400">
                              <tr>
                                <th className="px-4 py-3 text-left">Folio</th>
                                <th className="px-4 py-3 text-left">Fecha</th>
                                <th className="px-4 py-3 text-left">Monto</th>
                                <th className="px-4 py-3 text-left">Estado</th>
                                <th className="px-4 py-3 text-left">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 bg-[#0c0c0c] text-slate-200">
                              {payments.map((venta) => (
                                <tr key={venta.id}>
                                  <td className="px-4 py-3 font-semibold">REC-{venta.id}</td>
                                  <td className="px-4 py-3 text-slate-300">
                                    {new Date(venta.createdAt).toLocaleString('es-MX')}
                                  </td>
                                  <td className="px-4 py-3 font-semibold text-white">
                                    {Number(venta.monto).toLocaleString('es-MX', { style: 'currency', currency: venta.moneda })}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300">
                                      {venta.estado}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <button
                                      type="button"
                                      onClick={() => void handleDownloadReceipt(venta.id)}
                                      disabled={downloadingReceiptId === venta.id}
                                      className="inline-flex items-center gap-2 rounded-lg border border-[#004AAD]/40 bg-[#004AAD]/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-[#9cc3ff] hover:border-[#004AAD]/70 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                      {downloadingReceiptId === venta.id ? 'Descargando...' : 'PDF recibo'}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      )}

      {isCancelModalOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#031c38] p-6 shadow-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F58634]">Confirmación</p>
            <h3 className="mt-2 font-['Rubik'] text-xl font-bold text-white">{cancelModalTitle}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">{cancelModalDescription}</p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setCancelRenewalTarget(null)}
                disabled={isCancelModalLoading}
                className="rounded-lg border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/75 hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmCancelRenewal()}
                disabled={isCancelModalLoading}
                className="rounded-lg bg-[#F58634] px-4 py-2 text-xs font-bold uppercase tracking-widest text-black hover:bg-[#e07b2a] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCancelModalLoading ? 'Procesando...' : 'Sí, cancelar renovación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
