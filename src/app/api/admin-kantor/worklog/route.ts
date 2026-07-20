import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session.userId || (session.userRole !== 'ADMIN_KANTOR' && session.userRole !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateQuery = searchParams.get('tanggal');
    
    const whereClause: any = {};
    if (dateQuery) {
      whereClause.tanggal = new Date(dateQuery);
    }

    const logs = await prisma.workLog.findMany({
      where: whereClause,
      include: {
        karyawan: {
          select: { namaLengkap: true, id: true, email: true }
        }
      },
      orderBy: [
        { tanggal: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 100 // Batasi agar tidak terlalu berat untuk sementara
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching admin worklogs:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
