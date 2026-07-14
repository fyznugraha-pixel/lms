import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  
  if (session.userRole !== "SUPER_ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const kampus = await prisma.kampus.findMany({
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json({ success: true, data: kampus });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  
  if (session.userRole !== "SUPER_ADMIN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { namaKampus, kodeKampus, subdomain, latitude, longitude, radiusMeter } = body;

    const newKampus = await prisma.kampus.create({
      data: {
        namaKampus,
        kodeKampus,
        subdomain,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radiusMeter: parseInt(radiusMeter, 10),
      }
    });

    return NextResponse.json({ success: true, data: newKampus });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
