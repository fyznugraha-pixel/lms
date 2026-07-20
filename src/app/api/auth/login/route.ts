import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password harus diisi'),
  rememberMe: z.boolean().optional().default(false),
  deviceId: z.string().min(1, 'Device ID wajib diisi'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, rememberMe, deviceId } = loginSchema.parse(body);

    const subdomain = request.headers.get('x-subdomain');

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Kredensial tidak valid', code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: { message: 'Kredensial tidak valid', code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    const isTactLinkRole = ['KARYAWAN', 'ADMIN_KANTOR'].includes(user.role);

    if (user.role !== 'SUPER_ADMIN') {
      if (isTactLinkRole) {
        if (subdomain !== 'absensi') {
          return NextResponse.json(
            { success: false, error: { message: 'Akun ini khusus untuk Absensi Kantor. Silakan akses via absensi.byfayiz.web.id (atau absensi.localhost:3000)', code: 'WRONG_TENANT' } },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { success: false, error: { message: 'Role tidak didukung di portal ini', code: 'UNAUTHORIZED' } },
          { status: 403 }
        );
      }
    }

    const isUsingRememberMe = rememberMe;
    const maxAgeAccess = isUsingRememberMe ? 30 * 24 * 60 * 60 : 60 * 60 * 24;

    const token = await signToken({ userId: user.id, role: user.role }, isUsingRememberMe ? "30d" : "1d");

    const response = NextResponse.json({ success: true, data: { role: user.role } });

    response.cookies.set({
      name: 'session_token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: maxAgeAccess,
      expires: new Date(Date.now() + maxAgeAccess * 1000),
    });

    if (isUsingRememberMe) {
      const refreshToken = crypto.randomBytes(32).toString('hex');
      const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const deviceInfo = request.headers.get('user-agent') || 'Unknown';
      const ipAddress = request.headers.get('x-forwarded-for') || 'Unknown';

      const existingSession = await prisma.sesiLogin.findUnique({
        where: { userId_deviceId: { userId: user.id, deviceId } },
      });

      let sesiLogin;
      if (existingSession) {
        sesiLogin = await prisma.sesiLogin.update({
          where: { id: existingSession.id },
          data: {
            refreshTokenHash,
            expiresAt,
            deviceInfo,
            ipAddress,
            lastUsedAt: new Date(),
            revokedAt: null,
          },
        });
      } else {
        sesiLogin = await prisma.sesiLogin.create({
          data: {
            userId: user.id,
            deviceId,
            refreshTokenHash,
            expiresAt,
            deviceInfo,
            ipAddress,
          },
        });
      }

      const cookieValue = `${sesiLogin.id}:${refreshToken}`;

      response.cookies.set({
        name: 'refresh_token',
        value: cookieValue,
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60,
      });
    }

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.issues[0].message, code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: { message: `Terjadi kesalahan internal: ${error instanceof Error ? error.message : String(error)}`, code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}