import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

const pengajuanSchema = z.object({
  jenis: z.enum(['IZIN', 'SAKIT', 'KLARIFIKASI_ABSEN']),
  tanggalMulai: z.string(), // ISO String
  tanggalSelesai: z.string(), // ISO String
  alasan: z.string().min(5, "Alasan harus lebih detail (minimal 5 karakter)"),
  lampiranUrl: z.string().optional(),
});

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

export async function POST(request: Request) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = pengajuanSchema.parse(body);
    
    const tMulai = new Date(data.tanggalMulai);
    tMulai.setHours(0, 0, 0, 0);
    
    const tSelesai = new Date(data.tanggalSelesai);
    tSelesai.setHours(23, 59, 59, 999);

    if (tSelesai < tMulai) {
      return NextResponse.json({ success: false, error: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.' }, { status: 400 });
    }

    // Deteksi Konflik (Jika Izin/Sakit)
    if (data.jenis === 'IZIN' || data.jenis === 'SAKIT') {
      // 1. Cek apakah ada record absensi (Hadir/Terlambat/dll) di rentang waktu tersebut
      const absensiConflict = await prisma.absensiKantor.findFirst({
        where: {
          karyawanId: user.userId as string,
          tanggal: { gte: tMulai, lte: tSelesai },
          status: { not: 'ALPHA' } // Jika Alpha boleh ditimpa jadi Sakit/Izin
        }
      });

      if (absensiConflict) {
        return NextResponse.json({ 
          success: false, 
          error: `Gagal mengajukan. Anda sudah memiliki record kehadiran pada rentang tanggal tersebut.` 
        }, { status: 400 });
      }

      // 2. Cek apakah sudah ada pengajuan izin/sakit lain yang overlap
      const pengajuanConflict = await prisma.pengajuanIzin.findFirst({
        where: {
          karyawanId: user.userId as string,
          status: { in: ['PENDING', 'DISETUJUI'] },
          jenis: { in: ['IZIN', 'SAKIT'] },
          OR: [
            { tanggalMulai: { lte: tSelesai }, tanggalSelesai: { gte: tMulai } }
          ]
        }
      });

      if (pengajuanConflict) {
        return NextResponse.json({ 
          success: false, 
          error: `Gagal mengajukan. Anda sudah memiliki pengajuan yang bersinggungan di rentang tanggal tersebut.` 
        }, { status: 400 });
      }
    }

    const pengajuan = await prisma.pengajuanIzin.create({
      data: {
        karyawanId: user.userId as string,
        jenis: data.jenis,
        tanggalMulai: tMulai,
        tanggalSelesai: tSelesai,
        alasan: data.alasan,
        lampiranUrl: data.lampiranUrl || null,
        status: 'PENDING'
      }
    });

    return NextResponse.json({ success: true, data: pengajuan, message: 'Pengajuan berhasil dikirim.' });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const user = await checkAuth();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode'); // 'admin' atau 'user'

    let pengajuanList = [];

    if (mode === 'admin' && ['ADMIN_KANTOR', 'SUPER_ADMIN'].includes(user.role as string)) {
      pengajuanList = await prisma.pengajuanIzin.findMany({
        include: { karyawan: { select: { namaLengkap: true, email: true } } },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      pengajuanList = await prisma.pengajuanIzin.findMany({
        where: { karyawanId: user.userId as string },
        orderBy: { createdAt: 'desc' }
      });
    }

    return NextResponse.json({ success: true, data: pengajuanList });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
