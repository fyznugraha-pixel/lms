import { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";

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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Khusus Kantor */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">TactLink</h2>
          <p className="text-sm text-gray-500">Admin Office Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin-kantor/karyawan" className="block px-4 py-2.5 hover:bg-gray-50 text-gray-700 font-medium rounded-lg">
            Manajemen Karyawan
          </Link>
          <Link href="/admin-kantor/persetujuan" className="block px-4 py-2.5 hover:bg-gray-50 text-gray-700 font-medium rounded-lg">
            Persetujuan Izin & Sakit
          </Link>
          <Link href="/admin-kantor/rekap" className="block px-4 py-2.5 bg-blue-50 text-blue-700 font-medium rounded-lg">
            Rekap & Export CSV
          </Link>
          <Link href="/absen-kantor" className="block px-4 py-2.5 hover:bg-gray-50 text-gray-700 font-medium rounded-lg mt-2">
            Masuk Portal Karyawan
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="w-full text-left px-4 py-2 text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors">
              Keluar
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        {children}
      </main>
    </div>
  );
}
