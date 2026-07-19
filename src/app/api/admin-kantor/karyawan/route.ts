import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

const createKaryawanSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  namaLengkap: z.string().min(1, 'Nama lengkap harus diisi'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['KARYAWAN', 'ADMIN_KANTOR']),
});

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || (payload.role !== 'ADMIN_KANTOR' && payload.role !== 'SUPER_ADMIN')) {
    return null;
  }
  return payload;
}

export async function GET(request: Request) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status'); // 'active', 'inactive', or empty for all

    const whereClause: any = {
      role: { in: ['KARYAWAN', 'ADMIN_KANTOR'] },
    };

    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { namaLengkap: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status === 'active') {
      whereClause.isActive = true;
    } else if (status === 'inactive') {
      whereClause.isActive = false;
    }

    const karyawanList = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        namaLengkap: true,
        role: true,
        isActive: true,
      },
      orderBy: { namaLengkap: 'asc' },
    });

    return NextResponse.json({ success: true, data: karyawanList });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createKaryawanSchema.parse(body);

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'Email sudah terdaftar' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        namaLengkap: data.namaLengkap,
        role: data.role,
        isActive: true,
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: { 
        id: newUser.id, 
        email: newUser.email, 
        namaLengkap: newUser.namaLengkap, 
        role: newUser.role,
        isActive: newUser.isActive
      } 
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
