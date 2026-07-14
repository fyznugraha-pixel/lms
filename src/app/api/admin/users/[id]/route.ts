import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  
  if (session.userRole !== "SUPER_ADMIN" && session.userRole !== "ADMIN_KAMPUS") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { email, password, role, kampusId, nim } = body;

    // Verifikasi kepemilikan data untuk Admin Kampus
    if (session.userRole === "ADMIN_KAMPUS") {
      const existingUser = await prisma.user.findUnique({ where: { id } });
      if (!existingUser || existingUser.kampusId !== session.kampusId) {
        return NextResponse.json({ success: false, error: "Not found or forbidden" }, { status: 403 });
      }
    }

    const finalKampusId = session.userRole === "ADMIN_KAMPUS" ? session.kampusId : kampusId;
    
    const updateData: any = {
      email,
      role,
      kampusId: finalKampusId || null,
      nim: nim || null
    };

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    });

    const { passwordHash: _, ...rest } = updatedUser;
    return NextResponse.json({ success: true, data: rest });
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
      const existingUser = await prisma.user.findUnique({ where: { id } });
      if (!existingUser || existingUser.kampusId !== session.kampusId) {
        return NextResponse.json({ success: false, error: "Not found or forbidden" }, { status: 403 });
      }
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
