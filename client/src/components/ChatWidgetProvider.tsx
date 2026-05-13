import ChatWidget from './ChatWidget';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

async function getChatStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/chat-config`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });

    if (!response.ok) {
      return { isActive: false };
    }

    const data = await response.json();
    return data.data || { isActive: false };
  } catch (error) {
    console.error('[CHAT STATUS]', error);
    return { isActive: false };
  }
}

export default async function ChatWidgetProvider() {
  const chatConfig = await getChatStatus();

  // Solo renderizar el componente cliente si el chat está activo
  return <ChatWidget isActive={chatConfig.isActive} />;
}
