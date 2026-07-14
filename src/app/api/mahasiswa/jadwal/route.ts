import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  
  if (session.userRole !== "MAHASISWA") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Cari semua enrollments mahasiswa ini
    const enrollments = await prisma.enrollment.findMany({
      where: { mahasiswaId: session.userId! },
      select: { kelasId: true }
    });
    const kelasIds = enrollments.map(e => e.kelasId);

    // Cari JadwalTemplate yang terkait dengan kelas-kelas tersebut
    const jadwalTemplates = await prisma.jadwalTemplate.findMany({
      where: {
        status: "AKTIF",
        kelasMataKuliah: {
          kelasId: { in: kelasIds }
        }
      },
      include: {
        kelasMataKuliah: {
          include: {
            mataKuliah: true,
            kelas: true,
            dosen: { select: { email: true, id: true } }
          }
        },
        // Ambil sesi hari ini jika ada yang ONGOING atau SCHEDULED
        jadwalSesi: {
          where: {
            tanggal: new Date().toISOString().split('T')[0] + "T00:00:00.000Z" // Tepat hari ini (asumsi tersimpan jam 00:00)
            // Note: Karena zona waktu bisa kompleks, kita akan filter di client atau pakai operator gte/lte.
            // Untuk sederhananya, kita akan kirim semua jadwal template dan biarkan client memilah berdasar hari.
          },
          take: 1,
          orderBy: { tanggal: 'asc' }
        }
      }
    });

    return NextResponse.json({ success: true, data: jadwalTemplates });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
