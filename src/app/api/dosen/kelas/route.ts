import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  
  if (session.userRole !== "DOSEN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const plotting = await prisma.kelasMataKuliah.findMany({
      where: { dosenId: session.userId! },
      include: {
        mataKuliah: true,
        kelas: {
          include: { jurusan: true }
        }
      },
      orderBy: { kelas: { namaKelas: "asc" } }
    });
    
    return NextResponse.json({ success: true, data: plotting });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
