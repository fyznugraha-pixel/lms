import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session.userRole !== "DOSEN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { action } = body; // "START" atau "END"

    const sesi = await prisma.jadwalSesi.findUnique({
      where: { id },
      include: { jadwalTemplate: { include: { kelasMataKuliah: true } } }
    });

    if (!sesi || sesi.jadwalTemplate.kelasMataKuliah.dosenId !== session.userId) {
      return NextResponse.json({ success: false, error: "Forbidden or Not Found" }, { status: 403 });
    }

    let newStatus = sesi.status;

    if (action === "START") {
      if (sesi.status !== "SCHEDULED") {
        return NextResponse.json({ success: false, error: "Sesi sudah dimulai atau dibatalkan" }, { status: 400 });
      }
      newStatus = "ONGOING";
    } else if (action === "END") {
      if (sesi.status !== "ONGOING") {
        return NextResponse.json({ success: false, error: "Hanya sesi yang sedang berjalan yang dapat diakhiri" }, { status: 400 });
      }
      newStatus = "SELESAI";
    } else {
      return NextResponse.json({ success: false, error: "Action tidak valid" }, { status: 400 });
    }

    const updated = await prisma.jadwalSesi.update({
      where: { id },
      data: { status: newStatus }
    });

    return NextResponse.json({ success: true, data: updated, message: `Sesi berhasil diubah menjadi ${newStatus}` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
