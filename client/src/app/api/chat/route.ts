import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar que el body contenga messages
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: 'El campo "messages" es requerido y debe ser un arreglo',
        },
        { status: 400 }
      );
    }

    // Hacer fetch a OpenClaw
    const response = await fetch('http://127.0.0.1:18789/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek',
        messages: body.messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenClaw API respondió con status ${response.status}`);
    }

    const data = await response.json();

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
