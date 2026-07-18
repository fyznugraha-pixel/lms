import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { SignJWT } from 'jose';
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build');

const forgotSchema = z.object({
  email: z.string().email('Format email tidak valid'),
});

const JWT_SECRET = process.env.JWT_SECRET || 'tactlink-secret-key-2024-development';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = forgotSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success anyway to prevent email enumeration
      return NextResponse.json({ success: true, message: 'Jika email terdaftar, instruksi telah dikirim.' });
    }

    // Buat token reset (valid selama 15 menit)
    // Gunakan kombinasi JWT_SECRET + passwordHash agar token otomatis hangus saat password diubah
    const secretKey = new TextEncoder().encode(JWT_SECRET + user.passwordHash);
    
    const token = await new SignJWT({ userId: user.id, purpose: 'reset_password' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(secretKey);

    // Ambil host dari request
    const host = request.headers.get('host') || 'absensi.byfayiz.web.id';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    
    // Subdomain juga dipertahankan agar tidak salah masuk
    const resetUrl = `${protocol}://${host}/reset-password?token=${token}`;

    const { data, error } = await resend.emails.send({
      from: 'TactLink <info@tactlink.com>',
      to: email,
      subject: 'Reset Password Anda - TactLink',
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
          <h2 style="color: #394887;">Reset Password TactLink</h2>
          <p>Halo, ${user.namaLengkap}</p>
          <p>Kami menerima permintaan untuk mereset password akun TactLink Anda. Jika Anda merasa tidak meminta ini, abaikan email ini.</p>
          <p>Untuk mereset password, silakan klik tombol di bawah ini (Tautan ini berlaku selama 15 menit):</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #394887; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px; margin-bottom: 20px;">
            Reset Password
          </a>
          <p style="font-size: 14px; color: #666;">Atau salin dan tempel tautan berikut di browser Anda:</p>
          <p style="font-size: 12px; color: #666; word-break: break-all;">${resetUrl}</p>
          <hr style="border: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #999;">TactLink Integrated Attendance & Management System</p>
        </div>
      `
    });

    if (error) {
      console.error("Resend Error:", error);
      return NextResponse.json(
        { success: false, error: { message: 'Gagal mengirim email reset', code: 'EMAIL_FAILED' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Email reset password telah dikirim.' });

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
