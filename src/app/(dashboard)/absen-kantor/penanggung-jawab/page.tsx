"use client";

import { useState, useEffect } from "react";

type SesiAbsen = {
  id: string;
  tanggal: string;
  jenisAbsen: string;
  status: string;
  waktuDibuat: string;
  dibuatOleh: {
    namaLengkap: string | null;
    email: string;
  };
  _count: {
    tokens: number;
  };
};

export default function PenanggungJawabDashboard() {
  const dict = useDictionary();
  const locale = useLocale();
  const [sesiList, setSesiList] = useState<SesiAbsen[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchSesi = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/absen-kantor/sesi");
      const result = await res.json();
      if (result.success) {
        setSesiList(result.data);
      }
    } catch (error) {
      console.error("Gagal mengambil data sesi", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSesi();
  }, []);

  const handleGenerate = async (jenisAbsen: "MASUK" | "PULANG") => {
    if (!confirm(`Generate sesi absen ${jenisAbsen} untuk semua karyawan aktif hari ini?`)) return;
    
    setIsGenerating(true);
    try {
      const res = await fetch("/api/absen-kantor/sesi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisAbsen }),
      });
      const result = await res.json();
      
      if (result.success) {
        alert(result.message);
        fetchSesi(); // Refresh data
      } else {
        alert(result.error);
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem saat generate token.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manajemen Sesi Absen</h1>
        <p className="text-gray-500 mt-1">Generate personal token untuk absen masuk/pulang karyawan per hari.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Generate Absen Masuk */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Sesi Absen MASUK</h3>
            <p className="text-blue-100 mb-6 max-w-sm">
              Buat sesi absen masuk untuk hari ini. Sistem akan generate personal token unik ke semua karyawan aktif.
            </p>
            <button
              onClick={() => handleGenerate("MASUK")}
              disabled={isGenerating}
              className="bg-white text-blue-700 hover:bg-blue-50 px-6 py-2.5 rounded-lg font-bold shadow-md transition-colors disabled:opacity-75"
            >
              {isGenerating ? "Memproses..." : "1-Klik Generate (Masuk)"}
            </button>
          </div>
          {/* Decorative SVG */}
          <svg className="absolute right-0 bottom-0 opacity-10" width="150" height="150" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z" />
          </svg>
        </div>

        {/* Card Generate Absen Pulang */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">Sesi Absen PULANG</h3>
            <p className="text-indigo-100 mb-6 max-w-sm">
              Buat sesi absen pulang untuk hari ini. Harus dilakukan pada sore/malam hari saat jam kerja usai.
            </p>
            <button
              onClick={() => handleGenerate("PULANG")}
              disabled={isGenerating}
              className="bg-white text-indigo-700 hover:bg-indigo-50 px-6 py-2.5 rounded-lg font-bold shadow-md transition-colors disabled:opacity-75"
            >
              {isGenerating ? "Memproses..." : "1-Klik Generate (Pulang)"}
            </button>
          </div>
          <svg className="absolute right-0 bottom-0 opacity-10" width="150" height="150" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11 15h2v2h-2v-2zm0-8h2v6h-2V7zm1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
          </svg>
        </div>
      </div>

      {/* Riwayat Sesi */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Riwayat Sesi Absen Terakhir</h2>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Memuat data histori sesi...</div>
        ) : sesiList.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Belum ada sesi absen yang dibuat.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                  <th className="px-6 py-4 font-semibold">Tanggal & Waktu</th>
                  <th className="px-6 py-4 font-semibold">Jenis Absen</th>
                  <th className="px-6 py-4 font-semibold">Dibuat Oleh</th>
                  <th className="px-6 py-4 font-semibold text-center">Token Di-generate</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sesiList.map((sesi) => (
                  <tr key={sesi.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="whitespace-nowrap text-sm text-gray-900 font-medium capitalize">
                        {new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(sesi.tanggal))}
                      </div>
                      <div className="whitespace-nowrap text-sm text-gray-500">
                        {new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(sesi.waktuDibuat))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                        sesi.jenisAbsen === 'MASUK' 
                          ? "bg-blue-50 text-blue-700 border border-blue-100" 
                          : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                      }`}>
                        {sesi.jenisAbsen}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{sesi.dibuatOleh.namaLengkap || "-"}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold text-sm">
                        {sesi._count.tokens}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        sesi.status === 'AKTIF' 
                          ? "bg-green-50 text-green-700 border border-green-200" 
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sesi.status === 'AKTIF' ? 'bg-green-600' : 'bg-gray-500'}`}></span>
                        {sesi.status}
                      </span>
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
