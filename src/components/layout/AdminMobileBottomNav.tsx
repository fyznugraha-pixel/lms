"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, FileCheck, CheckSquare, BarChart, Home, Briefcase } from "lucide-react";
import { useDictionary } from "@/hooks/useDictionary";
import { useState, useEffect } from "react";

export default function AdminMobileBottomNav({ pendingLeaveCount = 0, todayWorkLogCount = 0 }: { pendingLeaveCount?: number, todayWorkLogCount?: number }) {
  const pathname = usePathname();
  const dict = useDictionary();
  const [newWorkLogCount, setNewWorkLogCount] = useState(0);

  useEffect(() => {
    const currentDateString = new Date().toISOString().split('T')[0];
    
    if (pathname === "/admin-kantor/worklog") {
      localStorage.setItem('lastViewedWorkLogDate', currentDateString);
      localStorage.setItem('lastViewedWorkLogCount', todayWorkLogCount.toString());
      setNewWorkLogCount(0);
      return;
    }

    const storedDate = localStorage.getItem('lastViewedWorkLogDate');
    const storedCount = parseInt(localStorage.getItem('lastViewedWorkLogCount') || '0', 10);

    if (storedDate !== currentDateString) {
      setNewWorkLogCount(todayWorkLogCount);
    } else {
      if (todayWorkLogCount > storedCount) {
        setNewWorkLogCount(todayWorkLogCount - storedCount);
      } else {
        setNewWorkLogCount(0);
      }
    }
  }, [pathname, todayWorkLogCount]);

  const navItems = [
    { name: dict.bottomNav?.home || "Home", href: "/admin-kantor", icon: Home, exact: true },
    { name: dict.adminKantor?.persetujuan?.navLabel || "Persetujuan", href: "/admin-kantor/persetujuan", icon: FileCheck },
    { name: dict.adminKantor?.karyawan?.navLabel || "Karyawan", href: "/admin-kantor/karyawan", icon: Users },
    { name: dict.adminKantor?.absensi?.navLabel || "Sesi", href: "/admin-kantor/absensi", icon: CheckSquare },
    { name: dict.bottomNav?.recap || "Rekap", href: "/admin-kantor/rekap", icon: BarChart }
  ];

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around z-50 px-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = item.exact 
            ? pathname === item.href 
            : pathname.startsWith(item.href) && item.href !== "/absen-kantor";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center w-full py-3 gap-1 transition-colors ${
                isActive ? "text-indigo-600" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <div className="relative w-[22px] h-[22px]">
                <item.icon className={`w-[22px] h-[22px] ${isActive ? "fill-indigo-100" : ""}`} />
                {item.href === "/admin-kantor/persetujuan" && pendingLeaveCount > 0 && (
                  <span style={{ position: 'absolute', top: '-10px', right: '-12px', width: '16px', height: '16px' }} className="bg-red-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full border border-white">
                    {pendingLeaveCount > 9 ? "9+" : pendingLeaveCount}
                  </span>
                )}
                {item.href === "/admin-kantor/worklog" && newWorkLogCount > 0 && (
                  <span style={{ position: 'absolute', top: '-10px', right: '-12px', width: '16px', height: '16px' }} className="bg-amber-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full border border-white">
                    {newWorkLogCount > 9 ? "9+" : newWorkLogCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold whitespace-nowrap text-center">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
