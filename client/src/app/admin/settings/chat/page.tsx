'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Save, AlertCircle, CheckCircle2, Copy, Link as LinkIcon } from 'lucide-react';
import { getAuthTokenFromCookie } from '@/lib/api';

const inputBase =
  'w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-all duration-200 focus:border-[#F58634] focus:ring-1 focus:ring-[#F58634]/30';

const buttonBase =
  'px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2';

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

interface ChatConfig {
  id: number;
  n8nWebhookUrl: string | null;
  isActive: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export default function ChatSettingsPage() {
  const [config, setConfig] = useState<ChatConfig>({
    id: 1,
    n8nWebhookUrl: '',
    isActive: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadChatConfig();
  }, []);

  const loadChatConfig = async () => {
    try {
      setIsLoading(true);
      const token = getAuthTokenFromCookie();

      if (!token) {
        setFeedback({ ok: false, msg: 'No estás autenticado' });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/chat-config`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar configuración');
      }

      const data = await response.json();
      setConfig(data.data || { id: 1, n8nWebhookUrl: '', isActive: false });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      setFeedback({ ok: false, msg });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setFeedback(null);

      const token = getAuthTokenFromCookie();
      if (!token) {
        setFeedback({ ok: false, msg: 'No estás autenticado' });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/chat-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          n8nWebhookUrl: config.n8nWebhookUrl || null,
          isActive: config.isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar');
      }

      const data = await response.json();
      setConfig(data.data);
      setFeedback({ ok: true, msg: 'Configuración guardada exitosamente' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      setFeedback({ ok: false, msg });
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-white/60">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <MessageSquare size={24} className="text-[#F58634]" />
          <h1 className="text-3xl font-bold text-white">Configuración del Chat</h1>
        </div>
        <p className="text-white/60">
          Configura tu widget de chat con n8n y activa o desactiva el servicio
        </p>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
            feedback.ok
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {feedback.ok ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Main Settings */}
      <div className="space-y-6 bg-white/5 border border-white/10 rounded-2xl p-6">
        {/* Status Toggle */}
        <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/10">
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-white mb-1">
              <MessageSquare size={16} className="text-[#F58634]" />
              Estado del Widget
            </label>
            <p className="text-xs text-white/50">
              {config.isActive ? '✓ Activo' : '✗ Inactivo'}
            </p>
          </div>
          <button
            onClick={() => setConfig({ ...config, isActive: !config.isActive })}
            className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
              config.isActive ? 'bg-[#F58634]' : 'bg-white/10'
            }`}
          >
            <div
              className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 ${
                config.isActive ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Webhook URL */}
        <div>
          <FieldGroup label="Webhook de n8n" icon={LinkIcon}>
            <div className="flex gap-2">
              <input
                type="text"
                value={config.n8nWebhookUrl || ''}
                onChange={(e) => setConfig({ ...config, n8nWebhookUrl: e.target.value })}
                placeholder="https://tu-instancia-n8n.com/webhook/chat"
                className={inputBase}
              />
              {config.n8nWebhookUrl && (
                <button
                  onClick={() => copyToClipboard(config.n8nWebhookUrl || '')}
                  className="px-3 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all"
                  title="Copiar"
                >
                  {copied ? <CheckCircle2 size={18} className="text-green-400" /> : <Copy size={18} />}
                </button>
              )}
            </div>
            <p className="text-xs text-white/40 mt-2">
              Ingresa la URL completa del webhook de n8n. El chat enviará los mensajes del usuario a esta URL.
            </p>
          </FieldGroup>
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <p className="text-sm text-blue-200 leading-relaxed">
            <span className="font-semibold">💡 Nota:</span> El webhook recibirá un POST con el siguiente formato:
            <code className="block mt-2 bg-black/30 p-2 rounded text-xs font-mono">
              {`{ "message": "texto del usuario" }`}
            </code>
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`${buttonBase} ${
            isSaving
              ? 'bg-[#F58634]/50 cursor-not-allowed'
              : 'bg-[#F58634] hover:bg-[#F58634]/90 text-black'
          }`}
        >
          <Save size={18} />
          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
        <button
          onClick={loadChatConfig}
          disabled={isSaving}
          className={`${buttonBase} bg-white/10 hover:bg-white/20 text-white border border-white/10`}
        >
          Descartar
        </button>
      </div>
    </div>
  );
}
