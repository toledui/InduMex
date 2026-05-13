import { NextRequest, NextResponse } from 'next/server';

const INTERNAL_API_URL = process.env.NEXT_INTERNAL_API_URL || 'http://localhost:4000';

/**
 * Proxy para redirigir todas las peticiones /api/v1/* al servidor Express
 * Esto permite que Next.js en producción comunique con Express sin problemas de CORS
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ route: string[] }> }
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ route: string[] }> }
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ route: string[] }> }
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ route: string[] }> }
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ route: string[] }> }
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams);
}

async function proxyRequest(
  request: NextRequest,
  { route }: { route: string[] }
): Promise<NextResponse> {
  try {
    const pathSegments = route || [];
    const path = `/${pathSegments.join('/')}`;
    const queryString = request.nextUrl.search;
    const targetUrl = `${INTERNAL_API_URL}${path}${queryString}`;

    // Construir headers
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      // No copiar headers que Next.js maneja automáticamente
      if (!['host', 'connection', 'keep-alive'].includes(key.toLowerCase())) {
        headers.append(key, value);
      }
    });

    // Determinar método y body
    const method = request.method;
    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (method !== 'GET' && method !== 'HEAD') {
      try {
        const body = await request.text();
        if (body) {
          fetchOptions.body = body;
        }
      } catch {
        // Si no hay body, continuar sin él
      }
    }

    // Realizar la petición al servidor Express
    const response = await fetch(targetUrl, fetchOptions);

    // Pasar la respuesta de Express al cliente
    const responseData = await response.arrayBuffer();

    return new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    console.error('[Proxy Error]', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: 'Error al conectar con el servidor de API',
      },
      { status: 503 }
    );
  }
}
