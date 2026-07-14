import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  
  if (session.userRole !== "SUPER_ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { namaKampus, kodeKampus, subdomain, latitude, longitude, radiusMeter } = body;

    const updatedKampus = await prisma.kampus.update({
      where: { id },
      data: {
        namaKampus,
        kodeKampus,
        subdomain,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radiusMeter: parseInt(radiusMeter, 10),
      }
    });

    return NextResponse.json({ success: true, data: updatedKampus });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  
  if (session.userRole !== "SUPER_ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    await prisma.kampus.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
