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
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = loginSchema.parse(body);

    const subdomain = request.headers.get('x-subdomain');

    const user = await prisma.user.findUnique({
      where: { email },
      include: { kampus: true }
    });

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

    // Tenant check
    const isTactLinkRole = ['KARYAWAN', 'ADMIN_KANTOR'].includes(user.role);
    
    if (user.role !== 'SUPER_ADMIN') {
      if (isTactLinkRole) {
        // Karyawan HANYA boleh login dari subdomain "absensi"
        if (subdomain !== 'absensi') {
          return NextResponse.json(
            { success: false, error: { message: 'Akun ini khusus untuk Absensi Kantor. Silakan akses via absensi.byfayiz.web.id (atau absensi.localhost:3000)', code: 'WRONG_TENANT' } },
            { status: 403 }
          );
        }
      } else {
        // Mahasiswa/Dosen/Admin Kampus HANYA boleh login dari subdomain kampusnya
        if (!subdomain || subdomain === 'absensi') {
          return NextResponse.json(
            { success: false, error: { message: 'Harus diakses melalui subdomain kampus Anda', code: 'NO_SUBDOMAIN' } },
            { status: 400 }
          );
        }
        
        // Pastikan kampus ada dan subdomain cocok
        if (!user.kampus || user.kampus.subdomain !== subdomain) {
           return NextResponse.json(
            { success: false, error: { message: 'Akun tidak terdaftar di kampus ini', code: 'WRONG_TENANT' } },
            { status: 403 }
          );
        }
      }
    }

    // Default session is 1 day, or 30 days if they use rememberMe
    const isUsingRememberMe = rememberMe;
    const maxAgeAccess = isUsingRememberMe ? 30 * 24 * 60 * 60 : 60 * 60 * 24;

    const token = await signToken({
      userId: user.id,
      role: user.role,
      kampusId: user.kampusId,
      nim: user.nim,
    }, isUsingRememberMe ? "30d" : "1d");

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

    // Generate refresh token jika remember me
    if (isUsingRememberMe) {
      const refreshToken = crypto.randomBytes(32).toString('hex');
      const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const sesiLogin = await prisma.sesiLogin.create({
        data: {
          userId: user.id,
          refreshTokenHash,
          expiresAt,
          deviceInfo: request.headers.get('user-agent') || 'Unknown',
          ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
        }
      });

      // Simpan format: id:token
      const cookieValue = `${sesiLogin.id}:${refreshToken}`;

      response.cookies.set({
        name: 'refresh_token',
        value: cookieValue,
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30 days
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
