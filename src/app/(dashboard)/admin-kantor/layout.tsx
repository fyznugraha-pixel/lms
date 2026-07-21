import { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import DashboardPasswordButton from "@/components/DashboardPasswordButton";
import LanguageToggle from "@/components/LanguageToggle";
import AdminKantorSidebarNav from "./AdminKantorSidebarNav";
import AdminMobileBottomNav from "@/components/layout/AdminMobileBottomNav";
import MobileTopHeader from "@/components/layout/MobileTopHeader";
import { getDictionary } from "@/lib/dictionaries";
import prisma from "@/lib/prisma";

export default async function AdminKantorLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const payload = await verifyToken(token);
  if (!payload || (payload.role !== "ADMIN_KANTOR" && payload.role !== "SUPER_ADMIN")) {
    redirect("/login");
  }
  const langCookie = cookieStore.get("lang")?.value || "en";
  const dict = getDictionary(langCookie);

  // Fetch pending leave request count
  const pendingLeaveCount = await prisma.pengajuanIzin.count({
    where: { status: "PENDING" }
  });

  // Fetch today's work log count
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayWorkLogCount = await prisma.workLog.count({
    where: { createdAt: { gte: today } }
  });

  return (
    <div className="min-h-[100dvh] md:h-screen bg-gray-50 flex flex-col md:flex-row md:overflow-hidden pb-[72px] md:pb-0 overflow-x-hidden w-full max-w-[100vw]">
      <MobileTopHeader langCookie={langCookie} role={payload.role as string} />
      
      {/* Sidebar Khusus Kantor */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-gray-200">
          <Link href="/admin-kantor" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/logo/LOGO%20TACTLINK%20TRANSPARAN.png" alt="TactLink Logo" className="h-10 w-auto object-contain" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">TactLink</h2>
              <p className="text-sm text-gray-500">Admin Office Portal</p>
            </div>
          </Link>
        </div>
        <AdminKantorSidebarNav pendingLeaveCount={pendingLeaveCount} todayWorkLogCount={todayWorkLogCount} />
        <div className="p-4 border-t border-gray-200">
          <LanguageToggle currentLang={langCookie} />
          <Link href="/admin-kantor/profil" className="w-full text-left px-4 py-2 flex items-center gap-3 text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-colors mb-1">
            <svg className="w-[18px] h-[18px] text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{dict.sidebar?.profile || "Profil & Perangkat"}</span>
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="w-full text-left px-4 py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors flex items-center gap-3">
              {dict.sidebar?.logout || "Keluar"}
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pt-[73px] p-6 md:p-10 md:pt-10 md:overflow-auto flex flex-col min-w-0 w-full">
        {children}
      </main>

      <AdminMobileBottomNav pendingLeaveCount={pendingLeaveCount} todayWorkLogCount={todayWorkLogCount} />
    </div>
  );
}
