import { NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

export default async function middleware(request) {
  const token = request.cookies.get('token')?.value;

  if (request.nextUrl.pathname.startsWith('/todos')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const userId = await verifyToken(token);
    if (!userId) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register') {
    if (token) {
      const userId = await verifyToken(token);
      if (userId) {
        return NextResponse.redirect(new URL('/todos', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/todos/:path*', '/login', '/register'],
};