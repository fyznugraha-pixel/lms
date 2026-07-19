import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || !['KARYAWAN', 'ADMIN_KANTOR', 'SUPER_ADMIN'].includes(payload.role as string)) {
    return null;
  }
  return payload;
}

export async function GET(request: Request) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'user';
    const bulan = parseInt(searchParams.get('bulan') || (new Date().getMonth() + 1).toString());
    const tahun = parseInt(searchParams.get('tahun') || new Date().getFullYear().toString());

    // Rentang waktu untuk query
    const startDate = new Date(tahun, bulan - 1, 1);
    const endDate = new Date(tahun, bulan, 0, 23, 59, 59, 999); // Hari terakhir bulan ini

    if (mode === 'admin') {
      if (!['ADMIN_KANTOR', 'SUPER_ADMIN'].includes(user.role as string)) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }

      // Ambil seluruh absensi pada bulan ini
      const absensiList = await prisma.absensiKantor.findMany({
        where: {
          tanggal: { gte: startDate, lte: endDate }
        },
        include: {
          karyawan: { select: { id: true, namaLengkap: true, email: true } }
        },
        orderBy: { tanggal: 'desc' }
      });

      // Kelompokkan per karyawan untuk laporan rekap
      const rekapKaryawan: Record<string, any> = {};

      for (const absen of absensiList) {
        const kId = absen.karyawanId;
        if (!rekapKaryawan[kId]) {
          rekapKaryawan[kId] = {
            id: kId,
            namaLengkap: absen.karyawan.namaLengkap,
            email: absen.karyawan.email,
            hadir: 0,
            terlambat: 0,
            izin: 0,
            sakit: 0,
            alpha: 0,
            incomplete: 0,
            totalDurasiMenit: 0,
          };
        }

        const rekap = rekapKaryawan[kId];
        switch (absen.status) {
          case 'HADIR': rekap.hadir++; break;
          case 'TERLAMBAT': rekap.terlambat++; break;
          case 'IZIN': rekap.izin++; break;
          case 'SAKIT': rekap.sakit++; break;
          case 'ALPHA': rekap.alpha++; break;
        }

        if (absen.isIncomplete) rekap.incomplete++;
        if (absen.durasiKerja) rekap.totalDurasiMenit += absen.durasiKerja;
      }

      return NextResponse.json({ 
        success: true, 
        data: {
          ringkasan: Object.values(rekapKaryawan),
          detail: absensiList
        }
      });
    } else {
      // Mode User
      const absensiList = await prisma.absensiKantor.findMany({
        where: {
          karyawanId: user.userId as string,
          tanggal: { gte: startDate, lte: endDate }
        },
        orderBy: { tanggal: 'desc' }
      });

      const rekap = {
        hadir: 0,
        terlambat: 0,
        izin: 0,
        sakit: 0,
        alpha: 0,
        incomplete: 0,
        totalDurasiMenit: 0,
      };

      for (const absen of absensiList) {
        switch (absen.status) {
          case 'HADIR': rekap.hadir++; break;
          case 'TERLAMBAT': rekap.terlambat++; break;
          case 'IZIN': rekap.izin++; break;
          case 'SAKIT': rekap.sakit++; break;
          case 'ALPHA': rekap.alpha++; break;
        }
        if (absen.isIncomplete) rekap.incomplete++;
        if (absen.durasiKerja) rekap.totalDurasiMenit += absen.durasiKerja;
      }

      return NextResponse.json({ 
        success: true, 
        data: {
          ringkasan: rekap,
          detail: absensiList
        }
      });
    }

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
