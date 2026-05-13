import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${API_BASE_URL}/chat-config`, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Error al obtener configuración');
    }

    const data = await response.json();

    return NextResponse.json(data.data || { isActive: false, n8nWebhookUrl: null }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
  } catch (error) {
    console.error('[CHAT CONFIG API]', error);
    return NextResponse.json(
      { isActive: false, n8nWebhookUrl: null },
      { status: 500 }
    );
  }
}
