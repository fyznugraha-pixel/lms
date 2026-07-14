import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { hitungJarakMeter } from "@/lib/geo";

const scanSchema = z.object({
  sesiId: z.string().uuid("ID Sesi tidak valid"),
  token: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  
  if (session.userRole !== "MAHASISWA") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const validation = scanSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.message }, { status: 400 });
    }

    const { sesiId, token, latitude, longitude } = validation.data;

    // 1. Validasi Token QR
    const qrToken = await prisma.qRToken.findFirst({
      where: {
        jadwalSesiId: sesiId,
        token: token,
      },
    });

    if (!qrToken) {
      return NextResponse.json({ success: false, error: "QR Code tidak dikenali." }, { status: 400 });
    }

    if (qrToken.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: "QR Code sudah kedaluwarsa. Silakan scan ulang." }, { status: 400 });
    }

    // 2. Ambil data Sesi, Kelas, dan Kampus
    const sesi = await prisma.jadwalSesi.findUnique({
      where: { id: sesiId },
      include: {
        jadwalTemplate: {
          include: {
            kelasMataKuliah: {
              include: {
                mataKuliah: {
                  include: {
                    kampus: true
                  }
                },
                kelas: {
                  include: {
                    enrollments: {
                      where: { mahasiswaId: session.userId! }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!sesi) {
      return NextResponse.json({ success: false, error: "Sesi perkuliahan tidak ditemukan." }, { status: 404 });
    }

    const s = sesi as any; // Cast as any for deep relations to bypass TS inference limits

    if (s.status !== "ONGOING") {
      return NextResponse.json({ success: false, error: "Sesi perkuliahan sedang tidak berlangsung." }, { status: 400 });
    }

    // 3. Pastikan mahasiswa terdaftar di kelas ini
    if (s.jadwalTemplate.kelasMataKuliah.kelas.enrollments.length === 0) {
      return NextResponse.json({ success: false, error: "Anda tidak terdaftar di kelas ini." }, { status: 403 });
    }

    // 4. Validasi Geofencing
    const kampus = s.jadwalTemplate.kelasMataKuliah.mataKuliah.kampus;
    if (!kampus.latitude || !kampus.longitude) {
      return NextResponse.json({ success: false, error: "Koordinat kampus belum diatur. Absensi tidak dapat dilakukan." }, { status: 500 });
    }

    const jarakMeter = Math.round(hitungJarakMeter(latitude, longitude, kampus.latitude, kampus.longitude));
    const radiusMaks = kampus.radiusMeter || 100;
    const isLocationValid = jarakMeter <= radiusMaks;

    if (!isLocationValid) {
      return NextResponse.json({ 
        success: false, 
        error: `Posisi Anda berada di luar area kampus. Jarak Anda: ${jarakMeter}m (Maks: ${radiusMaks}m).` 
      }, { status: 403 });
    }

    // 5. Catat Absensi
    // Cek dulu apakah sudah absen
    const existingAbsensi = await prisma.absensi.findFirst({
      where: {
        mahasiswaId: session.userId!,
        jadwalSesiId: sesiId
      }
    });

    if (existingAbsensi) {
      return NextResponse.json({ success: true, message: "Anda sudah melakukan absensi untuk sesi ini." });
    }

    await prisma.absensi.create({
      data: {
        mahasiswaId: session.userId!,
        jadwalSesiId: sesiId,
        status: "HADIR",
        metode: "QR",
        latitudeScan: latitude,
        longitudeScan: longitude,
        jarakMeter: jarakMeter,
        isLocationValid: isLocationValid
      }
    });

    return NextResponse.json({ success: true, message: "Absensi berhasil dicatat." });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
