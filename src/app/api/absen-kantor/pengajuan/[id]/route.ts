import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

const approveSchema = z.object({
  status: z.enum(['DISETUJUI', 'DITOLAK']),
  catatanApproval: z.string().optional(),
  jamPulangKoreksi: z.string().optional(), // HH:mm format, only for KLARIFIKASI
});

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || !['ADMIN_KANTOR', 'PENANGGUNG_JAWAB_ABSEN', 'SUPER_ADMIN'].includes(payload.role as string)) {
    return null;
  }
  return payload;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = approveSchema.parse(body);

    const pengajuan = await prisma.pengajuanIzin.findUnique({
      where: { id }
    });

    if (!pengajuan) {
      return NextResponse.json({ success: false, error: 'Pengajuan tidak ditemukan.' }, { status: 404 });
    }

    if (pengajuan.status !== 'PENDING') {
      return NextResponse.json({ success: false, error: 'Pengajuan sudah diproses sebelumnya.' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedPengajuan = await tx.pengajuanIzin.update({
        where: { id },
        data: {
          status: data.status,
          catatanApproval: data.catatanApproval,
          diprosesOlehId: admin.userId as string,
        }
      });

      if (data.status === 'DISETUJUI') {
        if (pengajuan.jenis === 'KLARIFIKASI_ABSEN') {
          const absensi = await tx.absensiKantor.findUnique({
            where: {
              karyawanId_tanggal: {
                karyawanId: pengajuan.karyawanId,
                tanggal: pengajuan.tanggalMulai,
              }
            }
          });

          if (absensi && absensi.isIncomplete) {
            let correctedTime = null;
            let durasiKerja = null;

            if (data.jamPulangKoreksi && absensi.waktuAbsenMasuk) {
              const [hours, minutes] = data.jamPulangKoreksi.split(':');
              correctedTime = new Date(absensi.waktuAbsenMasuk);
              correctedTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

              const diffMs = correctedTime.getTime() - new Date(absensi.waktuAbsenMasuk).getTime();
              durasiKerja = Math.max(0, Math.floor(diffMs / 60000));
            } else {
              correctedTime = new Date(pengajuan.tanggalMulai);
              correctedTime.setHours(17, 0, 0, 0);
            }

            await tx.absensiKantor.update({
              where: { id: absensi.id },
              data: {
                waktuAbsenPulang: correctedTime,
                durasiKerja,
                isIncomplete: false,
                status: absensi.status === 'ALPHA' ? 'HADIR' : absensi.status
              }
            });
          }
        } else if (pengajuan.jenis === 'IZIN' || pengajuan.jenis === 'SAKIT') {
          // Buat record absen SAKIT/IZIN
          let currentDate = new Date(pengajuan.tanggalMulai);
          const endDate = new Date(pengajuan.tanggalSelesai);
          
          while (currentDate <= endDate) {
            const existingAbsen = await tx.absensiKantor.findUnique({
              where: {
                karyawanId_tanggal: {
                  karyawanId: pengajuan.karyawanId,
                  tanggal: currentDate
                }
              }
            });

            if (!existingAbsen || existingAbsen.status === 'ALPHA') {
              if (existingAbsen) {
                await tx.absensiKantor.update({
                  where: { id: existingAbsen.id },
                  data: {
                    status: pengajuan.jenis,
                    metode: 'PENGAJUAN_KARYAWAN',
                    isIncomplete: false
                  }
                });
              } else {
                await tx.absensiKantor.create({
                  data: {
                    karyawanId: pengajuan.karyawanId,
                    tanggal: currentDate,
                    status: pengajuan.jenis,
                    metode: 'PENGAJUAN_KARYAWAN',
                    isIncomplete: false
                  }
                });
              }
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      }

      return updatedPengajuan;
    });

    return NextResponse.json({ success: true, data: result, message: `Pengajuan berhasil di-${data.status.toLowerCase()}` });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
