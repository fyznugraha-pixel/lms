import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const refreshTokenCookie = cookieStore.get('refresh_token')?.value;

    if (!refreshTokenCookie) {
      return NextResponse.json({ success: false, error: 'No refresh token provided' }, { status: 401 });
    }

    const parts = refreshTokenCookie.split(':');
    if (parts.length !== 2) {
      return NextResponse.json({ success: false, error: 'Invalid refresh token format' }, { status: 401 });
    }

    const [sessionId, tokenString] = parts;

    // Cari sesi
    const session = await prisma.sesiLogin.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: 'Token expired or invalid' }, { status: 401 });
    }

    // Reuse detection
    if (session.revokedAt) {
      console.warn(`[REUSE DETECTION] Revoked refresh token used for user ${session.userId}. Revoking ALL sessions.`);
      await prisma.sesiLogin.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: new Date() }
      });
      return NextResponse.json({ success: false, error: 'Token compromised, all sessions revoked' }, { status: 401 });
    }

    // Verify hash
    const isValid = await bcrypt.compare(tokenString, session.refreshTokenHash);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Token is valid. Rotate it.
    const newRefreshToken = crypto.randomBytes(32).toString('hex');
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Revoke old session
    await prisma.sesiLogin.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() }
    });

    // Create new session
    const newSession = await prisma.sesiLogin.create({
      data: {
        userId: session.userId,
        refreshTokenHash: newRefreshTokenHash,
        expiresAt,
        deviceInfo: request.headers.get('user-agent') || session.deviceInfo,
        ipAddress: request.headers.get('x-forwarded-for') || session.ipAddress,
      }
    });

    // Generate new JWT
    const newJwt = await signToken({
      userId: session.user.id,
      role: session.user.role
    });

    const response = NextResponse.json({ success: true });

    // Set new cookies
    const cookieValue = `${newSession.id}:${newRefreshToken}`;
    
    // RememberMe is true for this flow, so access token is short-lived (15 mins)
    response.cookies.set({
      name: 'session_token',
      value: newJwt,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60, 
    });

    response.cookies.set({
      name: 'refresh_token',
      value: cookieValue,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;

  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
