import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    // Ganti dengan secret key yang aman di production (.env)
    const CRON_SECRET = process.env.CRON_SECRET || 'tactlink-cron-secret-2026';
    
    if (key !== CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized cron trigger' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // 1. Cari karyawan yang tidak absen masuk sama sekali kemarin (ALPHA)
    const activeKaryawanList = await prisma.user.findMany({
      where: {
        role: { in: ['KARYAWAN', 'ADMIN_KANTOR'] },
        isActive: true,
      },
      select: { id: true },
    });

    let alphaCount = 0;
    for (const karyawan of activeKaryawanList) {
      const absensi = await prisma.absensiKantor.findUnique({
        where: {
          karyawanId_tanggal: {
            karyawanId: karyawan.id,
            tanggal: yesterday,
          }
        }
      });

      // Jika tidak ada absensi dan tidak ada pengajuan izin (yang sudah approve), set ALPHA
      if (!absensi) {
        // Cek pengajuan izin
        const izin = await prisma.pengajuanIzin.findFirst({
          where: {
            karyawanId: karyawan.id,
            status: 'DISETUJUI',
            tanggalMulai: { lte: yesterday },
            tanggalSelesai: { gte: yesterday }
          }
        });

        if (!izin) {
          await prisma.absensiKantor.create({
            data: {
              karyawanId: karyawan.id,
              tanggal: yesterday,
              status: 'ALPHA',
              metode: 'MANUAL_ADMIN',
              isIncomplete: true // Ditandai incomplete agar bisa diklarifikasi jika error sistem
            }
          });
          alphaCount++;
        }
      }
    }

    // 1.5 Cari absensi kemarin yang masuk tapi belum pulang (lupa checkout)
    const incompleteCheckouts = await prisma.absensiKantor.findMany({
      where: {
        tanggal: yesterday,
        waktuAbsenMasuk: { not: null },
        waktuAbsenPulang: null,
      }
    });

    let autoCheckoutCount = 0;
    for (const absensi of incompleteCheckouts) {
      // Set jam checkout default ke 16.00 waktu lokal (atau server time)
      const defaultCheckoutTime = new Date(yesterday);
      defaultCheckoutTime.setHours(16, 0, 0, 0);

      let durasiMenit = null;
      if (absensi.waktuAbsenMasuk) {
        durasiMenit = Math.floor((defaultCheckoutTime.getTime() - absensi.waktuAbsenMasuk.getTime()) / (1000 * 60));
        if (durasiMenit < 0) durasiMenit = 0;
      }

      await prisma.absensiKantor.update({
        where: { id: absensi.id },
        data: {
          waktuAbsenPulang: defaultCheckoutTime,
          durasiKerja: durasiMenit,
          isIncomplete: true // Tetap ditandai incomplete agar karyawan sadar mereka lupa absen pulang
        }
      });
      autoCheckoutCount++;
    }

    // 2. Pastikan sesi kemarin yang masih AKTIF diubah jadi SELESAI
    const closedSessionsCount = await prisma.sesiAbsenKantor.updateMany({
      where: {
        tanggal: { lte: yesterday },
        status: 'AKTIF'
      },
      data: {
        status: 'SELESAI'
      }
    });

    // 3. Auto-delete work logs older than 2 hari (sebelum H-2)
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const deletedWorkLogs = await prisma.workLog.deleteMany({
      where: {
        tanggal: { lt: twoDaysAgo }
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Cron job berhasil dijalankan. Sesi ditutup: ${closedSessionsCount.count}, Alpha: ${alphaCount}, Auto-Checkout (16:00): ${autoCheckoutCount}. Work logs dihapus: ${deletedWorkLogs.count}.` 
    });

  } catch (error: any) {
    console.error('Cron Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
