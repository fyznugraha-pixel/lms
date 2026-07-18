import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

const absenSchema = z.object({
  jenisAbsen: z.enum(['MASUK', 'PULANG']),
});

async function checkKaryawanAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || !['KARYAWAN', 'PENANGGUNG_JAWAB_ABSEN', 'ADMIN_KANTOR', 'SUPER_ADMIN'].includes(payload.role as string)) {
    return null;
  }
  return payload;
}

export async function POST(request: Request) {
  try {
    const user = await checkKaryawanAuth();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = absenSchema.parse(body);
    const userId = user.userId as string;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Cari token absen yang valid untuk user ini dan jenis absen ini hari ini
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
        error: `Sesi absen ${data.jenisAbsen} belum dibuka oleh Penanggung Jawab, atau token Anda sudah kedaluwarsa/digunakan.` 
      }, { status: 400 });
    }

    const now = new Date();

    // 2. Transaksi untuk menandai token terpakai dan mencatat absen
    const result = await prisma.$transaction(async (tx) => {
      // Tandai token isUsed
      await tx.tokenAbsenKaryawan.update({
        where: { id: tokenRecord.id },
        data: { isUsed: true }
      });

      // Cari atau buat record AbsensiKantor untuk hari ini
      let absensi = await tx.absensiKantor.findUnique({
        where: {
          karyawanId_tanggal: {
            karyawanId: userId,
            tanggal: today
          }
        }
      });

      if (data.jenisAbsen === 'MASUK') {
        if (absensi) {
          throw new Error('Anda sudah melakukan absen masuk hari ini.');
        }
        
        // Buat record absen masuk
        absensi = await tx.absensiKantor.create({
          data: {
            karyawanId: userId,
            tanggal: today,
            sesiMasukId: tokenRecord.sesiAbsenKantorId,
            waktuAbsenMasuk: now,
            status: 'HADIR', // Bisa dikembangkan dengan cek jam masuk untuk status TERLAMBAT
            metode: 'LINK_PERSONAL',
            isIncomplete: true // karena belum pulang
          }
        });
      } else if (data.jenisAbsen === 'PULANG') {
        if (!absensi) {
          throw new Error('Anda belum melakukan absen masuk hari ini.');
        }
        if (absensi.waktuAbsenPulang) {
          throw new Error('Anda sudah melakukan absen pulang hari ini.');
        }

        // Hitung durasi kerja dalam menit
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
    const user = await checkKaryawanAuth();
    if (!user) {
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
