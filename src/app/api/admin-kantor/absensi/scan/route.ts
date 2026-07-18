import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

const scanSchema = z.object({
  token: z.string().min(1, 'Token wajib diisi'),
});

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || !['ADMIN_KANTOR', 'SUPER_ADMIN'].includes(payload.role as string)) {
    return null;
  }
  return payload;
}

export async function POST(request: Request) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = scanSchema.parse(body);

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Cari token absen
    const tokenRecord = await prisma.tokenAbsenKaryawan.findFirst({
      where: {
        token: data.token,
      },
      include: {
        sesiAbsenKantor: true,
        karyawan: true
      }
    });

    if (!tokenRecord) {
      return NextResponse.json({ success: false, error: 'QR Code tidak valid atau tidak dikenali.' }, { status: 400 });
    }

    if (tokenRecord.isUsed) {
      return NextResponse.json({ success: false, error: 'QR Code sudah digunakan untuk absen.' }, { status: 400 });
    }

    if (new Date(tokenRecord.expiresAt) < now) {
      return NextResponse.json({ success: false, error: 'QR Code sudah kedaluwarsa.' }, { status: 400 });
    }

    if (tokenRecord.sesiAbsenKantor.status !== 'AKTIF') {
      return NextResponse.json({ success: false, error: 'Sesi absensi untuk QR Code ini sudah ditutup.' }, { status: 400 });
    }

    const jenisAbsen = tokenRecord.sesiAbsenKantor.jenisAbsen;
    const userId = tokenRecord.karyawanId;

    // 2. Transaksi absensi
    const result = await prisma.$transaction(async (tx) => {
      // Tandai token isUsed
      await tx.tokenAbsenKaryawan.update({
        where: { id: tokenRecord.id },
        data: { isUsed: true }
      });

      // Cari record AbsensiKantor untuk hari ini
      let absensi = await tx.absensiKantor.findUnique({
        where: {
          karyawanId_tanggal: {
            karyawanId: userId,
            tanggal: today
          }
        }
      });

      if (jenisAbsen === 'MASUK') {
        if (absensi) {
          throw new Error('Karyawan ini sudah melakukan absen masuk hari ini.');
        }
        
        absensi = await tx.absensiKantor.create({
          data: {
            karyawanId: userId,
            tanggal: today,
            sesiMasukId: tokenRecord.sesiAbsenKantorId,
            waktuAbsenMasuk: now,
            status: 'HADIR', 
            metode: 'SCAN_BARCODE',
            isIncomplete: true
          }
        });
      } else if (jenisAbsen === 'PULANG') {
        if (!absensi) {
          throw new Error('Karyawan belum absen masuk hari ini.');
        }
        if (absensi.waktuAbsenPulang) {
          throw new Error('Karyawan sudah melakukan absen pulang hari ini.');
        }

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
      message: `Berhasil absen ${jenisAbsen} untuk ${tokenRecord.karyawan.namaLengkap}!`,
      data: result
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
