"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminKantorSidebarNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/admin-kantor" },
    { name: "Manajemen Karyawan", href: "/admin-kantor/karyawan" },
    { name: "Persetujuan Izin & Sakit", href: "/admin-kantor/persetujuan" },
    { name: "Rekap & Export CSV", href: "/admin-kantor/rekap" },
    { name: "Sesi Absensi", href: "/admin-kantor/absensi" },
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
      
      <div className="pt-2">
        <Link
          href="/absen-kantor"
          className="block px-4 py-2.5 hover:bg-gray-50 text-gray-700 font-medium rounded-lg"
        >
          Masuk Portal Karyawan
        </Link>
      </div>
    </nav>
  );
}
