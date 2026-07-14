import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { generateJadwalSesi } from "@/lib/jadwalGenerator";

// Helper konversi jam string "08:00" ke Date (untuk tipe @db.Time Prisma)
function parseTimeString(timeStr: string) {
  const [hours, minutes] = timeStr.split(':');
  const d = new Date();
  d.setUTCHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
  return d;
}

export async function GET() {
  const session = await getSession();
  if (session.userRole !== "SUPER_ADMIN" && session.userRole !== "ADMIN_KAMPUS") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const whereClause = session.userRole === "ADMIN_KAMPUS" && session.kampusId 
      ? { kelasMataKuliah: { mataKuliah: { kampusId: session.kampusId } } }
      : {};

    const templates = await prisma.jadwalTemplate.findMany({
      where: whereClause,
      include: { 
        kelasMataKuliah: {
          include: {
            mataKuliah: true,
            kelas: true,
            dosen: true
          }
        },
        _count: {
          select: { jadwalSesi: true }
        }
      }
    });
    
    return NextResponse.json({ success: true, data: templates });
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
    const { kelasMataKuliahId, hari, jamMulai, jamSelesai, ruangan, berlakuMulai, berlakuSampai } = body;

    if (session.userRole === "ADMIN_KAMPUS") {
      const p = await prisma.kelasMataKuliah.findUnique({ 
        where: { id: kelasMataKuliahId },
        include: { mataKuliah: true }
      });
      if (!p || p.mataKuliah.kampusId !== session.kampusId) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
    }

    // Cek duplikasi jadwal
    const existingJadwal = await prisma.jadwalTemplate.findFirst({
      where: {
        kelasMataKuliahId,
        hari
      }
    });

    if (existingJadwal) {
      return NextResponse.json({ success: false, error: "Jadwal untuk kelas dan hari ini sudah ada." }, { status: 400 });
    }

    const start = new Date(berlakuMulai);
    const end = new Date(berlakuSampai);
    const jMulai = parseTimeString(jamMulai);
    const jSelesai = parseTimeString(jamSelesai);

    const newTemplate = await prisma.jadwalTemplate.create({
      data: {
        kelasMataKuliahId,
        hari,
        jamMulai: jMulai,
        jamSelesai: jSelesai,
        ruangan,
        berlakuMulai: start,
        berlakuSampai: end,
        status: "AKTIF"
      }
    });

    // Otomatis generate jadwal sesi
    const countGenerated = await generateJadwalSesi(newTemplate.id);

    return NextResponse.json({ 
      success: true, 
      data: newTemplate, 
      message: `Berhasil membuat template dan ${countGenerated} sesi otomatis digenerate.` 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
