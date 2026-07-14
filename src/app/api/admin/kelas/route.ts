import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (session.userRole !== "SUPER_ADMIN" && session.userRole !== "ADMIN_KAMPUS") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Admin kampus hanya melihat kelas yang jurusannya berada di kampus mereka
    const whereClause = session.userRole === "ADMIN_KAMPUS" && session.kampusId 
      ? { jurusan: { kampusId: session.kampusId } }
      : {};

    const kelas = await prisma.kelas.findMany({
      where: whereClause,
      include: { 
        jurusan: {
          include: { kampus: true }
        }
      },
      orderBy: { namaKelas: "asc" }
    });
    
    return NextResponse.json({ success: true, data: kelas });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session.userRole !== "SUPER_ADMIN" && session.userRole !== "ADMIN_KAMPUS") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { kodeKelas, namaKelas, jurusanId } = body;

    // Pastikan jurusan yang dipilih ada di kampus admin bersangkutan
    if (session.userRole === "ADMIN_KAMPUS") {
      const jurusan = await prisma.jurusan.findUnique({ where: { id: jurusanId }});
      if (!jurusan || jurusan.kampusId !== session.kampusId) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
    }

    const newKelas = await prisma.kelas.create({
      data: {
        kodeKelas,
        namaKelas,
        jurusanId,
      }
    });

    return NextResponse.json({ success: true, data: newKelas });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
