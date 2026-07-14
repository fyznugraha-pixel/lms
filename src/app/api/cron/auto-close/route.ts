import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { StatusAbsensi, MetodeAbsensi } from "@prisma/client";

export async function GET(req: Request) {
  // Catatan: Di environment production (misal Vercel), Anda harus mengamankan endpoint ini
  // menggunakan process.env.CRON_SECRET agar tidak bisa di-trigger sembarang orang.
  // Untuk keperluan development/simulator ini, kita buka public agar mudah ditest.

  try {
    const now = new Date();
    const currentUTCHours = now.getUTCHours();
    const currentUTCMinutes = now.getUTCMinutes();

    // 1. Ambil semua sesi ONGOING beserta data pendaftar (enrollment) dan absensinya
    const ongoingSessions = await prisma.jadwalSesi.findMany({
      where: { status: "ONGOING" },
      include: {
        jadwalTemplate: {
          include: {
            kelasMataKuliah: {
              include: {
                kelas: {
                  include: { enrollments: true }
                }
              }
            }
          }
        },
        absensi: true
      }
    });

    let closedCount = 0;
    let alphaCount = 0;

    for (const sesi of ongoingSessions) {
      // Cek apakah sesi sudah berada di masa lalu (hari sebelumnya)
      const sessionDate = new Date(sesi.tanggal);
      const isPastDay = 
        sessionDate.getUTCFullYear() < now.getUTCFullYear() || 
        (sessionDate.getUTCFullYear() === now.getUTCFullYear() && sessionDate.getUTCMonth() < now.getUTCMonth()) || 
        (sessionDate.getUTCFullYear() === now.getUTCFullYear() && sessionDate.getUTCMonth() === now.getUTCMonth() && sessionDate.getUTCDate() < now.getUTCDate());
                        
      // Cek apakah waktu sudah melewati jamSelesai di hari yang sama
      const endHours = sesi.jamSelesai.getUTCHours();
      const endMins = sesi.jamSelesai.getUTCMinutes();
      const isPastTime = currentUTCHours > endHours || (currentUTCHours === endHours && currentUTCMinutes >= endMins);

      if (isPastDay || isPastTime) {
        // Tutup sesi menjadi SELESAI
        await prisma.jadwalSesi.update({
          where: { id: sesi.id },
          data: { status: "SELESAI" }
        });
        closedCount++;

        // Auto-Alpha mahasiswa yang tidak ada di daftar absensi
        const enrollments = sesi.jadwalTemplate.kelasMataKuliah.kelas.enrollments;
        const absensiRecords = sesi.absensi;
        const absensiMahasiswaIds = new Set(absensiRecords.map(a => a.mahasiswaId));

        const alphaToCreate = enrollments
          .filter(e => !absensiMahasiswaIds.has(e.mahasiswaId))
          .map(e => ({
            mahasiswaId: e.mahasiswaId,
            jadwalSesiId: sesi.id,
            status: StatusAbsensi.ALPHA,
            metode: MetodeAbsensi.AUTO_SYSTEM,
          }));

        if (alphaToCreate.length > 0) {
          await prisma.absensi.createMany({
            data: alphaToCreate
          });
          alphaCount += alphaToCreate.length;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cron job dieksekusi. Menutup ${closedCount} sesi, mencatat ${alphaCount} ALPHA.` 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
