import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

async function checkPenanggungJawabAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || (payload.role !== 'SUPER_ADMIN')) {
    return null;
  }
  return payload;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkPenanggungJawabAuth();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const sesi = await prisma.sesiAbsenKantor.findUnique({
      where: { id },
      include: {
        dibuatOleh: { select: { namaLengkap: true, email: true } },
        tokens: {
          include: {
            karyawan: { select: { namaLengkap: true, email: true } }
          }
        }
      }
    });

    if (!sesi) {
      return NextResponse.json({ success: false, error: 'Sesi tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: sesi });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
