import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const refreshTokenCookie = cookieStore.get('refresh_token')?.value;
    const currentSessionId = refreshTokenCookie?.split(':')[0] ?? null;

    const sessions = await prisma.sesiLogin.findMany({
      where: { userId: user.userId as string },
      orderBy: { lastUsedAt: 'desc' }
    });

    const sessionsWithFlag = sessions.map((s) => ({
      ...s,
      isCurrent: s.id === currentSessionId,
    }));

    return NextResponse.json({ success: true, data: sessionsWithFlag });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}