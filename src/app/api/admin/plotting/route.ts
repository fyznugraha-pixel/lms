import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (session.userRole !== "SUPER_ADMIN" && session.userRole !== "ADMIN_KAMPUS") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const whereClause = session.userRole === "ADMIN_KAMPUS" && session.kampusId 
      ? { mataKuliah: { kampusId: session.kampusId } }
      : {};

    const plotting = await prisma.kelasMataKuliah.findMany({
      where: whereClause,
      include: { 
        mataKuliah: true,
        kelas: true,
        dosen: true
      },
      orderBy: { kelas: { namaKelas: "asc" } }
    });
    
    return NextResponse.json({ success: true, data: plotting });
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
    const { mataKuliahId, kelasId, dosenId } = body;

    // Pastikan mk, kelas, dan dosen berasal dari kampus yang sama jika ADMIN_KAMPUS
    if (session.userRole === "ADMIN_KAMPUS") {
      const mk = await prisma.mataKuliah.findUnique({ where: { id: mataKuliahId } });
      const kls = await prisma.kelas.findUnique({ where: { id: kelasId } });
      const dosen = await prisma.user.findUnique({ where: { id: dosenId } });

      if (!mk || !kls || !dosen || mk.kampusId !== session.kampusId || kls.kampusId !== session.kampusId || dosen.kampusId !== session.kampusId) {
        return NextResponse.json({ success: false, error: "Data tidak valid atau dari kampus lain" }, { status: 403 });
      }
    }

    const newPlotting = await prisma.kelasMataKuliah.create({
      data: {
        mataKuliahId,
        kelasId,
        dosenId,
      }
    });

    return NextResponse.json({ success: true, data: newPlotting });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
