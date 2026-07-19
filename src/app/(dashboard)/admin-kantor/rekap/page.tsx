"use client";

import { useState, useEffect } from "react";
import CustomDropdown from "@/components/CustomDropdown";
import { useDictionary, useLocale } from "@/hooks/useDictionary";

export default function AdminRekapPage() {
  const dict = useDictionary();
  const locale = useLocale();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const currentDate = new Date();
  const [bulan, setBulan] = useState(currentDate.getMonth() + 1);
  const [tahun, setTahun] = useState(currentDate.getFullYear());

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
    
    // Direct link to the backend endpoint which handles the Export Excel and ExportLog
    window.open(`/api/admin-kantor/export?bulan=${bulan}&tahun=${tahun}`, "_blank");
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
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            {dict.adminKantor?.rekap?.btnExport || "Export XLSX"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">{dict.adminKantor?.rekap?.listTitle || "Data Ringkasan Bulan Ini"}</h2>
        </div>
        
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">{dict.adminKantor?.rekap?.loading || "Memuat data rekapitulasi..."}</div>
        ) : !data || data.ringkasan.length === 0 ? (
          <div className="p-12 text-center text-gray-500">{dict.adminKantor?.rekap?.noData || "Belum ada data kehadiran untuk bulan ini."}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px] whitespace-nowrap">
              <thead>
                <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="px-6 py-4 font-semibold">{dict.adminKantor?.rekap?.colEmployee || "Karyawan"}</th>
                  <th className="px-6 py-4 font-semibold text-center text-green-600">{dict.adminKantor?.rekap?.colPresent || "Hadir"}</th>
                  <th className="px-6 py-4 font-semibold text-center text-blue-600">{dict.adminKantor?.rekap?.colLeave || "Izin"}</th>
                  <th className="px-6 py-4 font-semibold text-center text-red-600">{dict.adminKantor?.rekap?.colSick || "Sakit"}</th>
                  <th className="px-6 py-4 font-semibold text-center text-gray-900">{dict.adminKantor?.rekap?.colAlpha || "Alpha"}</th>
                  <th className="px-6 py-4 font-semibold text-center text-orange-600">{dict.adminKantor?.rekap?.colIncomplete || "Incomplete"}</th>
                  <th className="px-6 py-4 font-semibold text-right text-indigo-600">{dict.adminKantor?.rekap?.colTotalHours || "Total Jam"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.ringkasan.map((k: any) => (
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
                    <td className="px-6 py-4 text-right font-bold text-indigo-600">
                      {Math.floor(k.totalDurasiMenit / 60)}{dict.adminKantor?.rekap?.hourSymbol || "j"} {k.totalDurasiMenit % 60}{dict.adminKantor?.rekap?.minuteSymbol || "m"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
