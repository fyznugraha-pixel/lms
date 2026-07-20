"use client";

import { useState, useEffect } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import CustomDropdown from "@/components/CustomDropdown";
import { useDictionary, useLocale } from "@/hooks/useDictionary";
import { Search } from "lucide-react";

export default function AdminRekapPage() {
  const dict = useDictionary();
  const locale = useLocale();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const currentDate = new Date();
  const [bulan, setBulan] = useState(currentDate.getMonth() + 1);
  const [tahun, setTahun] = useState(currentDate.getFullYear());
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, bulan, tahun]);

  const fetchRekap = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/absen-kantor/rekap?mode=admin&bulan=${bulan}&tahun=${tahun}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Gagal mengambil data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRekap();
  }, [bulan, tahun]);

  const handleExportXLSX = async () => {
    if (!data || !data.ringkasan) return;
    
    // Inisialisasi Workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sistem Absensi";
    workbook.created = new Date();
    
    // Buat Worksheet
    const worksheet = workbook.addWorksheet(`Rekap ${bulan}-${tahun}`, {
      views: [{ state: 'frozen', ySplit: 5 }]
    });

    // --- TEMPLATE STYLING ---

    // Judul Laporan
    worksheet.mergeCells('A1:J1');
    worksheet.getCell('A1').value = "REKAPITULASI KEHADIRAN KARYAWAN";
    worksheet.getCell('A1').font = { name: 'Arial', family: 4, size: 16, bold: true };
    worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };

    // Info Periode
    worksheet.mergeCells('A2:J2');
    worksheet.getCell('A2').value = `Periode: Bulan ${bulan} Tahun ${tahun}`;
    worksheet.getCell('A2').font = { name: 'Arial', family: 4, size: 12, italic: true };
    worksheet.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center' };

    // Jarak
    worksheet.mergeCells('A3:J3');

    // Kolom Header
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

    // Tambah Header ke baris ke-4 dan styling
    const headerRow = worksheet.getRow(4);
    headerRow.values = columns.map(c => c.header);
    headerRow.height = 25;
    
    headerRow.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F4E78' } // Biru gelap
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Isi Data
    data.ringkasan.forEach((k: any, index: number) => {
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

      // Styling Data Row
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { vertical: 'middle' };
        
        // Tengah-tengah untuk kolom angka
        if ([1, 5, 6, 7, 8, 9, 10].includes(colNumber)) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      });

      // Warna zebra untuk baris ganjil/genap (mulai dari baris 5)
      if (row.number % 2 !== 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
        });
      }
    });

    // Tulis ke buffer dan download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `Rekap_Absensi_${bulan}_${tahun}.xlsx`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 w-full min-w-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{dict.adminKantor?.rekap?.title || "Rekapitulasi Karyawan"}</h1>
          <p className="text-gray-500 mt-1">{dict.adminKantor?.rekap?.subtitle || "Pantau dan ekspor laporan kehadiran seluruh karyawan."}</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-3">
          <CustomDropdown
            value={bulan}
            onChange={(val) => setBulan(Number(val))}
            options={Array.from({length: 12}, (_, i) => i + 1).map(m => ({
              value: m,
              label: new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2000, m - 1, 1))
            }))}
            className="w-40 shadow-sm"
          />
          <CustomDropdown
            value={tahun}
            onChange={(val) => setTahun(Number(val))}
            options={[tahun - 1, tahun, tahun + 1].map(y => ({
              value: y,
              label: y.toString()
            }))}
            className="w-32 shadow-sm"
          />
        </div>
          <button 
            onClick={handleExportXLSX}
            disabled={!data || data.ringkasan.length === 0}
            className="flex items-center gap-2 bg-[#394887] hover:bg-[#2D3A6E] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            {dict.adminKantor?.rekap?.btnExport || "Export XLSX"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900 w-full md:w-auto">{dict.adminKantor?.rekap?.listTitle || "Data Ringkasan Bulan Ini"}</h2>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari karyawan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#394887] focus:border-[#394887] bg-white outline-none transition-all"
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">{dict.adminKantor?.rekap?.loading || "Memuat data rekapitulasi..."}</div>
        ) : !data || data.ringkasan.length === 0 ? (
          <div className="p-12 text-center text-gray-500">{dict.adminKantor?.rekap?.noData || "Belum ada data kehadiran untuk bulan ini."}</div>
        ) : (() => {
          const filtered = data.ringkasan.filter((k: any) => 
            (k.namaLengkap || "").toLowerCase().includes(search.toLowerCase()) || 
            (k.email || "").toLowerCase().includes(search.toLowerCase())
          );
          const totalPages = Math.ceil(filtered.length / itemsPerPage);
          const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

          if (filtered.length === 0) return <div className="p-12 text-center text-gray-500">Tidak ada data yang cocok dengan pencarian "{search}".</div>;

          return (
          <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px] whitespace-nowrap">
              <thead>
                <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="px-6 py-4 font-semibold">{dict.adminKantor?.rekap?.colEmployee || "Karyawan"}</th>
                  <th className="px-6 py-4 font-semibold text-center text-green-600">{dict.adminKantor?.rekap?.colPresent || "Hadir"}</th>
                  <th className="px-6 py-4 font-semibold text-center text-blue-600">{dict.adminKantor?.rekap?.colLeave || "Izin"}</th>
                  <th className="px-6 py-4 font-semibold text-center text-red-600">{dict.adminKantor?.rekap?.colSick || "Sakit"}</th>
                  <th className="px-6 py-4 font-semibold text-center text-gray-900">{dict.adminKantor?.rekap?.colAlpha || "Alpha"}</th>
                  <th className="px-6 py-4 font-semibold text-center text-orange-600">{dict.adminKantor?.rekap?.colIncomplete || "Incomplete"}</th>
                  <th className="px-6 py-4 font-semibold text-right text-[#394887]">{dict.adminKantor?.rekap?.colTotalHours || "Total Jam"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.map((k: any) => (
                  <tr key={k.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{k.namaLengkap || "-"}</div>
                      <div className="text-xs text-gray-500">{k.email}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-green-600">{k.hadir + k.terlambat}</td>
                    <td className="px-6 py-4 text-center font-bold text-blue-600">{k.izin}</td>
                    <td className="px-6 py-4 text-center font-bold text-red-600">{k.sakit}</td>
                    <td className="px-6 py-4 text-center font-bold text-gray-900">{k.alpha}</td>
                    <td className="px-6 py-4 text-center font-bold text-orange-600">{k.incomplete}</td>
                    <td className="px-6 py-4 text-right font-bold text-[#394887]">
                      {Math.floor(k.totalDurasiMenit / 60)}{dict.adminKantor?.rekap?.hourSymbol || "j"} {k.totalDurasiMenit % 60}{dict.adminKantor?.rekap?.minuteSymbol || "m"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden flex flex-col divide-y divide-gray-100">
            {paginatedData.map((k: any) => (
              <div key={k.id} className="p-4 flex flex-col gap-3">
                <div>
                  <div className="font-bold text-gray-900 text-lg">{k.namaLengkap || "-"}</div>
                  <div className="text-sm text-gray-500">{k.email}</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-50 rounded-xl p-2 text-center border border-gray-100">
                    <div className="text-xs text-gray-500 font-medium mb-1">{dict.adminKantor?.rekap?.colPresent || "Hadir"}</div>
                    <div className="font-bold text-green-600 text-xl">{k.hadir + k.terlambat}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2 text-center border border-gray-100">
                    <div className="text-xs text-gray-500 font-medium mb-1">{dict.adminKantor?.rekap?.colLeave || "Izin"}</div>
                    <div className="font-bold text-blue-600 text-xl">{k.izin}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2 text-center border border-gray-100">
                    <div className="text-xs text-gray-500 font-medium mb-1">{dict.adminKantor?.rekap?.colSick || "Sakit"}</div>
                    <div className="font-bold text-red-600 text-xl">{k.sakit}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2 text-center border border-gray-100">
                    <div className="text-xs text-gray-500 font-medium mb-1">{dict.adminKantor?.rekap?.colAlpha || "Alpha"}</div>
                    <div className="font-bold text-gray-900 text-xl">{k.alpha}</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2 text-center border border-gray-100">
                    <div className="text-xs text-gray-500 font-medium mb-1">{dict.adminKantor?.rekap?.colIncomplete || "Incomp"}</div>
                    <div className="font-bold text-orange-600 text-xl">{k.incomplete}</div>
                  </div>
                  <div className="bg-[#394887]/5 rounded-xl p-2 text-center border border-[#394887]/10 flex flex-col justify-center">
                    <div className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wider">{dict.adminKantor?.rekap?.colTotalHours || "Jam"}</div>
                    <div className="font-bold text-[#394887] text-sm">
                      {Math.floor(k.totalDurasiMenit / 60)}{dict.adminKantor?.rekap?.hourSymbol || "j"} {k.totalDurasiMenit % 60}{dict.adminKantor?.rekap?.minuteSymbol || "m"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50/50">
              <span className="text-sm text-gray-500">
                Halaman <span className="font-bold text-gray-900">{currentPage}</span> dari <span className="font-bold text-gray-900">{totalPages}</span>
              </span>
              <div className="flex gap-2">
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="px-3 py-1 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-bold"
                >
                  Prev
                </button>
                <button 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="px-3 py-1 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-bold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          </>
          );
        })()}
      </div>
    </div>
  );
}
