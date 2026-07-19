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

    return NextResponse.json({ 
      success: true, 
      message: `Cron job berhasil dijalankan. Sesi ditutup: ${closedSessionsCount.count}, Alpha ditambahkan: ${alphaCount}.` 
    });

  } catch (error: any) {
    console.error('Cron Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
