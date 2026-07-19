"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";
import { useDictionary, useLocale } from "@/hooks/useDictionary";
import DashboardPasswordButton from "@/components/DashboardPasswordButton";
import { LogOut, RefreshCw } from "lucide-react";
import useSWR from "swr";

export default function ProfilPage() {
  const dict = useDictionary();
  const locale = useLocale();
  const router = useRouter();
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message: string; type: "confirm" | "alert"; onConfirm?: () => void; confirmTheme?: "blue" | "red" }>({
    isOpen: false,
    title: "",
    message: "",
    type: "alert"
  });

  const fetcher = (url: string) => fetch(url).then(res => res.json()).then(res => res.data);
  const { data: sessions, error, isLoading: isSwrLoading, mutate } = useSWR(`/api/absen-kantor/profil/sessions`, fetcher, { revalidateOnFocus: true });
  
  const isLoading = isSwrLoading && !sessions;

  const handleLogoutAll = async () => {
    try {
      const res = await fetch("/api/auth/logout-all", { method: "POST" });
      const result = await res.json();
      if (result.success) {
        setModalConfig({
          isOpen: true,
          title: dict.notifications?.successTitle || "Berhasil",
          message: dict.notifications?.saveSuccess || "Berhasil keluar dari semua perangkat.",
          type: "alert",
          onConfirm: () => { window.location.href = "/absen-kantor/login"; }
        });
      }
    } catch (e) {
      console.error(e);
      setModalConfig({ isOpen: true, title: dict.notifications?.errorTitle || "Error", message: dict.notifications?.errorSystem || "Terjadi kesalahan.", type: "alert" });
    }
  };

  const confirmLogoutAll = () => {
    setModalConfig({
      isOpen: true,
      title: dict.notifications?.warningTitle || "Peringatan",
      message: dict.notifications?.logoutAllConfirm || "Anda akan keluar dari semua perangkat yang terhubung (termasuk perangkat ini). Lanjutkan?",
      type: "confirm",
      confirmTheme: "red",
      onConfirm: handleLogoutAll
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{dict.sidebar.profile}</h1>
          <p className="text-gray-500 mt-1">{dict.profile.subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => mutate()} className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hidden md:flex items-center gap-2 transition-colors">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="md:hidden grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1">
          <DashboardPasswordButton label={dict.sidebar.changePassword} />
        </div>
        <form action="/api/auth/logout" method="POST" className="bg-white rounded-xl shadow-sm border border-gray-100 p-1">
          <button type="submit" className="w-full text-left px-4 py-2 flex items-center justify-center gap-2 text-red-600 font-bold hover:bg-red-50 rounded-lg transition-colors">
            <LogOut size={18} />
            <span>{dict.sidebar.logout}</span>
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 md:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{dict.sidebar.profile}</h2>
            <p className="text-sm text-gray-500 mt-1">{dict.profile.secTitle}</p>
          </div>
          <button 
            onClick={confirmLogoutAll}
            className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 text-sm border border-red-200 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {dict.sidebar.logout}
          </button>
        </div>
        
        <div className="p-0">
          {isLoading ? (
            <div className="p-6 text-center text-gray-500">{dict.dashboard.loading}</div>
          ) : sessions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">{dict.dashboard.noHistory}</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {sessions.map((s: any) => {
                const isRevoked = !!s.revokedAt;
                const isExpired = new Date(s.expiresAt) < new Date();
                const isActive = !isRevoked && !isExpired;
                
                return (
                  <li key={s.id} className={`p-6 flex items-center justify-between transition-colors ${isActive ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl mt-1 ${isActive ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className={`font-bold ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                          {s.deviceInfo || (dict.profile?.unknownDevice || "Perangkat Tidak Dikenal")}
                        </p>
                        <div className="text-sm text-gray-500 space-y-0.5 mt-1">
                          <p>IP Address: <span className="font-mono text-xs">{s.ipAddress || "Unknown"}</span></p>
                          <p>{dict.profile?.lastActivity || "Aktivitas Terakhir:"} {new Date(s.lastUsedAt).toLocaleString(locale)}</p>
                          {isRevoked && <p className="text-red-500 font-medium">{dict.profile?.sessionRevoked || "Sesi telah dicabut pada"} {new Date(s.revokedAt).toLocaleString(locale)}</p>}
                          {isExpired && !isRevoked && <p className="text-orange-500 font-medium">{dict.profile?.sessionExpired || "Sesi telah kedaluwarsa"}</p>}
                        </div>
                      </div>
                    </div>
                    <div>
                      {isActive && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">
                          {dict.profile?.activeStatus || "Sedang Aktif"}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
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
