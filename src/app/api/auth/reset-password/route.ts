import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { jwtVerify } from 'jose';

const resetSchema = z.object({
  token: z.string().min(1, 'Token tidak valid'),
  newPassword: z.string().min(6, 'Password baru minimal 6 karakter'),
});

const JWT_SECRET = process.env.JWT_SECRET || 'tactlink-secret-key-2024-development';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, newPassword } = resetSchema.parse(body);

    // Kita harus ekstrak payload tanpa verifikasi dulu (hanya untuk dapat userId)
    // untuk mendapatkan passwordHash user dari DB sebagai bagian dari secret.
    // Karena jose tidak punya method decode tanpa verify yang simpel (selain base64 url decode payload),
    // kita bisa decode secara manual dari token JWT (Header.Payload.Signature).
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      return NextResponse.json(
        { success: false, error: { message: 'Token tidak valid', code: 'INVALID_TOKEN' } },
        { status: 400 }
      );
    }

    let payloadString: string;
    try {
      payloadString = Buffer.from(parts[1], 'base64url').toString('utf-8');
    } catch (e) {
      return NextResponse.json(
        { success: false, error: { message: 'Token tidak valid', code: 'INVALID_TOKEN' } },
        { status: 400 }
      );
    }
    
    const decodedPayload = JSON.parse(payloadString);
    const userId = decodedPayload.userId;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { message: 'Token tidak valid', code: 'INVALID_TOKEN' } },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'User tidak ditemukan', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Verifikasi penuh dengan secret yang benar
    const secretKey = new TextEncoder().encode(JWT_SECRET + user.passwordHash);
    
    try {
      const { payload } = await jwtVerify(token, secretKey);
      if (payload.purpose !== 'reset_password') {
        throw new Error('Invalid purpose');
      }
    } catch (e) {
      return NextResponse.json(
        { success: false, error: { message: 'Token tidak valid, sudah kadaluarsa, atau password sudah pernah diubah', code: 'EXPIRED_TOKEN' } },
        { status: 400 }
      );
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });

    return NextResponse.json({
      success: true,
      message: 'Password berhasil direset',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.issues[0].message, code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: { message: 'Terjadi kesalahan internal', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
