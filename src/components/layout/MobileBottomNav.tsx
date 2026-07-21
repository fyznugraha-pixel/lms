"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Briefcase, CalendarClock, User, FileText } from "lucide-react";
import { useState, useEffect } from "react";

export default function MobileBottomNav({ dict, role, totalFeedbackCount = 0 }: { dict: any; role: string, totalFeedbackCount?: number }) {
  const pathname = usePathname();
  const [newFeedbackCount, setNewFeedbackCount] = useState(0);

  useEffect(() => {
    // When visiting the work log page, reset the badge and store the current total
    if (pathname === "/absen-kantor/pekerjaan") {
      localStorage.setItem("lastViewedFeedbackCount", totalFeedbackCount.toString());
      setNewFeedbackCount(0);
      return;
    }

    // Otherwise, check if there are new feedbacks compared to the last time they viewed it
    const storedCount = parseInt(localStorage.getItem("lastViewedFeedbackCount") || "0", 10);

    if (totalFeedbackCount > storedCount) {
      setNewFeedbackCount(totalFeedbackCount - storedCount);
    } else {
      setNewFeedbackCount(0);
    }
  }, [pathname, totalFeedbackCount]);

  const navItems = [
    { name: dict.bottomNav?.home || "Home", href: "/absen-kantor", icon: Home },
    { name: dict.bottomNav?.workLog || "Kerja", href: "/absen-kantor/pekerjaan", icon: Briefcase },
    { name: dict.bottomNav?.recap || "Rekap", href: "/absen-kantor/rekap", icon: FileText },
    { name: dict.sidebar?.leaveRequest || dict.bottomNav?.leave || "Izin", href: "/absen-kantor/izin", icon: CalendarClock },
    { name: dict.bottomNav?.profile || "Profil", href: "/absen-kantor/profil", icon: User },
  ];

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around z-50 px-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center w-full py-3 gap-1 transition-colors ${
                isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <div className="relative flex items-center justify-center w-[22px] h-[22px]">
                <item.icon className={`w-full h-full ${isActive ? "fill-blue-100" : ""}`} />
                {item.href === "/absen-kantor/pekerjaan" && newFeedbackCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                    {newFeedbackCount > 9 ? "9+" : newFeedbackCount}
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
