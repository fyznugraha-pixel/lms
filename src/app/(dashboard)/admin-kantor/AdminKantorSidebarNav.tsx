"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDictionary } from "@/hooks/useDictionary";
import { ArrowRightLeft, Bell } from "lucide-react";
import { useState, useEffect } from "react";

export default function AdminKantorSidebarNav({ pendingLeaveCount = 0 }: { pendingLeaveCount?: number }) {
  const pathname = usePathname();
  const dict = useDictionary();
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // Only show toast if there are pending leaves and we haven't shown it yet in this session
    if (pendingLeaveCount > 0 && !sessionStorage.getItem("hasShownPendingToast")) {
      setShowToast(true);
      sessionStorage.setItem("hasShownPendingToast", "true");
      // Auto hide after 5 seconds
      setTimeout(() => setShowToast(false), 5000);
    }
  }, [pendingLeaveCount]);

  const navItems = [
    { name: dict.adminKantor?.sidebar?.dashboard || "Dashboard", href: "/admin-kantor" },
    { name: dict.adminKantor?.sidebar?.employeeManagement || "Manajemen Karyawan", href: "/admin-kantor/karyawan" },
    { name: dict.adminKantor?.sidebar?.leaveApproval || "Persetujuan Izin & Sakit", href: "/admin-kantor/persetujuan" },
    { name: dict.adminKantor?.sidebar?.recapExport || "Rekap & Export CSV", href: "/admin-kantor/rekap" },
    { name: dict.adminKantor?.sidebar?.attendanceSession || "Sesi Absensi", href: "/admin-kantor/absensi" },
    { name: dict.adminKantor?.sidebar?.workLog || "Log Pekerjaan", href: "/admin-kantor/worklog" },
    { name: dict.adminKantor?.sidebar?.enterEmployeePortal || "Masuk Portal Karyawan", href: "/absen-kantor", isPortal: true },
  ];

  return (
    <nav className="flex-1 p-4 space-y-2">
      {navItems.map((item) => {
        // Strict match for dashboard, startWith for others
        const isActive = item.href === "/admin-kantor" 
          ? pathname === "/admin-kantor" 
          : pathname.startsWith(item.href);
          
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              item.isPortal
                ? "flex px-4 py-2.5 mt-6 mb-2 font-bold text-indigo-700 bg-indigo-50/80 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors items-center justify-between gap-3 group"
                : `flex px-4 py-2.5 font-medium rounded-lg transition-colors items-center justify-between gap-3 ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`
            }
          >
            <div className="flex-1 leading-tight">
              {item.name}
            </div>
            {item.isPortal && <ArrowRightLeft className="w-4 h-4 text-indigo-400 group-hover:text-indigo-700 transition-colors" />}
            
            {/* Notification Badge for pending leaves */}
            {item.href === "/admin-kantor/persetujuan" && pendingLeaveCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0">
                {pendingLeaveCount > 99 ? "99+" : pendingLeaveCount}
              </span>
            )}
          </Link>
        );
      })}
      
      {/* Floating Toast Notification */}
      {showToast && (
        <div className="fixed top-20 right-6 bg-white border-l-4 border-amber-400 p-4 rounded shadow-lg z-50 flex items-start gap-3 animate-in fade-in slide-in-from-top-5 max-w-sm">
          <Bell className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Ada Pengajuan Baru!</h4>
            <p className="text-xs text-gray-600 mt-1">
              Terdapat <strong>{pendingLeaveCount}</strong> pengajuan izin/sakit yang menunggu persetujuan Anda.
            </p>
          </div>
          <button onClick={() => setShowToast(false)} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>
      )}
      
    </nav>
  );
}
