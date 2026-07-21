"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function WorkLogSidebarLink({
  href,
  label,
  totalFeedbackCount
}: {
  href: string;
  label: string;
  totalFeedbackCount: number;
}) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);
  const [newFeedbackCount, setNewFeedbackCount] = useState(0);

  useEffect(() => {
    // When visiting the work log page, reset the badge and store the current total
    if (pathname === href) {
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
  }, [pathname, totalFeedbackCount, href]);

  return (
    <Link
      href={href}
      className={`flex items-center justify-between gap-3 px-4 py-2.5 font-medium rounded-lg transition-colors ${
        isActive
          ? "bg-blue-50 text-blue-700 shadow-sm"
          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <div className="flex-1 leading-tight">{label}</div>
      {newFeedbackCount > 0 && (
        <span className="bg-amber-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0">
          {newFeedbackCount > 99 ? "99+" : newFeedbackCount}
        </span>
      )}
    </Link>
  );
}
