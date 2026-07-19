"use client";

import { useState, useEffect } from "react";
import ConfirmModal from "@/components/ConfirmModal";
import { useDictionary, useLocale } from "@/hooks/useDictionary";

export default function AdminPersetujuanPage() {
  const dict = useDictionary();
  const locale = useLocale();
  const [pengajuanList, setPengajuanList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message: string; type: "confirm" | "alert"; onConfirm?: () => void; confirmTheme?: "blue" | "red" }>({
    isOpen: false,
    title: "",
    message: "",
    type: "alert"
  });

  const [promptModalConfig, setPromptModalConfig] = useState<{
    isOpen: boolean;
    id: string;
    status: "DISETUJUI" | "DITOLAK";
    jenis: string;
    showTimeInput: boolean;
  }>({
    isOpen: false,
    id: "",
    status: "DISETUJUI",
    jenis: "",
    showTimeInput: false
  });

  const [promptInput, setPromptInput] = useState("");
  const [promptTime, setPromptTime] = useState("17:00");

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

  const openPrompt = (id: string, status: "DISETUJUI" | "DITOLAK", jenis: string) => {
    setPromptModalConfig({
      isOpen: true,
      id,
      status,
      jenis,
      showTimeInput: jenis === 'KLARIFIKASI_ABSEN' && status === 'DISETUJUI'
    });
    setPromptInput("");
    setPromptTime("17:00");
  };

  const submitAction = async () => {
    const { id, status, showTimeInput } = promptModalConfig;
    
    let jamPulangKoreksi = undefined;
    let catatanApproval = promptInput.trim();

    if (showTimeInput && promptTime.trim() !== "") {
      jamPulangKoreksi = promptTime;
    }

    setPromptModalConfig({ ...promptModalConfig, isOpen: false });
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
        setModalConfig({ isOpen: true, title: dict.notifications?.successTitle || "Berhasil", message: dict.notifications?.processSuccess || "Pengajuan berhasil diproses.", type: "alert" });
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
    return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(isoString));
  };

  return (
    <div className="max-w-6xl w-full mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{dict.adminKantor?.persetujuan?.title || "Persetujuan Karyawan"}</h1>
        <p className="text-gray-500 mt-1">{dict.adminKantor?.persetujuan?.subtitle || "Tinjau dan proses pengajuan Izin, Sakit, dan Klarifikasi Absen Karyawan."}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">{dict.adminKantor?.persetujuan?.listTitle || "Daftar Pengajuan Masuk"}</h2>
          <button onClick={fetchPengajuan} className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg">
            {dict.adminKantor?.persetujuan?.btnRefresh || "Refresh Data"}
          </button>
        </div>
        
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">{dict.adminKantor?.persetujuan?.loading || "Memuat data pengajuan..."}</div>
        ) : pengajuanList.length === 0 ? (
          <div className="p-12 text-center text-gray-500">{dict.adminKantor?.persetujuan?.noData || "Belum ada data pengajuan."}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="px-6 py-4 font-semibold">{dict.adminKantor?.persetujuan?.colEmployee || "Karyawan"}</th>
                  <th className="px-6 py-4 font-semibold">{dict.adminKantor?.persetujuan?.colRequest || "Pengajuan"}</th>
                  <th className="px-6 py-4 font-semibold">{dict.adminKantor?.persetujuan?.colDate || "Rentang / Tanggal"}</th>
                  <th className="px-6 py-4 font-semibold">{dict.adminKantor?.persetujuan?.colReason || "Alasan & Bukti"}</th>
                  <th className="px-6 py-4 font-semibold">{dict.adminKantor?.persetujuan?.colStatus || "Status"}</th>
                  <th className="px-6 py-4 font-semibold text-right">{dict.adminKantor?.persetujuan?.colAction || "Aksi"}</th>
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
                        {p.jenis === 'SAKIT' ? (dict.leaveType?.sick || "SAKIT") : 
                         p.jenis === 'IZIN' ? (dict.leaveType?.leave || "IZIN") : 
                         (dict.leaveType?.clarification || "KLARIFIKASI ABSEN")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {p.tanggalMulai === p.tanggalSelesai ? (
                        formatTanggal(p.tanggalMulai)
                      ) : (
                        <div className="flex flex-col">
                          <span>{formatTanggal(p.tanggalMulai)}</span>
                          <span className="text-xs text-gray-400">{dict.adminKantor?.persetujuan?.to || "s.d"}</span>
                          <span>{formatTanggal(p.tanggalSelesai)}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      <p className="text-sm text-gray-900 truncate" title={p.alasan}>{p.alasan}</p>
                      {p.lampiranUrl && (
                        <a href={p.lampiranUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1 mt-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                          {dict.adminKantor?.persetujuan?.viewAttachment || "Lihat Bukti"}
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        p.status === 'DISETUJUI' ? 'bg-green-100 text-green-700' :
                        p.status === 'DITOLAK' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {p.status === 'PENDING' ? (dict.status?.pending || "PENDING") :
                         p.status === 'DISETUJUI' ? (dict.status?.approved || "DISETUJUI") :
                         (dict.status?.rejected || "DITOLAK")}
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
                            disabled={actionLoadingId === p.id}
                            onClick={() => openPrompt(p.id, "DISETUJUI", p.jenis)}
                            className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            {dict.adminKantor?.persetujuan?.btnApprove || "Setujui"}
                          </button>
                          <button
                            disabled={actionLoadingId === p.id}
                            onClick={() => openPrompt(p.id, "DITOLAK", p.jenis)}
                            className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            {dict.adminKantor?.persetujuan?.btnReject || "Tolak"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">{dict.adminKantor?.persetujuan?.processed || "Telah Diproses"}</span>
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

      {/* Custom Prompt Modal */}
      {promptModalConfig.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {promptModalConfig.status === "DISETUJUI" ? (dict.adminKantor?.persetujuan?.btnApprove || "Setujui") : (dict.adminKantor?.persetujuan?.btnReject || "Tolak")} {dict.adminKantor?.persetujuan?.colRequest || "Pengajuan"}
              </h3>
              <p className="text-slate-600 mb-4 text-sm">
                {dict.adminKantor?.persetujuan?.promptReason?.replace(
                  "{status}", 
                  promptModalConfig.status === "DISETUJUI" 
                    ? (dict.adminKantor?.persetujuan?.btnApprove?.toUpperCase() || "DISETUJUI") 
                    : (dict.adminKantor?.persetujuan?.btnReject?.toUpperCase() || "DITOLAK")
                ) || `Masukkan catatan (opsional) untuk tindakan ${promptModalConfig.status}:`}
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {dict.adminKantor?.persetujuan?.noteLabel || "Catatan"}
                  </label>
                  <input
                    type="text"
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder={dict.adminKantor?.persetujuan?.notePlaceholder || "Contoh: OK, cepat sembuh..."}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                {promptModalConfig.showTimeInput && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {dict.adminKantor?.persetujuan?.promptTime || "Jam Pulang Koreksi (HH:mm)"}
                    </label>
                    <input
                      type="time"
                      value={promptTime}
                      onChange={(e) => setPromptTime(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {dict.adminKantor?.persetujuan?.promptTimeHint || "Kosongkan/biarkan default jika ingin otomatis ke 17:00."}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setPromptModalConfig({ ...promptModalConfig, isOpen: false })}
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {dict.dashboard?.btnCancel || "Batal"}
              </button>
              <button
                onClick={submitAction}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors shadow-sm ${
                  promptModalConfig.status === "DISETUJUI" 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {promptModalConfig.status === "DISETUJUI" ? (dict.adminKantor?.persetujuan?.btnApprove || "Setujui") : (dict.adminKantor?.persetujuan?.btnReject || "Tolak")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
