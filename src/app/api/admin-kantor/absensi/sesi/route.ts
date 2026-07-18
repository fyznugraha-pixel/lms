import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { getSession } from '@/lib/session';

const createSesiSchema = z.object({
  jenisAbsen: z.enum(['MASUK', 'PULANG']),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session.userId || (session.userRole !== 'ADMIN_KANTOR' && session.userRole !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const sesiList = await prisma.sesiAbsenKantor.findMany({
      orderBy: { waktuDibuat: 'desc' },
      include: {
        dibuatOleh: { select: { namaLengkap: true, email: true } },
        _count: {
          select: { tokens: true, absensiMasuk: true, absensiPulang: true }
        }
      },
    });

    return NextResponse.json({ success: true, data: sesiList });
  } catch (error) {
    console.error('Error fetching sesi absensi:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Gagal mengambil data sesi absensi' } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session.userId || (session.userRole !== 'ADMIN_KANTOR' && session.userRole !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const body = await request.json();
    const { jenisAbsen } = createSesiSchema.parse(body);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Cek apakah sudah ada sesi aktif untuk jenis yang sama hari ini
    const existingActiveSesi = await prisma.sesiAbsenKantor.findFirst({
      where: {
        tanggal: today,
        jenisAbsen,
        status: 'AKTIF'
      }
    });

    if (existingActiveSesi) {
      return NextResponse.json(
        { success: false, error: { message: `Sesi ${jenisAbsen} hari ini sudah ada dan masih aktif` } },
        { status: 400 }
      );
    }

    // Ambil semua karyawan yang aktif
    const karyawanList = await prisma.user.findMany({
      where: { role: 'KARYAWAN', isActive: true },
      select: { id: true }
    });

    if (karyawanList.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'Tidak ada karyawan aktif yang ditemukan' } },
        { status: 400 }
      );
    }

    // Buat sesi
    const newSesi = await prisma.sesiAbsenKantor.create({
      data: {
        tanggal: today,
        jenisAbsen,
        dibuatOlehId: session.userId,
        status: 'AKTIF'
      }
    });

    // Buat token unik untuk masing-masing karyawan
    const expiresAt = new Date();
    expiresAt.setHours(23, 59, 59, 999); // Token expires end of day

    const tokensData = karyawanList.map((karyawan) => ({
      sesiAbsenKantorId: newSesi.id,
      karyawanId: karyawan.id,
      token: crypto.randomBytes(32).toString('hex'),
      expiresAt,
      isUsed: false
    }));

    await prisma.tokenAbsenKaryawan.createMany({
      data: tokensData
    });

    return NextResponse.json({ success: true, data: newSesi });
  } catch (error) {
    console.error('Error creating sesi absensi:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: { message: 'Data tidak valid' } }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: { message: 'Gagal membuat sesi absensi' } },
      { status: 500 }
    );
  }
}
