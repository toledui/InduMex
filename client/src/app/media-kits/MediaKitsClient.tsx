'use client';

import { useEffect, useState } from 'react';
import { ChevronRight, Check } from 'lucide-react';
import { getClientTokenFromCookie, createMediaKitPayment, getPublicMediaKitPlanes, getClientMe, ClientAuthUser } from '@/lib/api';

interface MediaKitPlan {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  precioDescuento?: number;
  porcentajeDescuento?: number;
  moneda: string;
  features: string[];
  items: Array<{ name: string; price: number; quantity: number }>;
  activo: boolean;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeItems(raw: unknown): Array<{ name: string; price: number; quantity: number }> {
  if (Array.isArray(raw)) {
    return raw
      .filter((item) => item && typeof item === 'object')
      .map((item) => {
        const row = item as { name?: unknown; price?: unknown; quantity?: unknown };
        return {
          name: typeof row.name === 'string' ? row.name : '',
          price: Number(row.price ?? 0),
          quantity: Number(row.quantity ?? 1) || 1,
        };
      });
  }

  if (typeof raw === 'string') {
    try {
      return normalizeItems(JSON.parse(raw));
    } catch {
      return [];
    }
  }

  return [];
}

function normalizeFeatures(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((entry): entry is string => typeof entry === 'string');
  }

  if (typeof raw === 'string') {
    try {
      return normalizeFeatures(JSON.parse(raw));
    } catch {
      return [];
    }
  }

  return [];
}

function normalizePlan(plan: MediaKitPlan): MediaKitPlan {
  return {
    ...plan,
    items: normalizeItems((plan as { items?: unknown }).items),
    features: normalizeFeatures((plan as { features?: unknown }).features),
  };
}

