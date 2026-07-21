"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";
import { useDictionary, useLocale } from "@/hooks/useDictionary";
import { Calendar, CheckCircle2, AlertTriangle, MessageSquare, Send, User, Lock, Image as ImageIcon, ArrowLeft, Clock, Loader2 } from "lucide-react";
import Link from "next/link";

export default function DetailPersetujuanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const dict = useDictionary();
  const locale = useLocale();

  const [pengajuan, setPengajuan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [promptModalConfig, setPromptModalConfig] = useState<{
    isOpen: boolean;
    status: "DISETUJUI" | "DITOLAK";
    showTimeInput: boolean;
  }>({
    isOpen: false,
    status: "DISETUJUI",
    showTimeInput: false
  });

  const [promptInput, setPromptInput] = useState("");
  const [promptTime, setPromptTime] = useState("17:00");
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean; title: string; message: string; type: "alert"; confirmTheme?: "red" | "blue" }>({
    isOpen: false,
    title: "",
    message: "",
    type: "alert"
  });

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/absen-kantor/pengajuan/${id}`);
        const result = await res.json();
        if (result.success) {
          setPengajuan(result.data);
        } else {
          setAlertConfig({ isOpen: true, title: "Error", message: result.error, type: "alert", confirmTheme: "red" });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const openPrompt = (status: "DISETUJUI" | "DITOLAK") => {
    setPromptModalConfig({
      isOpen: true,
      status,
      showTimeInput: pengajuan?.jenis === 'KLARIFIKASI_ABSEN' && status === 'DISETUJUI'
    });
    setPromptInput("");
    setPromptTime("17:00");
  };

  const submitAction = async () => {
    const { status, showTimeInput } = promptModalConfig;
    
    let jamPulangKoreksi = undefined;
    let catatanApproval = promptInput.trim();

    if (showTimeInput && promptTime.trim() !== "") {
      jamPulangKoreksi = promptTime;
    }

    setPromptModalConfig({ ...promptModalConfig, isOpen: false });
    setActionLoading(true);
    
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
        setAlertConfig({ isOpen: true, title: dict.notifications?.successTitle || "Berhasil", message: dict.notifications?.processSuccess || "Pengajuan berhasil diproses.", type: "alert", confirmTheme: "blue" });
        const refreshRes = await fetch(`/api/absen-kantor/pengajuan/${id}`);
        const refreshResult = await refreshRes.json();
        if (refreshResult.success) setPengajuan(refreshResult.data);
        router.refresh();
      } else {
        setAlertConfig({ isOpen: true, title: dict.notifications?.errorTitle || "Gagal", message: result.error, type: "alert", confirmTheme: "red" });
      }
    } catch (error) {
      setAlertConfig({ isOpen: true, title: dict.notifications?.errorTitle || "Error", message: dict.notifications?.errorSystem || "Terjadi kesalahan saat memproses data.", type: "alert", confirmTheme: "red" });
    } finally {
      setActionLoading(false);
    }
  };

  const formatTanggal = (isoString: string) => {
    return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(isoString));
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl w-full mx-auto p-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-[#394887] animate-spin" />
        <p className="text-gray-500 font-medium">{dict.adminKantor?.persetujuan?.loadingDetail || "Memuat detail..."}</p>
      </div>
    );
  }

  if (!pengajuan) {
    return (
      <div className="max-w-6xl w-full mx-auto space-y-6">
        <Link href="/admin-kantor/persetujuan" className="inline-flex items-center gap-2 text-[#394887] font-bold hover:underline">
          <ArrowLeft className="w-4 h-4" /> {dict.adminKantor?.persetujuan?.back || "Kembali ke Daftar"}
        </Link>
        <div className="p-12 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
          {dict.adminKantor?.persetujuan?.notFound || "Data pengajuan tidak ditemukan."}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl w-full mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <Link href="/admin-kantor/persetujuan" className="inline-flex items-center gap-2 text-[#394887] font-bold hover:underline mb-4">
          <ArrowLeft className="w-4 h-4" /> {dict.adminKantor?.persetujuan?.back || "Kembali ke Daftar"}
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{dict.adminKantor?.persetujuan?.detailTitle || "Detail Pengajuan"}</h1>
        <p className="text-gray-500 mt-1">{dict.adminKantor?.persetujuan?.detailSubtitle || "Tinjau informasi lengkap alasan dan bukti karyawan."}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#394887]/10 text-[#394887] rounded-full flex items-center justify-center font-bold text-2xl">
              {pengajuan.karyawan?.namaLengkap?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{pengajuan.karyawan?.namaLengkap}</h2>
              <p className="text-sm text-gray-500">{pengajuan.karyawan?.email}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
             <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-bold border ${
                pengajuan.status === 'DISETUJUI' ? 'bg-green-50 text-green-700 border-green-200' :
                pengajuan.status === 'DITOLAK' ? 'bg-red-50 text-red-700 border-red-200' :
                'bg-yellow-50 text-yellow-700 border-yellow-200'
              }`}>
                {pengajuan.status === 'PENDING' ? (dict.status?.pending || "PENDING") :
                 pengajuan.status === 'DISETUJUI' ? (dict.status?.approved || "DISETUJUI") :
                 (dict.status?.rejected || "DITOLAK")}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold border ${
                pengajuan.jenis === 'IZIN' ? 'bg-[#EFC94B]/40 text-[#394887] border-[#EFC94B]/60' :
                pengajuan.jenis === 'SAKIT' ? 'bg-[#EFC94B]/40 text-[#394887] border-[#EFC94B]/60' :
                'bg-[#394887]/10 text-[#394887] border-[#394887]/20'
              }`}>
                {pengajuan.jenis === 'SAKIT' ? (dict.leaveType?.sick || "SAKIT") : 
                 pengajuan.jenis === 'IZIN' ? (dict.leaveType?.leave || "IZIN") : 
                 (dict.leaveType?.clarification || "KLARIFIKASI ABSEN")}
              </span>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-5 rounded-xl border border-gray-100">
            <div>
               <p className="text-sm text-gray-500 font-medium mb-1">{dict.adminKantor?.persetujuan?.startDate || "Tanggal Mulai"}</p>
               <p className="font-bold text-gray-900 flex items-center gap-2">
                 <Calendar className="w-4 h-4 text-[#394887]" /> {formatTanggal(pengajuan.tanggalMulai)}
               </p>
            </div>
            <div>
               <p className="text-sm text-gray-500 font-medium mb-1">{dict.adminKantor?.persetujuan?.endDate || "Tanggal Selesai"}</p>
               <p className="font-bold text-gray-900 flex items-center gap-2">
                 <Calendar className="w-4 h-4 text-[#394887]" /> {formatTanggal(pengajuan.tanggalSelesai)}
               </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#394887]" /> {dict.adminKantor?.persetujuan?.fullReason || "Alasan Lengkap"}
            </h3>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {pengajuan.alasan}
            </div>
          </div>

          {pengajuan.lampiranUrl && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#394887]" /> {dict.adminKantor?.persetujuan?.attachment || "Lampiran / Bukti"}
              </h3>
              <div className="bg-gray-50 p-2 rounded-xl border border-gray-200 text-center">
                <img 
                  src={pengajuan.lampiranUrl} 
                  alt="Bukti Lampiran" 
                  className="w-full h-auto max-h-[600px] object-contain rounded-lg border border-gray-200 shadow-sm inline-block"
                />
              </div>
            </div>
          )}

          {pengajuan.catatanApproval && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-[#394887]" /> {dict.adminKantor?.persetujuan?.adminNote || "Catatan Admin"}
              </h3>
              <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 text-gray-800 whitespace-pre-wrap">
                {pengajuan.catatanApproval}
              </div>
            </div>
          )}
        </div>

        {pengajuan.status === 'PENDING' && (
          <div className="p-6 md:p-8 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-4 justify-end">
            <button
              disabled={actionLoading}
              onClick={() => openPrompt("DITOLAK")}
              className="px-8 py-3 bg-white text-red-600 border-2 border-red-200 hover:border-red-600 hover:bg-red-50 rounded-xl font-bold transition-colors disabled:opacity-50"
            >
              {dict.adminKantor?.persetujuan?.btnReject || "Tolak Pengajuan"}
            </button>
            <button
              disabled={actionLoading}
              onClick={() => openPrompt("DISETUJUI")}
              className="px-8 py-3 bg-[#394887] text-white hover:bg-[#2D3A6E] rounded-xl font-bold shadow-md transition-all disabled:opacity-50"
            >
              {dict.adminKantor?.persetujuan?.btnApprove || "Setujui Pengajuan"}
            </button>
          </div>
        )}
      </div>

      {promptModalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">
                {promptModalConfig.status === 'DISETUJUI' ? (dict.adminKantor?.persetujuan?.btnApprove || "Setujui") : (dict.adminKantor?.persetujuan?.btnReject || "Tolak")}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{dict.adminKantor?.persetujuan?.noteOptional || "Tambahkan catatan untuk karyawan (opsional)"}</p>
            </div>
            
            <div className="p-6 space-y-4 bg-gray-50/50">
              {promptModalConfig.showTimeInput && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#394887]" /> {dict.adminKantor?.persetujuan?.setCheckoutTime || "Set Jam Pulang"}
                  </label>
                  <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                    {dict.adminKantor?.persetujuan?.checkoutTimeHint || "Tentukan jam berapa absen pulangnya akan dikoreksi otomatis (format 24 jam)."}
                  </p>
                  <input
                    type="time"
                    value={promptTime}
                    onChange={(e) => setPromptTime(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-[#394887] outline-none font-medium"
                    required={promptModalConfig.showTimeInput}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{dict.adminKantor?.persetujuan?.adminNote || "Catatan Admin"}</label>
                <textarea
                  rows={3}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder={dict.adminKantor?.persetujuan?.notePlaceholder || "Misal: Oke disetujui, lekas sembuh ya..."}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-[#394887] outline-none text-sm resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end bg-white">
              <button
                onClick={() => setPromptModalConfig({ ...promptModalConfig, isOpen: false })}
                className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
              >
                {dict.dashboard?.btnCancel || "Batal"}
              </button>
              <button
                onClick={submitAction}
                className={`px-5 py-2.5 text-white font-bold rounded-xl shadow-sm transition-all ${
                  promptModalConfig.status === 'DISETUJUI' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {dict.adminKantor?.persetujuan?.btnConfirm || "Konfirmasi"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        showCancel={false}
        confirmText="Tutup"
        confirmTheme={alertConfig.confirmTheme}
        onCancel={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        onConfirm={() => {
          setAlertConfig({ ...alertConfig, isOpen: false });
        }}
      />
    </div>
  );
}
