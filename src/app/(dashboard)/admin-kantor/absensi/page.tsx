"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import { PlusCircle, LogOut, CheckCircle2, Copy, RefreshCw } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import { useDictionary, useLocale } from "@/hooks/useDictionary";

export default function AbsensiAdminPage() {
  const dict = useDictionary();
  const locale = useLocale();
  const fetcher = (url: string) => fetch(url).then(res => res.json()).then(res => res.data);
  const { data: sessions, error, isLoading: isSwrLoading, mutate } = useSWR(`/api/admin-kantor/absensi/sesi`, fetcher, { revalidateOnFocus: true });
  
  const isLoading = isSwrLoading && !sessions;

  const [isCreating, setIsCreating] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message: string; type: "confirm" | "alert"; onConfirm?: () => void; confirmTheme?: "blue" | "amber"; confirmText?: string; cancelText?: string }>({
    isOpen: false,
    title: "",
    message: "",
    type: "alert"
  });

  const openCreateConfirm = (jenisAbsen: "MASUK" | "PULANG") => {
    const translatedJenis = jenisAbsen === "MASUK" ? (dict.adminKantor?.absensi?.typeIn || "MASUK") : (dict.adminKantor?.absensi?.typeOut || "PULANG");
    setModalConfig({
      isOpen: true,
      title: dict.notifications?.warningTitle || "Buka Sesi Absensi",
      message: dict.adminKantor?.absensi?.openConfirmMsg?.replace("{jenisAbsen}", translatedJenis) || `Anda yakin ingin membuka sesi ${translatedJenis} hari ini?`,
      type: "confirm",
      confirmTheme: jenisAbsen === "MASUK" ? "blue" : "amber",
      onConfirm: () => createSession(jenisAbsen),
      confirmText: dict.notifications?.btnYesContinue || "Ya, Lanjutkan",
      cancelText: dict.dashboard?.btnCancel || "Batal"
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
        mutate();
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{dict.adminKantor?.absensi?.title || "Manajemen Absensi"}</h1>
          <p className="text-gray-500 mt-1">{dict.adminKantor?.absensi?.subtitle || "Kelola sesi absensi kantor & barcode karyawan"}</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <button onClick={() => mutate()} className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hidden md:flex items-center gap-2 transition-colors">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={() => openCreateConfirm("MASUK")}
            disabled={isCreating}
            className="flex items-center gap-2 bg-[#394887] hover:bg-[#2D3A6E] text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <PlusCircle size={18} /> {dict.adminKantor?.absensi?.btnOpenIn || "Buka Sesi Masuk"}
          </button>
          <button
            onClick={() => openCreateConfirm("PULANG")}
            disabled={isCreating}
            className="flex items-center gap-2 bg-[#FACC15] hover:bg-[#EAB308] text-[#394887] px-4 py-2 rounded-lg font-bold transition-colors disabled:opacity-50 shadow-sm"
          >
            <LogOut size={18} /> {dict.adminKantor?.absensi?.btnOpenOut || "Buka Sesi Pulang"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">{dict.adminKantor?.absensi?.loading || "Memuat sesi..."}</div>
        ) : !sessions || sessions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{dict.adminKantor?.absensi?.noData || "Belum ada sesi absensi."}</div>
        ) : (
          <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto min-w-[800px]">
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
              {sessions.map((sesi: any) => (
                <tr key={sesi.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4">{new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(sesi.tanggal))}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded-md border ${
                      sesi.jenisAbsen === 'MASUK' ? 'bg-[#394887]/10 text-[#394887] border-[#394887]/20' : 'bg-[#EFC94B]/40 text-[#394887] border-[#EFC94B]/60'
                    }`}>
                      {sesi.jenisAbsen === 'MASUK' ? (dict.adminKantor?.absensi?.typeIn || "MASUK") : (dict.adminKantor?.absensi?.typeOut || "PULANG")}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded-md border ${
                      sesi.status === 'AKTIF' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      {sesi.status === 'AKTIF' ? (dict.adminKantor?.absensi?.statusActive || "AKTIF") : (dict.adminKantor?.absensi?.statusClosed || "DITUTUP")}
                    </span>
                  </td>
                  <td className="p-4">
                    {sesi.status === 'AKTIF' ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-lg tracking-widest text-[#394887] bg-[#394887]/10 px-2 py-1 rounded">
                          {sesi.id.substring(0, 6).toUpperCase()}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(sesi.id.substring(0, 6).toUpperCase());
                            showAlert(dict.notifications?.successTitle || "Disalin!", "Kode berhasil disalin ke clipboard.");
                          }}
                          className="p-1.5 text-gray-400 hover:text-[#394887] hover:bg-[#394887]/10 rounded-lg transition-colors"
                          title={dict.adminKantor?.absensi?.btnCopy || "Copy Kode"}
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 font-medium">- {dict.adminKantor?.absensi?.statusClosed || "CLOSED"} -</span>
                    )}
                  </td>
                  <td className="p-4">{sesi.jenisAbsen === 'MASUK' ? sesi._count.absensiMasuk : sesi._count.absensiPulang} {dict.adminKantor?.absensi?.people || "orang"}</td>
                  <td className="p-4">
                    <Link 
                      href={`/admin-kantor/absensi/${sesi.id}`}
                      className="inline-flex items-center gap-1.5 text-[#394887] hover:text-[#2D3A6E] text-sm font-bold"
                    >
                      <CheckCircle2 size={16} /> Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          
          {/* Mobile Card List View */}
          <div className="md:hidden flex flex-col divide-y divide-gray-100">
            {sessions.map((sesi: any) => (
              <div key={sesi.id} className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-gray-900">{new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(sesi.tanggal))}</span>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${
                    sesi.status === 'AKTIF' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-700 border-gray-200'
                  }`}>
                    {sesi.status === 'AKTIF' ? (dict.adminKantor?.absensi?.statusActive || "AKTIF") : (dict.adminKantor?.absensi?.statusClosed || "DITUTUP")}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-bold rounded-md border ${
                    sesi.jenisAbsen === 'MASUK' ? 'bg-[#394887]/10 text-[#394887] border-[#394887]/20' : 'bg-[#EFC94B]/40 text-[#394887] border-[#EFC94B]/60'
                  }`}>
                    {sesi.jenisAbsen === 'MASUK' ? (dict.adminKantor?.absensi?.typeIn || "MASUK") : (dict.adminKantor?.absensi?.typeOut || "PULANG")}
                  </span>
                  <span className="text-sm text-gray-500 font-medium">• {sesi.jenisAbsen === 'MASUK' ? sesi._count.absensiMasuk : sesi._count.absensiPulang} {dict.adminKantor?.absensi?.people || "orang"}</span>
                </div>

                {sesi.status === 'AKTIF' ? (
                  <div className="flex items-center justify-between mt-1 bg-gray-50 p-3 rounded-xl border border-gray-200 shadow-sm">
                    <div>
                      <div className="text-xs text-gray-500 font-medium mb-1">Kode OTP:</div>
                      <span className="font-mono font-black text-2xl tracking-widest text-[#394887]">
                        {sesi.id.substring(0, 6).toUpperCase()}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(sesi.id.substring(0, 6).toUpperCase());
                        showAlert(dict.notifications?.successTitle || "Disalin!", "Kode berhasil disalin ke clipboard.");
                      }}
                      className="p-3 bg-white border border-gray-200 text-gray-600 hover:text-[#394887] hover:border-[#394887] rounded-xl transition-all shadow-sm active:scale-95"
                      title={dict.adminKantor?.absensi?.btnCopy || "Copy Kode"}
                    >
                      <Copy size={20} />
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 font-medium py-3 text-center bg-gray-50 rounded-xl border border-gray-200">
                    - {dict.adminKantor?.absensi?.statusClosed || "CLOSED"} -
                  </div>
                )}
                
                <Link 
                  href={`/admin-kantor/absensi/${sesi.id}`}
                  className="mt-1 py-3 w-full flex justify-center items-center gap-2 bg-white border border-[#394887] text-[#394887] hover:bg-[#394887]/5 rounded-xl font-bold text-sm transition-all"
                >
                  <CheckCircle2 size={18} /> Detail Sesi
                </Link>
              </div>
            ))}
          </div>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        showCancel={modalConfig.type === "confirm"}
        confirmText={modalConfig.confirmText || (modalConfig.type === "confirm" ? (dict.notifications?.btnYesContinue || "Ya, Lanjutkan") : (dict.dashboard?.success || "Oke"))}
        cancelText={modalConfig.cancelText || (dict.dashboard?.btnCancel || "Batal")}
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
