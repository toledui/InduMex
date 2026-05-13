'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatWidget() {
  const [isActive, setIsActive] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Verificar si el chat está activo al montar el componente (client-side only)
  useEffect(() => {
    fetch('/api/chat-config')
      .then((r) => r.json())
      .then((data) => setIsActive(data?.isActive === true))
      .catch(() => setIsActive(false));
  }, []);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // No renderizar si el chat no está activo
  if (!isActive) {
    return null;
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Enviar al backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input.trim(),
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error desconocido');
      }

      // Extraer respuesta de n8n
      // La estructura depende de cómo n8n retorne la respuesta
      // Asumiendo que devuelve { response: "..." } o similar
      const assistantContent =
        result.data?.response ||
        result.data?.message ||
        result.data?.text ||
        JSON.stringify(result.data);

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: assistantContent,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      const errorBotMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Lo siento, ocurrió un error: ${errorMessage}. Por favor, intenta de nuevo.`,
      };
      setMessages((prev) => [...prev, errorBotMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Botón Flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg transition-all duration-300 z-40 flex items-center justify-center ${
          isOpen
            ? 'bg-[#004AAD] hover:bg-blue-800'
            : 'bg-[#004AAD] hover:bg-blue-800'
        }`}
        aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat'}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Ventana de Chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl z-50 flex flex-col border border-gray-200">
          {/* Header */}
          <div className="bg-[#004AAD] text-white px-4 py-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <h2 className="font-bold text-lg">Asistente InduMex</h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-blue-700 p-1 rounded transition"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center text-gray-500">
                <p className="text-center text-sm">
                  Hola, soy tu asistente. ¿En qué puedo ayudarte hoy?
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-[#004AAD] text-white rounded-br-none'
                      : 'bg-gray-300 text-black rounded-bl-none'
                  }`}
                >
                  <p className="text-sm break-words">{message.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-300 text-black px-4 py-2 rounded-lg rounded-bl-none">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-3 bg-white rounded-b-lg flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje..."
              disabled={isLoading}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004AAD] text-sm disabled:bg-gray-100 text-black"
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-[#004AAD] text-white p-2 rounded-lg hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Enviar"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
