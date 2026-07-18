import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const todo = await prisma.todoItem.findUnique({ where: { id } });
    if (!todo || todo.karyawanId !== user.userId) {
      return NextResponse.json({ success: false, error: 'Not found or forbidden' }, { status: 404 });
    }

    const updated = await prisma.todoItem.update({
      where: { id },
      data: {
        status: body.status, // TODO, IN_PROGRESS, DONE
        judul: body.judul,
        deskripsi: body.deskripsi,
        prioritas: body.prioritas,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const todo = await prisma.todoItem.findUnique({ where: { id } });
    if (!todo || todo.karyawanId !== user.userId) {
      return NextResponse.json({ success: false, error: 'Not found or forbidden' }, { status: 404 });
    }

    await prisma.todoItem.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Tugas dihapus' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
