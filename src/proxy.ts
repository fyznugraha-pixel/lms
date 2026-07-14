import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

// Rute yang tidak memerlukan otentikasi
const PUBLIC_PATHS = ['/login', '/_next', '/favicon.ico', '/api/auth/login'];

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  
  // Deteksi subdomain (misal: unpad.domain.com -> unpad)
  // Untuk localhost (misal: unpad.localhost:3000 -> unpad)
  let subdomain = '';
  const hostParts = hostname.split('.');
  if (hostParts.length >= 2 && !hostname.startsWith('localhost:')) {
    subdomain = hostParts[0];
  } else if (hostname.startsWith('localhost:') && hostParts.length >= 2) {
      subdomain = hostParts[0];
  }

  // Jika URL mengarah ke resource publik/static
  if (PUBLIC_PATHS.some(path => url.pathname.startsWith(path))) {
    const response = NextResponse.next();
    response.headers.set('x-subdomain', subdomain);
    return response;
  }

  // Auth Guard
  const token = request.cookies.get('session_token')?.value;
  if (!token) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  const payload = await verifyToken(token);
  if (!payload) {
    // Token tidak valid atau expired
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('session_token');
    return response;
  }

  // Role Guard
  const { role, kampusId } = payload;
  const path = url.pathname;

  // SUPER_ADMIN bebas akses dashboard manapun, tapi kita asumsikan dashboard mereka di /admin
  // ADMIN_KAMPUS di /admin, DOSEN di /dosen, MAHASISWA di root atau /absen
  if (path.startsWith('/admin') && role !== 'SUPER_ADMIN' && role !== 'ADMIN_KAMPUS') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (path.startsWith('/dosen') && role !== 'DOSEN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  if (path.startsWith('/absen') || path.startsWith('/jadwal') || path.startsWith('/riwayat')) {
      if (role !== 'MAHASISWA') {
          return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
  }

  // Inject info ke headers agar bisa dibaca dari Server Components/API Route
  const response = NextResponse.next();
  response.headers.set('x-subdomain', subdomain);
  response.headers.set('x-user-id', payload.userId);
  response.headers.set('x-user-role', role);
  if (kampusId) response.headers.set('x-kampus-id', kampusId);

  return response;
}

export const config = {
  matcher: [
    // Jalankan di semua rute kecuali _next/static, image, favicon
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
