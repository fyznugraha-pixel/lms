import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session.userRole !== "SUPER_ADMIN" && session.userRole !== "ADMIN_KAMPUS") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { kodeMK, namaMK, sks } = body;

    if (session.userRole === "ADMIN_KAMPUS") {
      const existing = await prisma.mataKuliah.findUnique({ where: { id } });
      if (!existing || existing.kampusId !== session.kampusId) {
        return NextResponse.json({ success: false, error: "Not found or forbidden" }, { status: 403 });
      }
    }

    const updated = await prisma.mataKuliah.update({
      where: { id },
      data: { kodeMK, namaMK, sks: parseInt(sks, 10) }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session.userRole !== "SUPER_ADMIN" && session.userRole !== "ADMIN_KAMPUS") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    
    if (session.userRole === "ADMIN_KAMPUS") {
      const existing = await prisma.mataKuliah.findUnique({ where: { id } });
      if (!existing || existing.kampusId !== session.kampusId) {
        return NextResponse.json({ success: false, error: "Not found or forbidden" }, { status: 403 });
      }
    }

    await prisma.mataKuliah.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
