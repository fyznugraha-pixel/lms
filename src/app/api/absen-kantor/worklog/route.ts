import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { z } from 'zod';

const workLogSchema = z.object({
  dikerjakanHariIni: z.string().min(5, "Tuliskan apa yang Anda kerjakan minimal 5 karakter."),
  rencanaBesok: z.string(),
  blocker: z.string().optional(),
  tanggal: z.string(), // ISO Date
  isPrivat: z.boolean().default(false)
});

async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(request: Request) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('tanggal');
    let targetDate = new Date();
    
    if (dateStr) {
      targetDate = new Date(dateStr);
    }
    
    // Set to start of day
    targetDate.setHours(0, 0, 0, 0);

    const log = await prisma.workLog.findUnique({
      where: {
        karyawanId_tanggal: {
          karyawanId: user.userId as string,
          tanggal: targetDate
        }
      }
    });

    return NextResponse.json({ success: true, data: log });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const data = workLogSchema.parse(body);
    
    const targetDate = new Date(data.tanggal);
    targetDate.setHours(0, 0, 0, 0);

    // Upsert (Create or Update)
    const log = await prisma.workLog.upsert({
      where: {
        karyawanId_tanggal: {
          karyawanId: user.userId as string,
          tanggal: targetDate
        }
      },
      update: {
        dikerjakanHariIni: data.dikerjakanHariIni,
        rencanaBesok: data.rencanaBesok,
        blocker: data.blocker || null,
        isPrivat: data.isPrivat,
        updatedAt: new Date()
      },
      create: {
        karyawanId: user.userId as string,
        tanggal: targetDate,
        dikerjakanHariIni: data.dikerjakanHariIni,
        rencanaBesok: data.rencanaBesok,
        blocker: data.blocker || null,
        isPrivat: data.isPrivat
      }
    });

    return NextResponse.json({ success: true, data: log, message: 'Work Log berhasil disimpan.' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
