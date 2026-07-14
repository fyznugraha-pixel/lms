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
      ? { kampusId: session.kampusId }
      : {};

    const mataKuliah = await prisma.mataKuliah.findMany({
      where: whereClause,
      include: { kampus: true },
      orderBy: { namaMk: "asc" }
    });
    
    return NextResponse.json({ success: true, data: mataKuliah });
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
    const { kodeMk, namaMk, sks, kampusId } = body;
    const finalKampusId = session.userRole === "ADMIN_KAMPUS" ? session.kampusId : kampusId;

    if (!finalKampusId) {
      return NextResponse.json({ success: false, error: "Kampus ID diperlukan" }, { status: 400 });
    }

    const newMataKuliah = await prisma.mataKuliah.create({
      data: {
        kodeMk,
        namaMk,
        sks: parseInt(sks, 10),
        kampusId: finalKampusId,
      }
    });

    return NextResponse.json({ success: true, data: newMataKuliah });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
