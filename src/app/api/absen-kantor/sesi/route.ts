import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const generateSesiSchema = z.object({
  jenisAbsen: z.enum(['MASUK', 'PULANG']),
});

async function checkPenanggungJawabAuth() {
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
    const admin = await checkPenanggungJawabAuth();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = generateSesiSchema.parse(body);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Cek apakah sudah ada sesi absen untuk hari dan jenis ini
    const existingSesi = await prisma.sesiAbsenKantor.findFirst({
      where: {
        tanggal: today,
        jenisAbsen: data.jenisAbsen,
        status: 'AKTIF',
      }
    });

    if (existingSesi) {
      return NextResponse.json({ 
        success: false, 
        error: `Sesi absen ${data.jenisAbsen} untuk hari ini sudah ada dan masih aktif.` 
      }, { status: 400 });
    }

    // Ambil semua karyawan aktif
    const activeKaryawanList = await prisma.user.findMany({
      where: {
        role: { in: ['KARYAWAN', 'ADMIN_KANTOR'] },
        isActive: true,
      },
      select: { id: true, namaLengkap: true, email: true },
    });

    if (activeKaryawanList.length === 0) {
      return NextResponse.json({ success: false, error: 'Tidak ada karyawan aktif untuk di-generate tokennya.' }, { status: 400 });
    }

    // Generate token per karyawan
    const expiresAt = new Date();
    expiresAt.setHours(23, 59, 59, 999);

    const tokensToInsert = activeKaryawanList.map(k => ({
      karyawanId: k.id,
      token: crypto.randomBytes(32).toString('hex'), // Token unik dan aman
      expiresAt,
    }));

    // Bungkus dalam transaksi
    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat sesi
      const newSesi = await tx.sesiAbsenKantor.create({
        data: {
          tanggal: today,
          jenisAbsen: data.jenisAbsen,
          dibuatOlehId: admin.userId as string,
          status: 'AKTIF',
        }
      });

      // 2. Buat tokens dengan map data menyertakan sesiId
      await tx.tokenAbsenKaryawan.createMany({
        data: tokensToInsert.map(t => ({
          ...t,
          sesiAbsenKantorId: newSesi.id,
        })),
      });

      return newSesi;
    });

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil generate ${tokensToInsert.length} token absen ${data.jenisAbsen}.`,
      data: result 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// GET untuk mengambil daftar sesi hari ini atau histori (opsional, untuk dashboard PJ)
export async function GET(request: Request) {
  try {
    const admin = await checkPenanggungJawabAuth();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const sesiList = await prisma.sesiAbsenKantor.findMany({
      orderBy: { waktuDibuat: 'desc' },
      take: 10,
      include: {
        dibuatOleh: { select: { namaLengkap: true, email: true } },
        _count: {
          select: { tokens: true }
        }
      }
    });

    return NextResponse.json({ success: true, data: sesiList });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
