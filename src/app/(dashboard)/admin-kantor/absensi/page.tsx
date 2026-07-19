"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlusCircle, LogOut, CheckCircle2, Copy } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import { useDictionary } from "@/hooks/useDictionary";

export default function AbsensiAdminPage() {
  const dict = useDictionary();
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message: string; type: "confirm" | "alert"; onConfirm?: () => void; confirmTheme?: "blue" | "amber" }>({
    isOpen: false,
    title: "",
    message: "",
    type: "alert"
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/admin-kantor/absensi/sesi");
      const data = await res.json();
      if (data.success) {
        setSessions(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateConfirm = (jenisAbsen: "MASUK" | "PULANG") => {
    setModalConfig({
      isOpen: true,
      title: dict.notifications?.warningTitle || "Buka Sesi Absensi",
      message: dict.adminKantor?.absensi?.openConfirmMsg?.replace("{jenisAbsen}", jenisAbsen) || `Anda yakin ingin membuka sesi ${jenisAbsen} hari ini?`,
      type: "confirm",
      confirmTheme: jenisAbsen === "MASUK" ? "blue" : "amber",
      onConfirm: () => createSession(jenisAbsen)
    });
  };

  const showAlert = (title: string, message: string) => {
    setModalConfig({ isOpen: true, title, message, type: "alert" });
  };

  const createSession = async (jenisAbsen: "MASUK" | "PULANG") => {
    setIsCreating(true);
    try {
      const res = await fetch("/api/admin-kantor/absensi/sesi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisAbsen })
      });
      const data = await res.json();
      if (data.success) {
        fetchSessions();
        showAlert(dict.notifications?.successTitle || "Berhasil", data.message || dict.adminKantor?.absensi?.createSuccess || "Sesi absensi berhasil dibuat.");
      } else {
        showAlert(dict.notifications?.errorTitle || "Gagal", data.error || dict.adminKantor?.absensi?.createFailed || "Gagal membuat sesi absensi.");
      }
    } catch (err) {
      showAlert(dict.notifications?.errorTitle || "Error", dict.notifications?.errorSystem || "Terjadi kesalahan sistem saat membuat sesi.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{dict.adminKantor?.absensi?.title || "Manajemen Absensi"}</h1>
          <p className="text-gray-500">{dict.adminKantor?.absensi?.subtitle || "Kelola sesi absensi kantor & barcode karyawan"}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => openCreateConfirm("MASUK")}
            disabled={isCreating}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <PlusCircle size={18} /> {dict.adminKantor?.absensi?.btnOpenIn || "Buka Sesi Masuk"}
          </button>
          <button
            onClick={() => openCreateConfirm("PULANG")}
            disabled={isCreating}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <LogOut size={18} /> {dict.adminKantor?.absensi?.btnOpenOut || "Buka Sesi Pulang"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Memuat sesi...</div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Belum ada sesi absensi.</div>
        ) : (
          <div className="min-w-[800px]">
            <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 font-semibold text-gray-600">{dict.adminKantor?.absensi?.colDate || "Tanggal"}</th>
                <th className="p-4 font-semibold text-gray-600">{dict.adminKantor?.absensi?.colType || "Jenis Sesi"}</th>
                <th className="p-4 font-semibold text-gray-600">{dict.adminKantor?.absensi?.colStatus || "Status"}</th>
                <th className="p-4 font-semibold text-gray-600">{dict.adminKantor?.absensi?.colCode || "Kode Absen (OTP)"}</th>
                <th className="p-4 font-semibold text-gray-600">{dict.adminKantor?.absensi?.colCount || "Absen Masuk"}</th>
                <th className="p-4 font-semibold text-gray-600">{dict.adminKantor?.absensi?.colAction || "Aksi"}</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((sesi) => (
                <tr key={sesi.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4">{new Date(sesi.tanggal).toLocaleDateString("id-ID")}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      sesi.jenisAbsen === 'MASUK' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {sesi.jenisAbsen}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      sesi.status === 'AKTIF' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {sesi.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {sesi.status === 'AKTIF' ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-lg tracking-widest text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                          {sesi.id.substring(0, 6).toUpperCase()}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(sesi.id.substring(0, 6).toUpperCase());
                            showAlert(dict.notifications?.successTitle || "Disalin!", "Kode berhasil disalin ke clipboard.");
                          }}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title={dict.adminKantor?.absensi?.btnCopy || "Copy Kode"}
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 font-medium">- Ditutup -</span>
                    )}
                  </td>
                  <td className="p-4">{sesi.jenisAbsen === 'MASUK' ? sesi._count.absensiMasuk : sesi._count.absensiPulang} orang</td>
                  <td className="p-4">
                    <Link 
                      href={`/admin-kantor/absensi/${sesi.id}`}
                      className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <CheckCircle2 size={16} /> Detail
                    </Link>
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
