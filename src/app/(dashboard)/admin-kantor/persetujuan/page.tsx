"use client";

import { useState, useEffect } from "react";
import ConfirmModal from "@/components/ConfirmModal";
import { useDictionary } from "@/hooks/useDictionary";

export default function AdminPersetujuanPage() {
  const dict = useDictionary();
  const [pengajuanList, setPengajuanList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message: string; type: "confirm" | "alert"; onConfirm?: () => void; confirmTheme?: "blue" | "red" }>({
    isOpen: false,
    title: "",
    message: "",
    type: "alert"
  });

  const fetchPengajuan = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/absen-kantor/pengajuan?mode=admin");
      const result = await res.json();
      if (result.success) {
        setPengajuanList(result.data);
      }
    } catch (error) {
      console.error("Gagal mengambil data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPengajuan();
  }, []);

  const handleAction = async (id: string, status: "DISETUJUI" | "DITOLAK", jenis: string) => {
    let jamPulangKoreksi = undefined;
    let catatanApproval = prompt(`Masukkan catatan (opsional) untuk tindakan ${status}:`) || "";

    if (jenis === 'KLARIFIKASI_ABSEN' && status === 'DISETUJUI') {
      const inputJam = prompt("Masukkan jam pulang koreksi (HH:mm). Kosongkan untuk set otomatis ke 17:00:", "17:00");
      if (inputJam !== null) {
        jamPulangKoreksi = inputJam;
      }
    }

    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/absen-kantor/pengajuan/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          catatanApproval,
          jamPulangKoreksi
        })
      });
      const result = await res.json();
      if (result.success) {
        setModalConfig({ isOpen: true, title: dict.notifications?.successTitle || "Berhasil", message: result.message, type: "alert" });
        fetchPengajuan();
      } else {
        setModalConfig({ isOpen: true, title: dict.notifications?.errorTitle || "Gagal", message: result.error, type: "alert", confirmTheme: "red" });
      }
    } catch (error) {
      setModalConfig({ isOpen: true, title: dict.notifications?.errorTitle || "Error", message: dict.notifications?.errorSystem || "Terjadi kesalahan saat memproses data.", type: "alert", confirmTheme: "red" });
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatTanggal = (isoString: string) => {
    return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(isoString));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Persetujuan Karyawan</h1>
        <p className="text-gray-500 mt-1">Tinjau dan proses pengajuan Izin, Sakit, dan Klarifikasi Absen Karyawan.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">Daftar Pengajuan Masuk</h2>
          <button onClick={fetchPengajuan} className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg">
            Refresh Data
          </button>
        </div>
        
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Memuat data pengajuan...</div>
        ) : pengajuanList.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Belum ada data pengajuan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="px-6 py-4 font-semibold">Karyawan</th>
                  <th className="px-6 py-4 font-semibold">Pengajuan</th>
                  <th className="px-6 py-4 font-semibold">Rentang / Tanggal</th>
                  <th className="px-6 py-4 font-semibold">Alasan & Bukti</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pengajuanList.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{p.karyawan.namaLengkap || "-"}</div>
                      <div className="text-xs text-gray-500">{p.karyawan.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                        p.jenis === 'IZIN' ? 'bg-blue-50 text-blue-700' :
                        p.jenis === 'SAKIT' ? 'bg-red-50 text-red-700' :
                        'bg-purple-50 text-purple-700'
                      }`}>
                        {p.jenis.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {p.tanggalMulai === p.tanggalSelesai ? (
                        formatTanggal(p.tanggalMulai)
                      ) : (
                        <div className="flex flex-col">
                          <span>{formatTanggal(p.tanggalMulai)}</span>
                          <span className="text-xs text-gray-400">s.d</span>
                          <span>{formatTanggal(p.tanggalSelesai)}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      <p className="text-sm text-gray-900 truncate" title={p.alasan}>{p.alasan}</p>
                      {p.lampiranUrl && (
                        <a href={p.lampiranUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1 mt-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          Buka Bukti
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        p.status === 'DISETUJUI' ? 'bg-green-100 text-green-700' :
                        p.status === 'DITOLAK' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {p.status}
                      </span>
                      {p.catatanApproval && (
                        <p className="text-xs text-gray-500 mt-1 truncate max-w-[150px]" title={p.catatanApproval}>
                          Admin: {p.catatanApproval}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.status === 'PENDING' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleAction(p.id, "DISETUJUI", p.jenis)}
                            disabled={actionLoadingId === p.id}
                            className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => handleAction(p.id, "DITOLAK", p.jenis)}
                            disabled={actionLoadingId === p.id}
                            className="bg-white border border-gray-200 text-gray-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            Tolak
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Telah Diproses</span>
                      )}
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
        confirmText={modalConfig.type === "confirm" ? "Ya, Lanjutkan" : "Oke"}
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
