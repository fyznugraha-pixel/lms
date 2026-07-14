import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { StatusAbsensi, MetodeAbsensi } from "@prisma/client";

const overrideSchema = z.object({
  mahasiswaIds: z.array(z.string()), // Bisa 1 atau lebih untuk bulk action
  statusBaru: z.enum(["HADIR", "ALPHA", "IZIN", "SAKIT", "TERLAMBAT"]),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  
  if (session.userRole !== "DOSEN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params; // id = jadwalSesiId
    const body = await req.json();
    const validation = overrideSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.message }, { status: 400 });
    }

    const { mahasiswaIds, statusBaru } = validation.data;

    // Pastikan sesi ini milik dosen yang login
    const sesi = await prisma.jadwalSesi.findUnique({
      where: { id },
      include: {
        jadwalTemplate: {
          include: {
            kelasMataKuliah: true
          }
        }
      }
    });

    if (!sesi || sesi.jadwalTemplate.kelasMataKuliah.dosenId !== session.userId) {
      return NextResponse.json({ success: false, error: "Forbidden: Sesi ini bukan milik Anda." }, { status: 403 });
    }

    // Lakukan override untuk tiap mahasiswa di dalam array
    for (const mhsId of mahasiswaIds) {
      // Cek apakah data absensi sudah ada
      const existingAbsen = await prisma.absensi.findFirst({
        where: {
          jadwalSesiId: id,
          mahasiswaId: mhsId
        }
      });

      if (existingAbsen) {
        // Jika statusnya sama, tidak perlu diupdate
        if (existingAbsen.status === statusBaru) continue;

        // Update status dan catat di AbsensiLog
        await prisma.$transaction([
          prisma.absensi.update({
            where: { id: existingAbsen.id },
            data: { status: statusBaru, metode: MetodeAbsensi.MANUAL_DOSEN }
          }),
          prisma.absensiLog.create({
            data: {
              absensiId: existingAbsen.id,
              statusLama: existingAbsen.status,
              statusBaru: statusBaru as StatusAbsensi,
              changedBy: session.userId
            }
          })
        ]);
      } else {
        // Jika belum absen sama sekali (contoh: diubah sebelum cron jalan), buat baru.
        // Walau harusnya nunggu cron, dosen bebas mengisi Izin/Sakit kapan saja saat sesi berlangsung.
        const newAbsen = await prisma.absensi.create({
          data: {
            jadwalSesiId: id,
            mahasiswaId: mhsId,
            status: statusBaru as StatusAbsensi,
            metode: MetodeAbsensi.MANUAL_DOSEN,
          }
        });
        
        // Buat log (statusLama = ALPHA secara logis, tapi di db kita taruh null atau ambil default. 
        // Namun karena skema kita statusLama wajid, kita anggap asalnya ALPHA jika baru dibuat manual)
        await prisma.absensiLog.create({
          data: {
            absensiId: newAbsen.id,
            statusLama: StatusAbsensi.ALPHA, 
            statusBaru: statusBaru as StatusAbsensi,
            changedBy: session.userId
          }
        });
      }
    }

    return NextResponse.json({ success: true, message: "Berhasil menyimpan perubahan status absensi." });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
