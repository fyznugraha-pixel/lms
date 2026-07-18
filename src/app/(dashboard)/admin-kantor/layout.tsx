import { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import DashboardPasswordButton from "@/components/DashboardPasswordButton";
import AdminKantorSidebarNav from "./AdminKantorSidebarNav";
import AdminMobileBottomNav from "@/components/layout/AdminMobileBottomNav";
import MobileTopHeader from "@/components/layout/MobileTopHeader";

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

  return (
    <div className="min-h-[100dvh] md:h-screen bg-gray-50 flex flex-col md:flex-row md:overflow-hidden pb-[72px] md:pb-0">
      <MobileTopHeader langCookie={langCookie} />
      
      {/* Sidebar Khusus Kantor */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-gray-200">
          <Link href="/admin-kantor" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/logo/LOGO%20TACTLINK.png" alt="TactLink Logo" className="h-10 w-auto object-contain" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">TactLink</h2>
              <p className="text-sm text-gray-500">Admin Office Portal</p>
            </div>
          </Link>
        </div>
        <AdminKantorSidebarNav />
        <div className="p-4 border-t border-gray-200">
          <DashboardPasswordButton />
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="w-full text-left px-4 py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors flex items-center gap-3">
              Keluar
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 md:overflow-auto flex flex-col">
        {children}
      </main>

      <AdminMobileBottomNav />
    </div>
  );
}