export default function MediaKitsClient() {
  const [planes, setPlanes] = useState<MediaKitPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [user, setUser] = useState<ClientAuthUser | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const token = getClientTokenFromCookie();
    setAuthToken(token ?? null);

    if (token) {
      loadUserData(token);
    }

    fetchPlanes();
  }, []);

  async function loadUserData(token: string) {
    try {
      // First try localStorage for a fast render
      const cached = localStorage.getItem('user');
      if (cached) {
        setUser(JSON.parse(cached));
      }
      // Always validate with the API to ensure session is current
      const fresh = await getClientMe(token);
      setUser(fresh);
      localStorage.setItem('user', JSON.stringify(fresh));
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  }

  async function fetchPlanes() {
    try {
      const data = await getPublicMediaKitPlanes();
      setPlanes(data.map(normalizePlan).filter((p: MediaKitPlan) => p.activo));
    } catch (err) {
      console.error('Error fetching media kits:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleComprarClick(planId: number) {
    if (!authToken) {
      setSelectedPlan(planId);
      setShowAuthModal(true);
    } else {
      await initiatePayment(planId);
    }
  }

  async function initiatePayment(planId: number, fallbackUser?: ClientAuthUser) {
    const token = authToken ?? getClientTokenFromCookie();
    if (!token) return;

    const resolvedUser = fallbackUser ?? user;
    if (!resolvedUser) {
      // User profile still loading — fetch it now and retry
      try {
        const fresh = await getClientMe(token);
        setUser(fresh);
        return initiatePayment(planId, fresh);
      } catch {
        alert('No se pudo verificar tu sesión. Por favor recarga la página.');
        return;
      }
    }
    
    setIsProcessing(true);
    try {
      const result = await createMediaKitPayment(token, planId, {
        email: resolvedUser.email,
        nombre: resolvedUser.nombre ?? undefined,
        apellido: resolvedUser.apellido ?? undefined,
      });

      if (result.checkoutLink) {
        window.location.href = result.checkoutLink;
      } else {
        window.location.href = `/pagar/${result.paymentLink.token}`;
      }
    } catch (err) {
      console.error('Error creating payment:', err);
      alert('Error al procesar el pago. Por favor intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  }

  function handleAuthSuccess(newUser: ClientAuthUser) {
    setShowAuthModal(false);
    const newToken = getClientTokenFromCookie();
    setAuthToken(newToken ?? null);
    setUser(newUser);

    if (selectedPlan) {
      void initiatePayment(selectedPlan, newUser);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004AAD] mx-auto mb-4" />
          <p className="text-gray-600">Cargando Media Kits...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-white via-[#f8f9fa] to-white pt-28 md:pt-32 pb-12 px-4">
        <div className="max-w-6xl mx-auto mb-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-[#004AAD] mb-4 tracking-tight">
              Media Kits Publicitarios
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Aumenta tu visibilidad en la industria manufacturera. Elige el plan que mejor se adapte a tus necesidades de publicidad.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {planes.map((plan, index) => {
              const isPremium = index === 2;
              const isPopular = index === 1;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border transition-all duration-300 overflow-hidden group ${
                    isPremium
                      ? 'border-[#F58634] bg-gradient-to-br from-[#F58634]/5 to-transparent shadow-lg scale-105 md:scale-100'
                      : 'border-gray-200 bg-white hover:border-[#004AAD] hover:shadow-lg'
                  } ${isPopular ? 'ring-2 ring-[#004AAD]' : ''}`}
                >
                  {isPremium && (
                    <div className="absolute top-4 right-4 bg-[#F58634] text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                      Popular
                    </div>
                  )}
                  {plan.porcentajeDescuento && (
                    <div className={`absolute top-4 ${isPremium ? 'left-4' : 'right-4'} text-white px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      isPremium ? 'bg-[#004AAD]' : 'bg-[#F58634]'
                    }`}>
                      -{plan.porcentajeDescuento}% DESCUENTO
                    </div>
                  )}

                  <div className="p-8 flex flex-col h-full">
                    <div className="mb-6">
                      <h3 className="text-2xl font-black text-[#004AAD] mb-2">
                        {plan.nombre}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {plan.descripcion}
                      </p>
                    </div>

                    <div className="mb-8 pb-8 border-b border-gray-200">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-4xl font-black text-[#004AAD]">
                          ${plan.precioDescuento ? formatPrice(Number(plan.precioDescuento)) : formatPrice(plan.precio)}
                        </span>
                        <span className="text-sm text-gray-500">{plan.moneda}</span>
                      </div>
                      {plan.precioDescuento && (
                        <p className="text-xs text-gray-500">
                          <span className="line-through">
                            ${formatPrice(plan.precio)}
                          </span>
                          {' '}
                          <span className="text-[#F58634] font-bold">
                            Ahorras ${formatPrice(plan.precio - Number(plan.precioDescuento))}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-3 mb-8 flex-grow">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <Check
                            size={18}
                            className={`shrink-0 mt-0.5 ${
                              isPremium ? 'text-[#F58634]' : 'text-[#004AAD]'
                            }`}
                          />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleComprarClick(plan.id)}
                      disabled={isProcessing}
                      className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 group/btn ${
                        isPremium || isPopular
                          ? 'bg-[#F58634] text-black hover:bg-[#e5762a] active:scale-95 disabled:opacity-50'
                          : 'border-2 border-[#004AAD] text-[#004AAD] hover:bg-[#004AAD] hover:text-white active:scale-95 disabled:opacity-50'
                      }`}
                    >
                      {isProcessing ? 'Procesando...' : 'Comprar Ahora'}
                      {!isProcessing && <ChevronRight size={16} className="transition-transform group-hover/btn:translate-x-1" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="max-w-4xl mx-auto bg-[#004AAD] rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-black mb-4">No estás seguro cuál elegir?</h2>
          <p className="text-lg mb-8 opacity-90">
            Nuestro equipo está aquí para ayudarte a encontrar el plan perfecto para tu negocio.
          </p>
          <a
            href="/contacto"
            className="inline-block px-8 py-3 bg-[#F58634] text-black font-bold rounded-xl hover:bg-[#e5762a] transition-colors"
          >
            Contactar Ventas
          </a>
        </div>
      </div>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} />
      )}
    </>
  );
}

function AuthModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (user: ClientAuthUser) => void }) {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot' | 'registered'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    nombre: '',
    apellido: '',
    empresa: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  function saveSession(token: string, usuario: ClientAuthUser) {
    document.cookie = `indumex_client_token=${encodeURIComponent(token)}; Max-Age=${60 * 60 * 8}; Path=/; SameSite=Lax`;
    document.cookie = `indumex_client_user=${encodeURIComponent(JSON.stringify(usuario))}; Max-Age=${60 * 60 * 8}; Path=/; SameSite=Lax`;
    localStorage.setItem('user', JSON.stringify(usuario));
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/auth/client/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password,
        }),
      });

      const data = await res.json();
      if (data.success) {
        saveSession(data.data.token, data.data.usuario);
        onSuccess(data.data.usuario);
      } else {
        setError(data.error || 'Credenciales invalidas. Verifica tu email y contraseña.');
      }
    } catch {
      setError('Error de conexion. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/v1/auth/client/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: registerForm.nombre,
          apellido: registerForm.apellido,
          empresa: registerForm.empresa,
          email: registerForm.email,
          password: registerForm.password,
          aceptaTerminos: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        saveSession(data.data.token, data.data.usuario);
        setRegisteredEmail(registerForm.email);
        setTab('registered');
      } else {
        setError(data.error || 'Error al crear la cuenta.');
      }
    } catch {
      setError('Error de conexion. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await res.json();
      if (data.success) {
        setForgotSent(true);
      } else {
        setError(data.error || 'No se pudo procesar la solicitud.');
      }
    } catch {
      setError('Error de conexion. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  const tabTitles: Record<string, string> = {
    login: 'Iniciar Sesion',
    register: 'Crear Cuenta',
    forgot: 'Recuperar Contraseña',
    registered: '¡Cuenta Creada!',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#004AAD]">
            {tabTitles[tab]}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none"
          >
            ✕
          </button>
        </div>

        {tab !== 'forgot' && tab !== 'registered' && (
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => { setTab('login'); setError(''); }}
              className={`flex-1 py-3 font-semibold transition-colors ${
                tab === 'login'
                  ? 'text-[#004AAD] border-b-2 border-[#004AAD]'
                  : 'text-gray-500'
              }`}
            >
              Iniciar Sesion
            </button>
            <button
              onClick={() => { setTab('register'); setError(''); }}
              className={`flex-1 py-3 font-semibold transition-colors ${
                tab === 'register'
                  ? 'text-[#004AAD] border-b-2 border-[#004AAD]'
                  : 'text-gray-500'
              }`}
            >
              Crear Cuenta
            </button>
          </div>
        )}

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* ── TAB: Cuenta creada ── */}
          {tab === 'registered' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">✓</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">¡Tu cuenta ha sido creada!</h3>
              <p className="text-sm text-gray-600">
                Hemos registrado tu cuenta con el correo{' '}
                <span className="font-semibold text-[#004AAD]">{registeredEmail}</span>.
              </p>
              <div className="bg-[#004AAD]/5 border border-[#004AAD]/20 rounded-lg p-4 text-sm text-[#004AAD]">
                <p className="font-semibold mb-1">Siguiente paso:</p>
                <p>Inicia sesion con tu cuenta para continuar con la compra de tu Media Kit.</p>
              </div>
              <button
                onClick={() => { setTab('login'); setError(''); setLoginForm({ email: registeredEmail, password: '' }); }}
                className="w-full py-2.5 bg-[#F58634] text-black font-bold rounded-lg hover:bg-[#e5762a] transition-colors"
              >
                Iniciar Sesion para Continuar
              </button>
            </div>
          )}

          {/* ── TAB: Login ── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
                  placeholder="tu@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#F58634] text-black font-bold rounded-lg hover:bg-[#e5762a] transition-colors disabled:opacity-50"
              >
                {loading ? 'Cargando...' : 'Iniciar Sesion'}
              </button>
              <p className="text-center text-sm text-gray-500">
                <button
                  type="button"
                  onClick={() => { setTab('forgot'); setError(''); setForgotSent(false); }}
                  className="text-[#004AAD] hover:underline font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </p>
            </form>
          )}

          {/* ── TAB: Register ── */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={registerForm.nombre}
                    onChange={(e) => setRegisterForm({ ...registerForm, nombre: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
                    placeholder="Juan"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Apellido</label>
                  <input
                    type="text"
                    value={registerForm.apellido}
                    onChange={(e) => setRegisterForm({ ...registerForm, apellido: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
                    placeholder="Perez"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Empresa</label>
                <input
                  type="text"
                  value={registerForm.empresa}
                  onChange={(e) => setRegisterForm({ ...registerForm, empresa: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
                  placeholder="Mi Empresa SA"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
                  placeholder="tu@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Confirmar Contraseña</label>
                <input
                  type="password"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#F58634] text-black font-bold rounded-lg hover:bg-[#e5762a] transition-colors disabled:opacity-50"
              >
                {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </button>
            </form>
          )}

          {/* ── TAB: Forgot password ── */}
          {tab === 'forgot' && (
            <div className="space-y-4">
              {forgotSent ? (
                <div className="text-center space-y-3">
                  <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">✉️</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Si el correo <span className="font-semibold">{forgotEmail}</span> existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.
                  </p>
                  <button
                    onClick={() => { setTab('login'); setError(''); }}
                    className="w-full py-2.5 bg-[#004AAD] text-white font-bold rounded-lg hover:bg-[#003a8c] transition-colors"
                  >
                    Volver a Iniciar Sesion
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
                  </p>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004AAD] focus:border-transparent outline-none text-gray-900 placeholder-gray-400"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-[#004AAD] text-white font-bold rounded-lg hover:bg-[#003a8c] transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Enviando...' : 'Enviar Enlace'}
                  </button>
                  <p className="text-center text-sm">
                    <button
                      type="button"
                      onClick={() => { setTab('login'); setError(''); }}
                      className="text-gray-500 hover:text-[#004AAD] hover:underline"
                    >
                      ← Volver a Iniciar Sesion
                    </button>
                  </p>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
