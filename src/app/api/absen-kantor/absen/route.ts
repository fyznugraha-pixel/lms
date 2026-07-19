import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

const absenSchema = z.object({
  jenisAbsen: z.enum(['MASUK', 'PULANG']),
  kode: z.string().min(1, 'Kode absen wajib diisi'),
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const user = await verifyToken(token);
    if (!user || !['KARYAWAN', 'ADMIN_KANTOR', 'SUPER_ADMIN'].includes(user.role as string)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.userId as string;

    const body = await request.json();
    const data = absenSchema.parse(body);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Cari token absen yang valid untuk user ini
    const tokenRecord = await prisma.tokenAbsenKaryawan.findFirst({
      where: {
        karyawanId: userId,
        isUsed: false,
        expiresAt: { gt: new Date() },
        sesiAbsenKantor: {
          tanggal: today,
          jenisAbsen: data.jenisAbsen,
          status: 'AKTIF'
        }
      },
      include: {
        sesiAbsenKantor: true
      }
    });

    if (!tokenRecord) {
      return NextResponse.json({ 
        success: false, 
        error: `Sesi absen ${data.jenisAbsen} belum dibuka atau sudah kedaluwarsa.` 
      }, { status: 400 });
    }

    const validCode = tokenRecord.sesiAbsenKantor.id.substring(0, 6).toUpperCase();
    if (data.kode.toUpperCase() !== validCode) {
      return NextResponse.json({ success: false, error: 'Kode absen tidak valid atau salah.' }, { status: 400 });
    }

    const now = new Date();

    // 2. Transaksi mencatat absen
    const result = await prisma.$transaction(async (tx) => {
      await tx.tokenAbsenKaryawan.update({
        where: { id: tokenRecord.id },
        data: { isUsed: true }
      });

      let absensi = await tx.absensiKantor.findUnique({
        where: {
          karyawanId_tanggal: { karyawanId: userId, tanggal: today }
        }
      });

      if (data.jenisAbsen === 'MASUK') {
        if (absensi) throw new Error('Anda sudah absen masuk hari ini.');
        absensi = await tx.absensiKantor.create({
          data: {
            karyawanId: userId,
            tanggal: today,
            sesiMasukId: tokenRecord.sesiAbsenKantorId,
            waktuAbsenMasuk: now,
            status: 'HADIR', 
            metode: 'LINK_PERSONAL',
            isIncomplete: true
          }
        });
      } else if (data.jenisAbsen === 'PULANG') {
        if (!absensi) throw new Error('Anda belum absen masuk hari ini.');
        if (absensi.waktuAbsenPulang) throw new Error('Anda sudah absen pulang hari ini.');

        let durasi = null;
        if (absensi.waktuAbsenMasuk) {
          const diffMs = now.getTime() - new Date(absensi.waktuAbsenMasuk).getTime();
          durasi = Math.floor(diffMs / 60000);
        }

        absensi = await tx.absensiKantor.update({
          where: { id: absensi.id },
          data: {
            sesiPulangId: tokenRecord.sesiAbsenKantorId,
            waktuAbsenPulang: now,
            durasiKerja: durasi,
            isIncomplete: false
          }
        });
      }
      return absensi;
    });

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil absen ${data.jenisAbsen}!`,
      data: result
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    const user = await verifyToken(token);
    if (!user || !['KARYAWAN', 'ADMIN_KANTOR', 'SUPER_ADMIN'].includes(user.role as string)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.userId as string;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Ambil absensi hari ini
    const absensiHariIni = await prisma.absensiKantor.findUnique({
      where: {
        karyawanId_tanggal: {
          karyawanId: userId,
          tanggal: today
        }
      }
    });

    // Cek apakah ada sesi masuk/pulang aktif yang mana user punya token
    const tokenMasuk = await prisma.tokenAbsenKaryawan.findFirst({
      where: {
        karyawanId: userId,
        isUsed: false,
        expiresAt: { gt: new Date() },
        sesiAbsenKantor: { tanggal: today, jenisAbsen: 'MASUK', status: 'AKTIF' }
      }
    });

    const tokenPulang = await prisma.tokenAbsenKaryawan.findFirst({
      where: {
        karyawanId: userId,
        isUsed: false,
        expiresAt: { gt: new Date() },
        sesiAbsenKantor: { tanggal: today, jenisAbsen: 'PULANG', status: 'AKTIF' }
      }
    });

    // Ambil histori 7 hari terakhir
    const histori = await prisma.absensiKantor.findMany({
      where: { karyawanId: userId },
      orderBy: { tanggal: 'desc' },
      take: 7,
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        absensiHariIni,
        bisaAbsenMasuk: !!tokenMasuk,
        bisaAbsenPulang: !!tokenPulang,
        histori
      }
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
