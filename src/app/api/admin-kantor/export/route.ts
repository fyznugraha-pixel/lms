import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import ExcelJS from 'exceljs';

async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session_token')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || !['ADMIN_KANTOR', 'SUPER_ADMIN'].includes(payload.role as string)) {
    return null;
  }
  return payload;
}

function applyRealtimeDuration(absensiList: any[]) {
  const today = new Date();
  for (const absen of absensiList) {
    if (!absen.durasiKerja && absen.isIncomplete && absen.waktuAbsenMasuk) {
      const absenDate = new Date(absen.tanggal);
      if (
        today.getFullYear() === absenDate.getFullYear() &&
        today.getMonth() === absenDate.getMonth() &&
        today.getDate() === absenDate.getDate()
      ) {
        const diffMs = today.getTime() - new Date(absen.waktuAbsenMasuk).getTime();
        absen.durasiKerja = Math.max(0, Math.floor(diffMs / 60000));
      }
    }
  }
}

export async function GET(request: Request) {
  try {
    const admin = await checkAuth();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bulan = parseInt(searchParams.get('bulan') || (new Date().getMonth() + 1).toString());
    const tahun = parseInt(searchParams.get('tahun') || new Date().getFullYear().toString());

    // 1. Ambil Data
    const startDate = new Date(tahun, bulan - 1, 1);
    const endDate = new Date(tahun, bulan, 0, 23, 59, 59, 999);

    const absensiList = await prisma.absensiKantor.findMany({
      where: { tanggal: { gte: startDate, lte: endDate } },
      include: { karyawan: { select: { id: true, namaLengkap: true, email: true } } },
      orderBy: { tanggal: 'desc' }
    });

    applyRealtimeDuration(absensiList);

    const rekapKaryawan: Record<string, any> = {};
    for (const absen of absensiList) {
      const kId = absen.karyawanId;
      if (!rekapKaryawan[kId]) {
        rekapKaryawan[kId] = {
          id: kId,
          namaLengkap: absen.karyawan.namaLengkap,
          email: absen.karyawan.email,
          hadir: 0, terlambat: 0, izin: 0, sakit: 0, alpha: 0, incomplete: 0, totalDurasiMenit: 0,
        };
      }
      const rekap = rekapKaryawan[kId];
      switch (absen.status) {
        case 'HADIR': rekap.hadir++; break;
        case 'TERLAMBAT': rekap.terlambat++; break;
        case 'IZIN': rekap.izin++; break;
        case 'SAKIT': rekap.sakit++; break;
        case 'ALPHA': rekap.alpha++; break;
      }
      if (absen.isIncomplete) rekap.incomplete++;
      if (absen.durasiKerja) rekap.totalDurasiMenit += absen.durasiKerja;
    }

    const dataRingkasan = Object.values(rekapKaryawan);

    // 2. Generate Excel
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sistem Absensi";
    workbook.created = new Date();
    
    const worksheet = workbook.addWorksheet(`Rekap ${bulan}-${tahun}`, {
      views: [{ state: 'frozen', ySplit: 5 }]
    });

    worksheet.mergeCells('A1:J1');
    worksheet.getCell('A1').value = "REKAPITULASI KEHADIRAN KARYAWAN";
    worksheet.getCell('A1').font = { name: 'Arial', family: 4, size: 16, bold: true };
    worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells('A2:J2');
    worksheet.getCell('A2').value = `Periode: Bulan ${bulan} Tahun ${tahun}`;
    worksheet.getCell('A2').font = { name: 'Arial', family: 4, size: 12, italic: true };
    worksheet.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells('A3:J3');

    const columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'ID Karyawan', key: 'id', width: 25 },
      { header: 'Nama Lengkap', key: 'nama', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Hadir', key: 'hadir', width: 10 },
      { header: 'Terlambat', key: 'terlambat', width: 12 },
      { header: 'Sakit', key: 'sakit', width: 10 },
      { header: 'Izin', key: 'izin', width: 10 },
      { header: 'Alpha / Incomplete', key: 'alpha_incomplete', width: 20 },
      { header: 'Total Jam Kerja', key: 'jam_kerja', width: 18 }
    ];
    worksheet.columns = columns;

    const headerRow = worksheet.getRow(4);
    headerRow.values = columns.map(c => c.header);
    headerRow.height = 25;
    
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    dataRingkasan.forEach((k: any, index: number) => {
      const jam = Math.floor(k.totalDurasiMenit / 60);
      const menit = k.totalDurasiMenit % 60;
      const row = worksheet.addRow({
        no: index + 1,
        id: k.id,
        nama: k.namaLengkap || "-",
        email: k.email,
        hadir: k.hadir,
        terlambat: k.terlambat,
        sakit: k.sakit,
        izin: k.izin,
        alpha_incomplete: `A: ${k.alpha} | I: ${k.incomplete}`,
        jam_kerja: `${jam}j ${menit}m`
      });

      row.eachCell((cell, colNumber) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.alignment = { vertical: 'middle' };
        if ([1, 5, 6, 7, 8, 9, 10].includes(colNumber)) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      });

      if (row.number % 2 !== 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();

    // 3. Catat ke ExportLog
    await prisma.exportLog.create({
      data: {
        exportedById: admin.userId as string,
        bulan,
        tahun
      }
    });

    // 4. Return file buffer
    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Rekap_Absensi_${bulan}_${tahun}.xlsx"`
      }
    });

  } catch (error) {
    console.error('Export Excel Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
