import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar que el body contenga el mensaje
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'El campo "message" es requerido y debe ser un string',
        },
        { status: 400 }
      );
    }

    // Obtener la configuración del chat desde el backend
    const configResponse = await fetch(`${API_BASE_URL}/chat-config`, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!configResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'Error al obtener configuración del chat',
        },
        { status: 500 }
      );
    }

    const configData = await configResponse.json();

    // Verificar si el chat está activo
    if (!configData.data?.isActive) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'El chat no está disponible en este momento',
        },
        { status: 403 }
      );
    }

    // Verificar que tengamos la URL del webhook
    if (!configData.data?.n8nWebhookUrl) {
      console.error('[CHAT API] No n8n webhook URL configured');
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'El chat no está correctamente configurado',
        },
        { status: 500 }
      );
    }

    // Enviar el mensaje al webhook de n8n
    const n8nResponse = await fetch(configData.data.n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: body.message,
        sessionId: body.sessionId || null,
      }),
    });

    if (!n8nResponse.ok) {
      const error = await n8nResponse.text();
      console.error('[CHAT API] n8n webhook error:', error);
      throw new Error(`n8n API respondió con status ${n8nResponse.status}`);
    }

    const data = await n8nResponse.json();

    return NextResponse.json(
      {
        success: true,
        data,
        error: null,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[CHAT API] Error:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        data: null,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
