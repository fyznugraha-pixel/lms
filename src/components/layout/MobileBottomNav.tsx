"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Briefcase, CalendarClock, User, Menu } from "lucide-react";

export default function MobileBottomNav({ dict, role }: { dict: any; role: string }) {
  const pathname = usePathname();

  const navItems = [
    { name: dict.sidebar.dashboard || "Home", href: "/absen-kantor", icon: Home },
    { name: dict.sidebar.workLog || "Pekerjaan", href: "/absen-kantor/pekerjaan", icon: Briefcase },
    { name: dict.sidebar.leaveRequest || "Izin", href: "/absen-kantor/izin", icon: CalendarClock },
    { name: dict.sidebar.profile || "Profil", href: "/absen-kantor/profil", icon: User },
  ];

  if (role === 'ADMIN_KANTOR' || role === 'SUPER_ADMIN' || role === 'PENANGGUNG_JAWAB_ABSEN') {
    navItems.splice(2, 0, { name: "Admin", href: "/admin-kantor", icon: Menu });
  }

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around z-50 px-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full py-3 gap-1 transition-colors ${
                isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <item.icon className={`w-[22px] h-[22px] ${isActive ? "fill-blue-100" : ""}`} />
              <span className="text-[10px] font-bold">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
