"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type AbsensiHariIni = {
  waktuAbsenMasuk: string | null;
  waktuAbsenPulang: string | null;
  status: string;
  durasiKerja: number | null;
} | null;

type HistoriAbsen = {
  id: string;
  tanggal: string;
  waktuAbsenMasuk: string | null;
  waktuAbsenPulang: string | null;
  status: string;
  durasiKerja: number | null;
  isIncomplete: boolean;
};

export default function KaryawanDashboard() {
  const [data, setData] = useState<{
    absensiHariIni: AbsensiHariIni;
    bisaAbsenMasuk: boolean;
    bisaAbsenPulang: boolean;
    histori: HistoriAbsen[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Modal Klarifikasi
  const [isKlarifikasiModalOpen, setIsKlarifikasiModalOpen] = useState(false);
  const [klarifikasiDate, setKlarifikasiDate] = useState("");
  const [klarifikasiAlasan, setKlarifikasiAlasan] = useState("");

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/absen-kantor/absen");
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
    fetchData();
  }, []);

  const handleAbsen = async (jenisAbsen: "MASUK" | "PULANG") => {
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/absen-kantor/absen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisAbsen })
      });
      const result = await res.json();
      if (result.success) {
        alert(result.message);
        fetchData(); // Refresh data
      } else {
        alert(result.error);
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem saat melakukan absen.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const formatJam = (isoString: string | null) => {
    if (!isoString) return "--:--";
    return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(isoString));
  };

  const formatTanggal = (isoString: string) => {
    return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(isoString));
  };

  const handleKlarifikasi = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    try {
      const res = await fetch("/api/absen-kantor/pengajuan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          jenis: 'KLARIFIKASI_ABSEN',
          tanggalMulai: klarifikasiDate, 
          tanggalSelesai: klarifikasiDate, 
          alasan: klarifikasiAlasan 
        })
      });
      const result = await res.json();
      if (result.success) {
        alert(result.message);
        setIsKlarifikasiModalOpen(false);
        setKlarifikasiAlasan("");
        fetchData();
      } else {
        alert(result.error);
      }
    } catch (error) {
      alert("Kesalahan sistem.");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header & Clock */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Absensi</h1>
          <p className="text-gray-500 mt-1">
            {new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(currentTime)}
          </p>
        </div>
        <div className="mt-4 md:mt-0 text-center md:text-right">
          <div className="text-4xl font-black text-blue-600 tracking-tight">
            {new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(currentTime)}
          </div>
          <p className="text-sm text-gray-400 font-medium uppercase tracking-widest mt-1">Waktu Server (Lokal)</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center p-12 text-gray-500">Memuat data dashboard...</div>
      ) : (
        <>
          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kartu Absen Masuk */}
            <div className={`rounded-2xl p-6 shadow-sm border ${data?.absensiHariIni?.waktuAbsenMasuk ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'} transition-all`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full ${data?.absensiHariIni?.waktuAbsenMasuk ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Absen Masuk</h3>
                </div>
                {data?.absensiHariIni?.waktuAbsenMasuk && (
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Selesai</span>
                )}
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-500 font-medium">Jam Masuk Anda:</p>
                <p className={`text-3xl font-black ${data?.absensiHariIni?.waktuAbsenMasuk ? 'text-green-700' : 'text-gray-900'}`}>
                  {formatJam(data?.absensiHariIni?.waktuAbsenMasuk || null)}
                </p>
              </div>

              {!data?.absensiHariIni?.waktuAbsenMasuk && (
                <button
                  onClick={() => handleAbsen("MASUK")}
                  disabled={!data?.bisaAbsenMasuk || isActionLoading}
                  className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-md ${
                    data?.bisaAbsenMasuk 
                      ? "bg-blue-600 hover:bg-blue-700 hover:shadow-lg" 
                      : "bg-gray-300 cursor-not-allowed shadow-none"
                  }`}
                >
                  {isActionLoading ? "Memproses..." : data?.bisaAbsenMasuk ? "Klik untuk Absen Masuk" : "Sesi Masuk Belum Dibuka"}
                </button>
              )}
            </div>

            {/* Kartu Absen Pulang */}
            <div className={`rounded-2xl p-6 shadow-sm border ${data?.absensiHariIni?.waktuAbsenPulang ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100'} transition-all`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full ${data?.absensiHariIni?.waktuAbsenPulang ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Absen Pulang</h3>
                </div>
                {data?.absensiHariIni?.waktuAbsenPulang && (
                  <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Selesai</span>
                )}
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-500 font-medium">Jam Pulang Anda:</p>
                <p className={`text-3xl font-black ${data?.absensiHariIni?.waktuAbsenPulang ? 'text-indigo-700' : 'text-gray-900'}`}>
                  {formatJam(data?.absensiHariIni?.waktuAbsenPulang || null)}
                </p>
              </div>

              {!data?.absensiHariIni?.waktuAbsenPulang && (
                <button
                  onClick={() => handleAbsen("PULANG")}
                  disabled={!data?.bisaAbsenPulang || !data?.absensiHariIni?.waktuAbsenMasuk || isActionLoading}
                  className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-md ${
                    !data?.absensiHariIni?.waktuAbsenMasuk 
                      ? "bg-gray-300 cursor-not-allowed shadow-none"
                      : data?.bisaAbsenPulang
                        ? "bg-orange-500 hover:bg-orange-600 hover:shadow-lg"
                        : "bg-gray-300 cursor-not-allowed shadow-none"
                  }`}
                >
                  {!data?.absensiHariIni?.waktuAbsenMasuk
                    ? "Anda Belum Absen Masuk"
                    : isActionLoading 
                      ? "Memproses..." 
                      : data?.bisaAbsenPulang 
                        ? "Klik untuk Absen Pulang" 
                        : "Sesi Pulang Belum Dibuka"}
                </button>
              )}
            </div>
          </div>

          {/* Quick Access Pekerjaan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Link href="/absen-kantor/pekerjaan" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all group block">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">To-Do List Anda</h3>
                  <p className="text-sm text-gray-500">Kelola dan selesaikan tugas-tugas prioritas Anda hari ini.</p>
                </div>
              </div>
            </Link>

            <Link href="/absen-kantor/pekerjaan" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all group block">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">Work Log Harian</h3>
                  <p className="text-sm text-gray-500">Catat jurnal progres kerja dan lihat update dari rekan tim.</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Histori Absen */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Riwayat 7 Hari Terakhir</h2>
            </div>
            {data?.histori && data.histori.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                      <th className="px-6 py-4 font-semibold">Tanggal</th>
                      <th className="px-6 py-4 font-semibold">Masuk</th>
                      <th className="px-6 py-4 font-semibold">Pulang</th>
                      <th className="px-6 py-4 font-semibold">Durasi</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.histori.map((h) => (
                      <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {formatTanggal(h.tanggal)}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {formatJam(h.waktuAbsenMasuk)}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {formatJam(h.waktuAbsenPulang)}
                        </td>
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
                             <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700">INCOMPLETE</span>
                          ) : (
                             <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                              h.status === 'HADIR' ? 'bg-green-50 text-green-700' :
                              h.status === 'TERLAMBAT' ? 'bg-yellow-50 text-yellow-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {h.status}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {h.isIncomplete && (
                            <button 
                              onClick={() => {
                                setKlarifikasiDate(h.tanggal);
                                setIsKlarifikasiModalOpen(true);
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 font-bold underline"
                            >
                              Klarifikasi
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-gray-500">
                Belum ada riwayat absensi.
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal Klarifikasi */}
      {isKlarifikasiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-8 relative">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Klarifikasi Absen Incomplete</h2>
              <button onClick={() => setIsKlarifikasiModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                &times;
              </button>
            </div>
            <form onSubmit={handleKlarifikasi} className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Silakan tuliskan alasan kenapa Anda lupa atau tidak bisa melakukan Absen Pulang pada tanggal <strong>{formatTanggal(klarifikasiDate)}</strong>. Admin akan meninjau alasan Anda dan menyesuaikan jam pulang Anda.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Klarifikasi</label>
                <textarea 
                  required
                  rows={4}
                  value={klarifikasiAlasan}
                  onChange={(e) => setKlarifikasiAlasan(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Misal: Saya terlanjur mematikan laptop jam 17:00..."
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsKlarifikasiModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isActionLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm disabled:opacity-50"
                >
                  {isActionLoading ? "Mengirim..." : "Kirim Pengajuan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
