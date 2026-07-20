"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDictionary } from "@/hooks/useDictionary";
import { ArrowRightLeft } from "lucide-react";

export default function AdminKantorSidebarNav() {
  const pathname = usePathname();
  const dict = useDictionary();

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
                ? "block px-4 py-2.5 mt-6 mb-2 font-bold text-indigo-700 bg-indigo-50/80 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-between group"
                : `block px-4 py-2.5 font-medium rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`
            }
          >
            {item.name}
            {item.isPortal && <ArrowRightLeft className="w-4 h-4 text-indigo-400 group-hover:text-indigo-700 transition-colors" />}
          </Link>
        );
      })}
      
    </nav>
  );
}
