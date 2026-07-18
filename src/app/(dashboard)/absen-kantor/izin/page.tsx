"use client";

import { useState, useEffect } from "react";
import { useDictionary, useLocale } from "@/hooks/useDictionary";
import ConfirmModal from "@/components/ConfirmModal";
import CustomDropdown from "@/components/CustomDropdown";
import CustomDatePicker from "@/components/CustomDatePicker";

export default function KaryawanIzinPage() {
  const dict = useDictionary();
  const locale = useLocale();
  const [pengajuanList, setPengajuanList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message: string; type: "confirm" | "alert"; onConfirm?: () => void; confirmTheme?: "blue" | "red" }>({
    isOpen: false,
    title: "",
    message: "",
    type: "alert"
  });

  // Form State
  const [jenis, setJenis] = useState<"IZIN" | "SAKIT">("IZIN");
  const [tanggalMulai, setTanggalMulai] = useState<Date | null>(null);
  const [tanggalSelesai, setTanggalSelesai] = useState<Date | null>(null);
  const [alasan, setAlasan] = useState("");
  const [lampiranUrl, setLampiranUrl] = useState("");

  const fetchPengajuan = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/absen-kantor/pengajuan?mode=user");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/absen-kantor/pengajuan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jenis,
          tanggalMulai: tanggalMulai ? tanggalMulai.toISOString() : null,
          tanggalSelesai: tanggalSelesai ? tanggalSelesai.toISOString() : null,
          alasan,
          lampiranUrl
        })
      });
      const result = await res.json();
      if (result.success) {
        setModalConfig({ isOpen: true, title: dict.notifications?.successTitle || "Berhasil", message: dict.notifications?.reqSuccess || result.message, type: "alert" });
        setTanggalMulai(null);
        setTanggalSelesai(null);
        setAlasan("");
        setLampiranUrl("");
        fetchPengajuan();
      } else {
        setModalConfig({ isOpen: true, title: dict.notifications?.errorTitle || "Gagal", message: result.error, type: "alert", confirmTheme: "red" });
      }
    } catch (e) {
      setModalConfig({ isOpen: true, title: dict.notifications?.errorTitle || "Error", message: dict.notifications?.errorSystem || "Terjadi kesalahan sistem saat mengirim pengajuan.", type: "alert", confirmTheme: "red" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTanggal = (isoString: string) => {
    return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(isoString));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{dict.leave.title}</h1>
        <p className="text-gray-500 mt-1">{dict.leave.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Pengajuan */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 border-b pb-4">{dict.leave.formTitle}</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{dict.leave.type}</label>
                <CustomDropdown
                  value={jenis}
                  onChange={(val) => setJenis(val as "IZIN" | "SAKIT")}
                  options={[
                    { value: "IZIN", label: dict.leave.typeLeave },
                    { value: "SAKIT", label: dict.leave.typeSick }
                  ]}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{dict.leave.startDate}</label>
                <CustomDatePicker
                  selected={tanggalMulai}
                  onChange={(date) => setTanggalMulai(date)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{dict.leave.endDate}</label>
                <CustomDatePicker
                  selected={tanggalSelesai}
                  onChange={(date) => setTanggalSelesai(date)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{dict.leave.reason}</label>
                <textarea 
                  required
                  rows={4}
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                  placeholder={dict.leave.reasonPlaceholder}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL / Link</label>
                <input 
                  type="url"
                  value={lampiranUrl}
                  onChange={(e) => setLampiranUrl(e.target.value)}
                  placeholder="URL Google Drive"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {isSubmitting ? dict.dashboard.submitting : dict.leave.btnNewReq}
              </button>
            </form>
          </div>
        </div>

        {/* Riwayat Pengajuan */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{dict.leave.reqHistory}</h2>
            </div>
            
            {isLoading ? (
              <div className="p-12 text-center text-gray-500">{dict.dashboard.loading}</div>
            ) : pengajuanList.length === 0 ? (
              <div className="p-12 text-center text-gray-500">{dict.leave.noReq}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                      <th className="px-6 py-4 font-semibold">{dict.leave.type}</th>
                      <th className="px-6 py-4 font-semibold">{dict.leave.startDate} - {dict.leave.endDate}</th>
                      <th className="px-6 py-4 font-semibold">{dict.leave.reason}</th>
                      <th className="px-6 py-4 font-semibold">{dict.dashboard.colStatus}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pengajuanList.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                            p.jenis === 'IZIN' ? 'bg-blue-50 text-blue-700' :
                            p.jenis === 'SAKIT' ? 'bg-red-50 text-red-700' :
                            'bg-purple-50 text-purple-700'
                          }`}>
                            {p.jenis.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {p.tanggalMulai === p.tanggalSelesai ? (
                            formatTanggal(p.tanggalMulai)
                          ) : (
                            `${formatTanggal(p.tanggalMulai)} s.d ${formatTanggal(p.tanggalSelesai)}`
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900 truncate max-w-[200px]">{p.alasan}</p>
                          {p.lampiranUrl && (
                            <a href={p.lampiranUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-1 block">
                              Lihat Lampiran
                            </a>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold w-fit ${
                              p.status === 'DISETUJUI' ? 'bg-green-100 text-green-700' :
                              p.status === 'DITOLAK' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {p.status === 'DISETUJUI' ? dict.leave.statusApproved : 
                               p.status === 'DITOLAK' ? dict.leave.statusRejected : dict.leave.statusPending}
                            </span>
                            {p.catatanApproval && (
                              <p className="text-xs text-gray-500 truncate max-w-[150px]" title={p.catatanApproval}>
                                Note: {p.catatanApproval}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
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
