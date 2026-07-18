import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;

  if (refreshToken) {
    const parts = refreshToken.split(':');
    if (parts.length === 2) {
      const [sessionId] = parts;
      
      try {
        await prisma.sesiLogin.update({
          where: { id: sessionId },
          data: { revokedAt: new Date() }
        });
      } catch (error) {
        console.error('Error revoking session:', error);
      }
    }
  }

  const response = NextResponse.json({ success: true, data: null });
  response.cookies.delete('session_token');
  response.cookies.delete('refresh_token');
  return response;
}
