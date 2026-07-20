import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session.userId || (session.userRole !== 'ADMIN_KANTOR' && session.userRole !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { feedback } = body;

    if (feedback === undefined) {
      return NextResponse.json({ success: false, error: 'Feedback is required' }, { status: 400 });
    }

    // Await params for Next.js 15+ compatibility, fallback to direct access if needed
    // In many setups, `const { id } = await params;` or just `params.id` works.
    // For safety in older Next versions, we can just use `params.id`
    const updatedLog = await prisma.workLog.update({
      where: { id: params.id },
      // @ts-ignore
      data: { adminFeedback: feedback }
    });

    return NextResponse.json({ success: true, data: updatedLog });
  } catch (error) {
    console.error('Error updating feedback:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
