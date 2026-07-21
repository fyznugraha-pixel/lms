"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import ConfirmModal from "@/components/ConfirmModal";
import DigitalClock from "@/components/DigitalClock";
import StatusBadge from "@/components/StatusBadge";
import { useDictionary, useLocale } from "@/hooks/useDictionary";

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
  const dict = useDictionary();
  const locale = useLocale();

  const fetcher = (url: string) => fetch(url).then(res => res.json()).then(res => res.data);
  const { data, error, isLoading: isSwrLoading, mutate } = useSWR<{
    absensiHariIni: AbsensiHariIni;
    bisaAbsenMasuk: boolean;
    tokenMasukStr: string | null;
    bisaAbsenPulang: boolean;
    tokenPulangStr: string | null;
    histori: HistoriAbsen[];
  }>("/api/absen-kantor/absen", fetcher, { revalidateOnFocus: true });

  const isLoading = isSwrLoading && !data;
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  // Custom Alert Modal
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; title: string; message: string; theme: "blue"|"red"|"amber" }>({
    isOpen: false, title: "", message: "", theme: "blue"
  });

  // Modal Klarifikasi
  const [isKlarifikasiModalOpen, setIsKlarifikasiModalOpen] = useState(false);
  const [klarifikasiDate, setKlarifikasiDate] = useState("");
  const [klarifikasiAlasan, setKlarifikasiAlasan] = useState("");
  
  // OTP Input
  const [kodeMasuk, setKodeMasuk] = useState("");
  const [kodePulang, setKodePulang] = useState("");

  const handleAbsen = async (jenisAbsen: "MASUK" | "PULANG") => {
    const kode = jenisAbsen === "MASUK" ? kodeMasuk : kodePulang;
    
    if (!kode.trim()) {
      setAlertModal({ isOpen: true, title: dict.notifications?.warningTitle || "Peringatan", message: dict.dashboard?.codeRequired || "Kode absen wajib diisi!", theme: "amber" });
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await fetch("/api/absen-kantor/absen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenisAbsen, kode })
      });
      const result = await res.json();
      if (result.success) {
        const successMessage = jenisAbsen === "MASUK" 
          ? (dict.dashboard?.successCheckIn || "Successfully checked in!") 
          : (dict.dashboard?.successCheckOut || "Successfully checked out!");
          
        setAlertModal({ isOpen: true, title: dict.notifications?.successTitle || "Berhasil", message: successMessage, theme: "blue" });
        if (jenisAbsen === "MASUK") setKodeMasuk("");
        if (jenisAbsen === "PULANG") setKodePulang("");
        mutate();
      } else {
        setAlertModal({ isOpen: true, title: dict.notifications?.errorTitle || "Gagal", message: result.error, theme: "red" });
      }
    } catch (error) {
      setAlertModal({ isOpen: true, title: dict.notifications?.errorTitle || "Error", message: dict.notifications?.errorSystem || "Terjadi kesalahan sistem.", theme: "red" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const formatJam = (isoString: string | null) => {
    if (!isoString) return "--:--";
    return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(isoString));
  };

  const formatTanggal = (isoString: string) => {
    return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(isoString));
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
        setAlertModal({ isOpen: true, title: dict.notifications?.successTitle || "Berhasil", message: result.message || "Klarifikasi terkirim", theme: "blue" });
        setIsKlarifikasiModalOpen(false);
        setKlarifikasiDate("");
        setKlarifikasiAlasan("");
        mutate();
      } else {
        setAlertModal({ isOpen: true, title: dict.notifications?.errorTitle || "Gagal", message: result.error, theme: "red" });
      }
    } catch (error) {
      setAlertModal({ isOpen: true, title: dict.notifications?.errorTitle || "Error", message: dict.notifications?.errorSystem || "Kesalahan sistem saat mengirim klarifikasi.", theme: "red" });
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Update Information Card */}
      <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl mb-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-blue-900">{dict.dashboard?.updateTitle || "System Update"}</h3>
            <ul className="text-sm text-blue-800 mt-2 list-disc list-inside space-y-1">
              <li>{dict.dashboard?.updateInfo2 || "Update info 2"}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Header & Clock */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 md:p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{dict.sidebar.dashboard}</h1>
          <p className="text-gray-500 mt-1 capitalize">
            {new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button onClick={() => mutate()} className="text-sm font-medium text-[#394887] hover:text-[#2D3A6E] bg-[#F4F6FB] px-3 py-1.5 rounded-lg border border-[#D1D9F0] hidden md:flex items-center gap-2 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            Refresh Data
          </button>
          <DigitalClock label={dict.dashboard.serverTime} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">{dict.dashboard.loading}</p>
        </div>
      ) : (
        <>
          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kartu Absen Masuk */}
            <div className={`rounded-xl p-5 md:p-6 shadow-sm border ${data?.absensiHariIni?.waktuAbsenMasuk ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'} transition-all`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full ${data?.absensiHariIni?.waktuAbsenMasuk ? 'bg-green-100 text-green-600' : 'bg-[#F4F6FB] text-[#394887]'}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{dict.dashboard.btnCheckIn}</h3>
                </div>
                {data?.absensiHariIni?.waktuAbsenMasuk && (
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">{dict.dashboard.success}</span>
                )}
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-500 font-medium">{dict.dashboard.timeIn}</p>
                <p className={`text-3xl font-black ${data?.absensiHariIni?.waktuAbsenMasuk ? 'text-green-700' : 'text-gray-900'}`}>
                  {formatJam(data?.absensiHariIni?.waktuAbsenMasuk || null)}
                </p>
              </div>

              {!data?.absensiHariIni?.waktuAbsenMasuk && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder={dict.dashboard.placeholderCode}
                    value={kodeMasuk}
                    onChange={(e) => setKodeMasuk(e.target.value.toUpperCase())}
                    maxLength={6}
                    disabled={!data?.bisaAbsenMasuk || isActionLoading}
                    className="w-full text-center tracking-widest uppercase font-mono text-lg font-bold px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                  />
                  <button
                    onClick={() => handleAbsen("MASUK")}
                    disabled={!data?.bisaAbsenMasuk || isActionLoading || kodeMasuk.length < 6}
                    className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-md ${
                      !data?.bisaAbsenMasuk || kodeMasuk.length < 6
                        ? "bg-gray-300 cursor-not-allowed shadow-none"
                        : "bg-[#394887] hover:bg-[#2D3A6E]"
                    }`}
                  >
                    {isActionLoading ? dict.dashboard.btnProcessing : data?.bisaAbsenMasuk ? dict.dashboard.btnCheckIn : dict.dashboard.sessionNotOpened}
                  </button>
                </div>
              )}
            </div>

            {/* Kartu Absen Pulang */}
            <div className={`rounded-xl p-5 md:p-6 shadow-sm border ${data?.absensiHariIni?.waktuAbsenPulang ? 'bg-[#F4F6FB] border-[#D1D9F0]' : 'bg-white border-gray-100'} transition-all`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-full ${data?.absensiHariIni?.waktuAbsenPulang ? 'bg-[#D1D9F0] text-[#394887]' : 'bg-[#FDF8E7] text-[#EFC94B]'}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{dict.dashboard.btnCheckOut}</h3>
                </div>
                {data?.absensiHariIni?.waktuAbsenPulang && (
                  <span className="bg-[#D1D9F0] text-[#394887] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">{dict.dashboard.success}</span>
                )}
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-500 font-medium">{dict.dashboard.timeOut}</p>
                <p className={`text-3xl font-black ${data?.absensiHariIni?.waktuAbsenPulang ? 'text-[#394887]' : 'text-gray-900'}`}>
                  {formatJam(data?.absensiHariIni?.waktuAbsenPulang || null)}
                </p>
              </div>

              {!data?.absensiHariIni?.waktuAbsenPulang && (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder={dict.dashboard.placeholderCode}
                    value={kodePulang}
                    onChange={(e) => setKodePulang(e.target.value.toUpperCase())}
                    maxLength={6}
                    disabled={!data?.bisaAbsenPulang || !data?.absensiHariIni?.waktuAbsenMasuk || isActionLoading}
                    className="w-full text-center tracking-widest uppercase font-mono text-lg font-bold px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                  />
                  <button
                    onClick={() => handleAbsen("PULANG")}
                    disabled={!data?.bisaAbsenPulang || !data?.absensiHariIni?.waktuAbsenMasuk || isActionLoading || kodePulang.length < 6}
                    className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-md ${
                      !data?.bisaAbsenPulang || !data?.absensiHariIni?.waktuAbsenMasuk || kodePulang.length < 6
                        ? "bg-gray-300 cursor-not-allowed shadow-none"
                        : "bg-[#394887] hover:bg-[#2D3A6E]"
                    }`}
                  >
                    {isActionLoading ? dict.dashboard.btnProcessing : !data?.absensiHariIni?.waktuAbsenMasuk
                      ? dict.dashboard.notCheckedIn
                      : data?.bisaAbsenPulang 
                        ? dict.dashboard.btnCheckOut 
                        : dict.dashboard.sessionNotOpened}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Access Pekerjaan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Link href="/absen-kantor/pekerjaan" className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-[#D1D9F0] transition-all group block">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#F4F6FB] text-[#394887] rounded-xl group-hover:bg-[#394887] group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#394887] transition-colors">{dict.dashboard.todoTitle}</h3>
                  <p className="text-sm text-gray-500">{dict.dashboard.todoDesc}</p>
                </div>
              </div>
            </Link>

            <Link href="/absen-kantor/pekerjaan" className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:border-[#D1D9F0] transition-all group block">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#FDF8E7] text-[#EFC94B] rounded-xl group-hover:bg-[#EFC94B] group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#EFC94B] transition-colors">{dict.dashboard.workLogTitle}</h3>
                  <p className="text-sm text-gray-500">{dict.dashboard.workLogDesc}</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Histori Absen */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">{dict.dashboard.historyTitle}</h2>
            </div>
            {data?.histori && data.histori.length > 0 ? (
              <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                      <th className="px-6 py-4 font-semibold">{dict.dashboard.colDate}</th>
                      <th className="px-6 py-4 font-semibold">{dict.dashboard.colIn}</th>
                      <th className="px-6 py-4 font-semibold">{dict.dashboard.colOut}</th>
                      <th className="px-6 py-4 font-semibold">{dict.dashboard.colDuration}</th>
                      <th className="px-6 py-4 font-semibold">{dict.dashboard.colStatus}</th>
                      <th className="px-6 py-4 font-semibold text-right">{dict.dashboard.colAction}</th>
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
                          <StatusBadge status={h.isIncomplete ? 'INCOMPLETE' : h.status} />
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
                                {dict.dashboard.clarify}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile Card List View */}
              <div className="md:hidden flex flex-col divide-y divide-gray-100">
                {data.histori.map((h) => (
                  <div key={h.id} className="p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-gray-900">{formatTanggal(h.tanggal)}</span>
                      <StatusBadge status={h.isIncomplete ? 'INCOMPLETE' : h.status} />
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>Masuk: {formatJam(h.waktuAbsenMasuk)} <span className="mx-2 text-gray-300">|</span> Pulang: {formatJam(h.waktuAbsenPulang)}</p>
                      <p className="mt-1">Durasi: <span className="font-medium text-gray-900">{h.durasiKerja ? `${Math.floor(h.durasiKerja / 60)}j ${h.durasiKerja % 60}m` : '-'}</span></p>
                    </div>
                    {h.isIncomplete && (
                      <div className="mt-1">
                        <button 
                          onClick={() => {
                            setKlarifikasiDate(h.tanggal);
                            setIsKlarifikasiModalOpen(true);
                          }}
                          className="text-sm text-[#394887] hover:text-[#2D3A6E] font-bold underline"
                        >
                            {dict.dashboard.clarify}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              </>
            ) : (
              <div className="p-12 text-center text-gray-500">
                {dict.dashboard.noHistory}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal Klarifikasi */}
      {isKlarifikasiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md my-8 relative">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">{dict.dashboard.clarifyTitle}</h2>
              <button onClick={() => setIsKlarifikasiModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                &times;
              </button>
            </div>
            <form onSubmit={handleKlarifikasi} className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                {dict.dashboard.clarifyDesc} <strong>{formatTanggal(klarifikasiDate)}</strong>.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{dict.dashboard.clarifyReason}</label>
                <textarea 
                  required
                  rows={4}
                  value={klarifikasiAlasan}
                  onChange={(e) => setKlarifikasiAlasan(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder={dict.dashboard.clarifyPlaceholder}
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsKlarifikasiModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {dict.dashboard.btnCancel}
                </button>
                <button 
                  type="submit" 
                  disabled={isActionLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#394887] hover:bg-[#2D3A6E] rounded-lg transition-colors disabled:bg-gray-400"
                >
                  {isActionLoading ? dict.dashboard.btnProcessing : dict.dashboard.btnSubmit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      <ConfirmModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        confirmText="Oke"
        confirmTheme={alertModal.theme}
        showCancel={false}
        onConfirm={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        onCancel={() => {}}
      />
    </div>
  );
}
