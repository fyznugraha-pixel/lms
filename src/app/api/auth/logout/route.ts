import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
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

  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const redirectUrl = `${protocol}://${host}/login`;
  
  const response = NextResponse.redirect(redirectUrl);
  response.cookies.delete('session_token');
  response.cookies.delete('refresh_token');
  return response;
}
