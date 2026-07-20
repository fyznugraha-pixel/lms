import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session.userId || (session.userRole !== 'ADMIN_KANTOR' && session.userRole !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const { feedback } = body;

    if (feedback === undefined) {
      return NextResponse.json({ success: false, error: 'Feedback is required' }, { status: 400 });
    }

    const updatedLog = await prisma.workLog.update({
      where: { id },
      data: { adminFeedback: feedback }
    });

    return NextResponse.json({ success: true, data: updatedLog });
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}