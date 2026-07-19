"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, FileCheck, CheckSquare, BarChart, Home } from "lucide-react";
import { useDictionary } from "@/hooks/useDictionary";

export default function AdminMobileBottomNav() {
  const pathname = usePathname();
  const dict = useDictionary();

  const navItems = [
    { name: dict.adminKantor?.persetujuan?.title || "Persetujuan", href: "/admin-kantor/persetujuan", icon: FileCheck },
    { name: dict.adminKantor?.karyawan?.title || "Karyawan", href: "/admin-kantor/karyawan", icon: Users },
    { name: dict.adminKantor?.absensi?.title || "Sesi", href: "/admin-kantor/absensi", icon: CheckSquare },
    { name: dict.bottomNav?.recap || "Rekap", href: "/admin-kantor/rekap", icon: BarChart },
    { name: dict.bottomNav?.home || "Home", href: "/absen-kantor", icon: Home },
  ];

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around z-50 px-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href) && item.href !== "/absen-kantor";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full py-3 gap-1 transition-colors ${
                isActive ? "text-indigo-600" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <item.icon className={`w-[22px] h-[22px] ${isActive ? "fill-indigo-100" : ""}`} />
              <span className="text-[10px] font-bold">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
