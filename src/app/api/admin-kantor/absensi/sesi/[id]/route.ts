import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session.userId || (session.userRole !== 'ADMIN_KANTOR' && session.userRole !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { id } = await context.params;

    const sesi = await prisma.sesiAbsenKantor.findUnique({
      where: { id },
      include: {
        dibuatOleh: { select: { namaLengkap: true, email: true } },
        tokens: {
          include: {
            karyawan: { select: { id: true, namaLengkap: true, email: true, isActive: true } }
          },
          orderBy: {
            karyawan: { namaLengkap: 'asc' }
          }
        },
        absensiMasuk: {
          include: { karyawan: { select: { id: true, namaLengkap: true } } }
        },
        absensiPulang: {
          include: { karyawan: { select: { id: true, namaLengkap: true } } }
        }
      }
    });

    if (!sesi) {
      return NextResponse.json({ success: false, error: { message: 'Sesi tidak ditemukan' } }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: sesi });
  } catch (error) {
    console.error('Error fetching sesi detail:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Gagal mengambil detail sesi absensi' } },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session.userId || (session.userRole !== 'ADMIN_KANTOR' && session.userRole !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { id } = await context.params;

    const updatedSesi = await prisma.sesiAbsenKantor.update({
      where: { id },
      data: { status: 'SELESAI' }
    });

    return NextResponse.json({ success: true, data: updatedSesi });
  } catch (error) {
    console.error('Error updating sesi:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Gagal mengupdate sesi absensi' } },
      { status: 500 }
    );
  }
}
