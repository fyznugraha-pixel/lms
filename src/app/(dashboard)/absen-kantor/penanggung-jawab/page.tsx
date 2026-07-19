"use client";

import { useState, useEffect } from "react";
import { useDictionary, useLocale } from "@/hooks/useDictionary";
import ConfirmModal from "@/components/ConfirmModal";

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
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message: string; type: "confirm" | "alert"; onConfirm?: () => void; confirmTheme?: "blue" | "red" }>({
    isOpen: false,
    title: "",
    message: "",
    type: "alert"
  });

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
    setModalConfig({
      isOpen: true,
      title: dict.notifications?.warningTitle || "Peringatan",
      message: `Generate sesi absen ${jenisAbsen} untuk semua karyawan aktif hari ini?`,
      type: "confirm",
      confirmTheme: "blue",
      onConfirm: async () => {
        setIsGenerating(true);
        try {
          const res = await fetch("/api/absen-kantor/sesi", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jenisAbsen }),
          });
          const result = await res.json();
          
          if (result.success) {
            setModalConfig({ isOpen: true, title: dict.notifications?.successTitle || "Berhasil", message: dict.notifications?.tokenSuccess || result.message, type: "alert" });
            fetchSesi(); // Refresh data
          } else {
            setModalConfig({ isOpen: true, title: dict.notifications?.errorTitle || "Gagal", message: result.error, type: "alert", confirmTheme: "red" });
          }
        } catch (error) {
          setModalConfig({ isOpen: true, title: dict.notifications?.errorTitle || "Error", message: dict.notifications?.errorSystem || "Terjadi kesalahan sistem saat generate token.", type: "alert", confirmTheme: "red" });
        } finally {
          setIsGenerating(false);
        }
      }
    });
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{dict.penanggungJawab?.title || "Manajemen Sesi Absen"}</h1>
        <p className="text-gray-500 mt-1">{dict.penanggungJawab?.subtitle || "Generate personal token untuk absen masuk/pulang karyawan per hari."}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Generate Absen Masuk */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">{dict.penanggungJawab?.inSession || "Sesi Absen MASUK"}</h3>
            <p className="text-blue-100 mb-6 max-w-sm">
              {dict.penanggungJawab?.inSessionDesc || "Buat sesi absen masuk untuk hari ini. Sistem akan generate personal token unik ke semua karyawan aktif."}
            </p>
            <button
              onClick={() => handleGenerate("MASUK")}
              disabled={isGenerating}
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-6 py-3 rounded-xl transition-all shadow-sm w-full md:w-auto disabled:opacity-70"
            >
              {isGenerating ? dict.dashboard.btnProcessing : (dict.penanggungJawab?.btnInSession || "Buat Sesi Masuk Sekarang")}
            </button>
          </div>
          {/* Decorative SVG */}
          <svg className="absolute right-0 bottom-0 opacity-10" width="150" height="150" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z" />
          </svg>
        </div>

        {/* Card Generate Absen Pulang */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-2">{dict.penanggungJawab?.outSession || "Sesi Absen PULANG"}</h3>
            <p className="text-gray-300 mb-6 max-w-sm">
              {dict.penanggungJawab?.outSessionDesc || "Buat sesi absen pulang untuk hari ini. Karyawan baru bisa absen pulang jika sesi ini aktif."}
            </p>
            <button
              onClick={() => handleGenerate("PULANG")}
              disabled={isGenerating}
              className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-6 py-3 rounded-xl transition-all shadow-sm w-full md:w-auto disabled:opacity-70"
            >
              {isGenerating ? dict.dashboard.btnProcessing : (dict.penanggungJawab?.btnOutSession || "Buat Sesi Pulang Sekarang")}
            </button>
          </div>
          <svg className="absolute right-0 bottom-0 opacity-10" width="150" height="150" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11 15h2v2h-2v-2zm0-8h2v6h-2V7zm1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
          </svg>
        </div>
      </div>

      {/* Riwayat Sesi */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
        <div className="p-5 md:p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">{dict.penanggungJawab?.historyTitle || "Riwayat Sesi Absen"}</h2>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Memuat data histori sesi...</div>
        ) : sesiList.length === 0 ? (
          <div className="p-12 text-center text-gray-500">{dict.adminKantor?.absensi?.noData || "Belum ada sesi absensi."}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-600 font-medium">
                <tr>
                  <th className="px-6 py-4">{dict.penanggungJawab?.colDate || "Tanggal & Waktu"}</th>
                  <th className="px-6 py-4">{dict.penanggungJawab?.colType || "Jenis"}</th>
                  <th className="px-6 py-4">{dict.penanggungJawab?.colCreator || "Dibuat Oleh"}</th>
                  <th className="px-6 py-4 text-center">Total Token</th>
                  <th className="px-6 py-4">{dict.penanggungJawab?.colStatus || "Status"}</th>
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

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        showCancel={modalConfig.type === "confirm"}
        confirmText={modalConfig.type === "confirm" ? "Ya, Generate" : "Oke"}
        confirmTheme={modalConfig.confirmTheme || "blue"}
        onCancel={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={() => {
          if (modalConfig.onConfirm) modalConfig.onConfirm();
          setModalConfig({ ...modalConfig, isOpen: false });
        }}
      />
    </div>
  );
}
