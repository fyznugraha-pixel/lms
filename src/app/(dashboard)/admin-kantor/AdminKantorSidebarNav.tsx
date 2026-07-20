"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDictionary } from "@/hooks/useDictionary";

export default function AdminKantorSidebarNav() {
  const pathname = usePathname();
  const dict = useDictionary();

  const navItems = [
    { name: dict.adminKantor?.sidebar?.dashboard || "Dashboard", href: "/admin-kantor" },
    { name: dict.adminKantor?.sidebar?.employeeManagement || "Manajemen Karyawan", href: "/admin-kantor/karyawan" },
    { name: dict.adminKantor?.sidebar?.leaveApproval || "Persetujuan Izin & Sakit", href: "/admin-kantor/persetujuan" },
    { name: dict.adminKantor?.sidebar?.recapExport || "Rekap & Export CSV", href: "/admin-kantor/rekap" },
    { name: dict.adminKantor?.sidebar?.attendanceSession || "Sesi Absensi", href: "/admin-kantor/absensi" },
    { name: "Log Pekerjaan", href: "/admin-kantor/worklog" },
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
            className={`block px-4 py-2.5 font-medium rounded-lg transition-colors ${
              isActive
                ? "bg-blue-50 text-blue-700"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            {item.name}
          </Link>
        );
      })}
      
    </nav>
  );
}
