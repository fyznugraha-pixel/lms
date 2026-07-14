import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (session.userRole !== "DOSEN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  
  let targetDate = new Date();
  if (dateParam) {
    targetDate = new Date(dateParam);
  }

  // Set start and end of the day
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const sesiHariIni = await prisma.jadwalSesi.findMany({
      where: {
        tanggal: {
          gte: startOfDay,
          lte: endOfDay
        },
        jadwalTemplate: {
          kelasMataKuliah: {
            dosenId: session.userId!
          }
        }
      },
      include: {
        jadwalTemplate: {
          include: {
            kelasMataKuliah: {
              include: {
                mataKuliah: true,
                kelas: true
              }
            }
          }
        }
      },
      orderBy: { jamMulai: 'asc' }
    });

    return NextResponse.json({ success: true, data: sesiHariIni });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
