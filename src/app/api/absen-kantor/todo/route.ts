import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { z } from 'zod';

const todoSchema = z.object({
  judul: z.string().min(3, "Judul minimal 3 karakter"),
  deskripsi: z.string().optional(),
  deadline: z.string().optional(),
  prioritas: z.enum(['RENDAH', 'SEDANG', 'TINGGI']).default('SEDANG')
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

    const todos = await prisma.todoItem.findMany({
      where: { karyawanId: user.userId as string },
      orderBy: [
        { status: 'asc' }, // TODO -> IN_PROGRESS -> DONE (karena urutan enum/string biasa, mungkin perlu sort manual di frontend, tp default prisma asc)
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ success: true, data: todos });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await checkAuth();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const data = todoSchema.parse(body);
    
    let deadlineDate = null;
    if (data.deadline) {
      deadlineDate = new Date(data.deadline);
      deadlineDate.setHours(23, 59, 59, 999);
    }

    const todo = await prisma.todoItem.create({
      data: {
        karyawanId: user.userId as string,
        judul: data.judul,
        deskripsi: data.deskripsi || null,
        deadline: deadlineDate,
        prioritas: data.prioritas,
        status: 'TODO'
      }
    });

    return NextResponse.json({ success: true, data: todo, message: 'Tugas berhasil ditambahkan.' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
