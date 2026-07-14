import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session.userRole !== "DOSEN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;

    const sesi = await prisma.jadwalSesi.findUnique({
      where: { id },
      include: {
        jadwalTemplate: {
          include: {
            kelasMataKuliah: {
              include: {
                mataKuliah: true,
                kelas: {
                  include: {
                    enrollments: {
                      include: {
                        user: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        absensi: {
          include: { user: true }
        }
      }
    });

    if (!sesi) {
      return NextResponse.json({ success: false, error: "Sesi tidak ditemukan" }, { status: 404 });
    }

    // Pastikan dosen yang mengakses adalah pengampu sesi ini
    if (sesi.jadwalTemplate.kelasMataKuliah.dosenId !== session.userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Format data mahasiswa: gabungkan enrollment dan absensi
    const enrolledStudents = sesi.jadwalTemplate.kelasMataKuliah.kelas.enrollments.map(e => e.user);
    
    const studentsWithAbsensi = enrolledStudents.map(student => {
      const abs = sesi.absensi.find(a => a.mahasiswaId === student.id);
      return {
        id: student.id,
        nim: student.nim,
        email: student.email,
        absensi: abs || null,
        statusLabel: abs ? abs.status : "BELUM_ABSEN"
      };
    });

    // Urutkan berdasarkan NIM
    studentsWithAbsensi.sort((a, b) => (a.nim || "").localeCompare(b.nim || ""));

    return NextResponse.json({ 
      success: true, 
      data: {
        sesi,
        students: studentsWithAbsensi
      } 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
