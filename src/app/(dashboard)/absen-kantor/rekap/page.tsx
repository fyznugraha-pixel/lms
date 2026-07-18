"use client";

import { useState, useEffect } from "react";

export default function KaryawanRekapPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const currentDate = new Date();
  const [bulan, setBulan] = useState(currentDate.getMonth() + 1);
  const [tahun, setTahun] = useState(currentDate.getFullYear());

  const fetchRekap = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/absen-kantor/rekap?mode=user&bulan=${bulan}&tahun=${tahun}`);
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

  const formatTanggal = (isoString: string) => {
    return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(isoString));
  };
  
  const formatJam = (isoString: string | null) => {
    if (!isoString) return "--:--";
    return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(isoString));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rekapitulasi Kehadiran</h1>
          <p className="text-gray-500 mt-1">Laporan bulanan absensi pribadi Anda.</p>
        </div>
        <div className="flex gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
          <select 
            value={bulan} 
            onChange={(e) => setBulan(parseInt(e.target.value))}
            className="px-4 py-2 border-none bg-gray-50 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-700"
          >
            {Array.from({length: 12}, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date(2000, m - 1, 1))}</option>
            ))}
          </select>
          <select 
            value={tahun} 
            onChange={(e) => setTahun(parseInt(e.target.value))}
            className="px-4 py-2 border-none bg-gray-50 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-700"
          >
            {[tahun - 1, tahun, tahun + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-gray-500">Memuat laporan...</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Hadir</span>
              <span className="text-3xl font-black text-green-600">{data.ringkasan.hadir + data.ringkasan.terlambat}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Sakit</span>
              <span className="text-3xl font-black text-red-500">{data.ringkasan.sakit}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Izin</span>
              <span className="text-3xl font-black text-blue-500">{data.ringkasan.izin}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Alpha</span>
              <span className="text-3xl font-black text-gray-900">{data.ringkasan.alpha}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Incomplete</span>
              <span className="text-3xl font-black text-orange-500">{data.ringkasan.incomplete}</span>
            </div>
            <div className="bg-blue-600 p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center text-white">
              <span className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">Total Jam</span>
              <span className="text-3xl font-black">{Math.floor(data.ringkasan.totalDurasiMenit / 60)}<span className="text-lg">j</span></span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Rincian Hari per Hari</h2>
            </div>
            {data.detail.length === 0 ? (
              <div className="p-12 text-center text-gray-500">Tidak ada data kehadiran di bulan ini.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                      <th className="px-6 py-4 font-semibold">Tanggal</th>
                      <th className="px-6 py-4 font-semibold">Masuk</th>
                      <th className="px-6 py-4 font-semibold">Pulang</th>
                      <th className="px-6 py-4 font-semibold">Durasi</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.detail.map((h: any) => (
                      <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{formatTanggal(h.tanggal)}</td>
                        <td className="px-6 py-4 text-gray-700">{formatJam(h.waktuAbsenMasuk)}</td>
                        <td className="px-6 py-4 text-gray-700">{formatJam(h.waktuAbsenPulang)}</td>
                        <td className="px-6 py-4">
                          {h.durasiKerja ? (
                            <span className="font-medium text-gray-900">
                              {Math.floor(h.durasiKerja / 60)}j {h.durasiKerja % 60}m
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {h.isIncomplete ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-orange-50 text-orange-700">INCOMPLETE</span>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                              h.status === 'HADIR' ? 'bg-green-50 text-green-700' :
                              h.status === 'TERLAMBAT' ? 'bg-yellow-50 text-yellow-700' :
                              h.status === 'IZIN' ? 'bg-blue-50 text-blue-700' :
                              h.status === 'SAKIT' ? 'bg-red-50 text-red-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {h.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
