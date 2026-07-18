import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    
    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const role = user.role as string;
    const userId = user.userId as string;

    const isAdminOrPJ = role === 'ADMIN_KANTOR' || role === 'PENANGGUNG_JAWAB_ABSEN' || role === 'SUPER_ADMIN';

    // Fetch all worklogs, ordering by newest first
    const logs = await prisma.workLog.findMany({
      orderBy: [
        { tanggal: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        karyawan: {
          select: {
            namaLengkap: true,
            email: true
          }
        }
      },
      take: 50 // limit to last 50 entries
    });

    // Filter out private logs if not admin/pj and not owner
    const filteredLogs = logs.filter((log: any) => {
      if (!log.isPrivat) return true;
      if (isAdminOrPJ) return true;
      if (log.karyawanId === userId) return true;
      return false;
    });

    return NextResponse.json({ success: true, data: filteredLogs });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
