import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

const updateKaryawanSchema = z.object({
  email: z.string().email('Format email tidak valid').optional(),
  namaLengkap: z.string().min(1, 'Nama lengkap harus diisi').optional(),
  password: z.string().min(6, 'Password minimal 6 karakter').optional(),
  role: z.enum(['KARYAWAN', 'PENANGGUNG_JAWAB_ABSEN', 'ADMIN_KANTOR']).optional(),
  isActive: z.boolean().optional(),
});

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || (payload.role !== 'ADMIN_KANTOR' && payload.role !== 'SUPER_ADMIN')) {
    return null;
  }
  return payload;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateKaryawanSchema.parse(body);

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ success: false, error: 'Karyawan tidak ditemukan' }, { status: 404 });
    }

    const updateData: any = {};
    if (data.email) updateData.email = data.email;
    if (data.namaLengkap) updateData.namaLengkap = data.namaLengkap;
    if (data.role) updateData.role = data.role;
    if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive;
    
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Jika karyawan dinonaktifkan, cabut semua sesinya
    if (data.isActive === false) {
      await prisma.sesiLogin.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() }
      });
    }

    return NextResponse.json({ 
      success: true, 
      data: { 
        id: updatedUser.id, 
        email: updatedUser.email, 
        namaLengkap: updatedUser.namaLengkap, 
        role: updatedUser.role,
        isActive: updatedUser.isActive
      } 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // DELETE request as Soft-Delete (Deactivate)
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ success: false, error: 'Karyawan tidak ditemukan' }, { status: 404 });
    }

    // Set isActive = false
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    // Revoke sessions
    await prisma.sesiLogin.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() }
    });

    return NextResponse.json({ success: true, message: 'Karyawan berhasil dinonaktifkan' });

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
