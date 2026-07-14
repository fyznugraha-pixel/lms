import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';
import { signToken } from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password harus diisi'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

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
    if (user.role !== 'SUPER_ADMIN') {
      if (!subdomain) {
        return NextResponse.json(
          { success: false, error: { message: 'Harus diakses melalui subdomain kampus', code: 'NO_SUBDOMAIN' } },
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

    const token = await signToken({
      userId: user.id,
      role: user.role,
      kampusId: user.kampusId,
      nim: user.nim,
    });

    const response = NextResponse.json({ success: true, data: { role: user.role } });
    
    response.cookies.set({
      name: 'session_token',
      value: token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
    });

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
