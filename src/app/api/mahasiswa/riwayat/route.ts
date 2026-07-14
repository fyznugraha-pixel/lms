import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  
  if (session.userRole !== "MAHASISWA") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const absensiList = await prisma.absensi.findMany({
      where: { mahasiswaId: session.userId! },
      include: {
        jadwalSesi: {
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
          }
        }
      },
      orderBy: {
        waktuAbsen: 'desc'
      }
    });

    // Hitung ringkasan
    const summary = {
      HADIR: 0,
      TERLAMBAT: 0,
      IZIN: 0,
      SAKIT: 0,
      ALPHA: 0,
      TOTAL: absensiList.length
    };

    const breakdownByMk: Record<string, any> = {};

    absensiList.forEach((a: any) => {
      // Update global summary
      if (summary[a.status as keyof typeof summary] !== undefined) {
        summary[a.status as keyof typeof summary]++;
      }

      // Breakdown per mata kuliah
      const mkName = a.jadwalSesi.jadwalTemplate.kelasMataKuliah.mataKuliah.namaMk;
      if (!breakdownByMk[mkName]) {
        breakdownByMk[mkName] = {
          namaMk: mkName,
          kodeMk: a.jadwalSesi.jadwalTemplate.kelasMataKuliah.mataKuliah.kodeMk,
          HADIR: 0, TERLAMBAT: 0, IZIN: 0, SAKIT: 0, ALPHA: 0, TOTAL: 0,
          history: []
        };
      }
      
      breakdownByMk[mkName][a.status]++;
      breakdownByMk[mkName].TOTAL++;
      breakdownByMk[mkName].history.push({
        id: a.id,
        status: a.status,
        waktuAbsen: a.waktuAbsen,
        pertemuanKe: a.jadwalSesi.pertemuanKe,
        tanggal: a.jadwalSesi.tanggal
      });
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        summary,
        breakdown: Object.values(breakdownByMk)
      } 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
