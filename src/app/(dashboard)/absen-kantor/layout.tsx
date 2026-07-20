import { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import DashboardPasswordButton from "@/components/DashboardPasswordButton";
import LanguageToggle from "@/components/LanguageToggle";
import SidebarLink from "@/components/SidebarLink";
import { getDictionary } from "@/lib/dictionaries";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import MobileTopHeader from "@/components/layout/MobileTopHeader";
import AdminMobileMenu from "@/components/layout/AdminMobileMenu";

export default async function AbsenKantorLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const payload = await verifyToken(token);
  if (!payload || !['KARYAWAN', 'ADMIN_KANTOR', 'SUPER_ADMIN'].includes(payload.role as string)) {
    redirect("/login");
  }

  const langCookie = cookieStore.get("lang")?.value || "en";
  const dict = getDictionary(langCookie);

  return (
    <div className="min-h-[100dvh] md:h-screen bg-gray-50 flex flex-col md:flex-row md:overflow-hidden pb-[72px] md:pb-0 overflow-x-hidden w-full max-w-[100vw]">
      <MobileTopHeader langCookie={langCookie} role={payload.role as string} />
      
      {/* Sidebar Khusus Kantor (Hidden on Mobile) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-shrink-0 flex-col">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo/LOGO%20TACTLINK%20TRANSPARAN.png" alt="TactLink Logo" className="h-10 w-auto object-contain" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">TactLink</h2>
              <p className="text-sm text-gray-500">Employee Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-auto">
          {/* Menu Karyawan */}
          <SidebarLink href="/absen-kantor" exact={true}>
            {dict.sidebar.dashboard}
          </SidebarLink>
          <SidebarLink href="/absen-kantor/izin">
            {dict.sidebar.leaveRequest}
          </SidebarLink>
          <SidebarLink href="/absen-kantor/rekap">
            {dict.sidebar.myAttendance}
          </SidebarLink>
          <SidebarLink href="/absen-kantor/pekerjaan">
            {dict.sidebar.workLog}
          </SidebarLink>
          <SidebarLink href="/absen-kantor/profil">
            {dict.sidebar.profile}
          </SidebarLink>
          
          {/* Menu Penanggung Jawab Absen */}
          {(payload.role === 'SUPER_ADMIN') && (
            <div className="pt-2">
              <SidebarLink href="/absen-kantor/penanggung-jawab">
                {dict.sidebar.generateSession}
              </SidebarLink>
            </div>
          )}

          {/* Menu Admin Kantor */}
          {(payload.role === 'ADMIN_KANTOR' || payload.role === 'SUPER_ADMIN') && (
            <div className="pt-2">
              <SidebarLink href="/admin-kantor/persetujuan">
                {dict.sidebar.approval}
              </SidebarLink>
            </div>
          )}

          {(payload.role === 'ADMIN_KANTOR' || payload.role === 'SUPER_ADMIN') && (
            <SidebarLink href="/admin-kantor/karyawan">
              {dict.sidebar.manageEmployees}
            </SidebarLink>
          )}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <LanguageToggle currentLang={langCookie} />
          <DashboardPasswordButton label={dict.sidebar.changePassword} />
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="w-full text-left px-4 py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors flex items-center gap-3">
              {dict.sidebar.logout}
            </button>

          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pt-[73px] md:pt-8 p-4 md:p-8 md:overflow-auto flex flex-col min-w-0 w-full">
        {children}
      </main>

      <MobileBottomNav dict={dict} role={payload.role as string} />
    </div>
  );
}
