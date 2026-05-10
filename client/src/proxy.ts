import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const authRoutes = ['/admin/login', '/admin/recuperar', '/admin/restablecer'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('indumex_admin_token')?.value;
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (!token && pathname.startsWith('/admin') && !isAuthRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    return NextResponse.redirect(loginUrl);
  }

  if (token && isAuthRoute) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = '/admin';
    return NextResponse.redirect(adminUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
