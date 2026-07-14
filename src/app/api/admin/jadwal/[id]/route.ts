import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session.userRole !== "SUPER_ADMIN" && session.userRole !== "ADMIN_KAMPUS") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    
    if (session.userRole === "ADMIN_KAMPUS") {
      const existing = await prisma.jadwalTemplate.findUnique({ 
        where: { id },
        include: { kelasMataKuliah: { include: { mataKuliah: true } } }
      });
      if (!existing || existing.kelasMataKuliah.mataKuliah.kampusId !== session.kampusId) {
        return NextResponse.json({ success: false, error: "Not found or forbidden" }, { status: 403 });
      }
    }

    // Prisma relation akan error jika ada sesi terkait, jadi kita hapus sesinya dulu.
    // Di skema saat ini tidak ada onDelete Cascade, mari kita hapus manual.
    // (Atau abaikan jika Anda nanti pakai referentialAction Cascade).
    await prisma.jadwalSesi.deleteMany({ where: { jadwalTemplateId: id }});
    await prisma.jadwalTemplate.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
