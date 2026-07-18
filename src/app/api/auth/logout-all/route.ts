import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(sessionToken);
    if (!payload || !payload.userId) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Revoke all sessions for this user
    await prisma.sesiLogin.updateMany({
      where: { 
        userId: payload.userId as string, 
        revokedAt: null 
      },
      data: { revokedAt: new Date() }
    });

    const response = NextResponse.json({ success: true, message: 'Berhasil keluar dari semua perangkat' });
    
    // Hapus cookies di current device juga
    response.cookies.delete('session_token');
    response.cookies.delete('refresh_token');

    return response;

  } catch (error) {
    console.error('Logout all error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
