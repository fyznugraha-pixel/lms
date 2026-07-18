import { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";

export default async function AbsenKantorLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const payload = await verifyToken(token);
  if (!payload || !['KARYAWAN', 'PENANGGUNG_JAWAB_ABSEN', 'ADMIN_KANTOR', 'SUPER_ADMIN'].includes(payload.role as string)) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar Khusus Kantor */}
      <aside className="w-full md:w-64 bg-white border-b md:border-r border-gray-200 flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">TactLink</h2>
            <p className="text-sm text-gray-500">Employee Portal</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-auto">
          {/* Menu Karyawan */}
          <Link href="/absen-kantor" className="block px-4 py-2.5 hover:bg-gray-50 text-gray-700 font-medium rounded-lg">
            Dashboard Absensi
          </Link>
          <Link href="/absen-kantor/izin" className="block px-4 py-2.5 hover:bg-gray-50 text-gray-700 font-medium rounded-lg">
            Pengajuan Izin/Sakit
          </Link>
          <Link href="/absen-kantor/rekap" className="block px-4 py-2.5 hover:bg-gray-50 text-gray-700 font-medium rounded-lg">
            Rekap Kehadiran Saya
          </Link>
          <Link href="/absen-kantor/pekerjaan" className="block px-4 py-2.5 hover:bg-gray-50 text-gray-700 font-medium rounded-lg">
            Work Log & To-Do
          </Link>
          <Link href="/absen-kantor/profil" className="block px-4 py-2.5 hover:bg-gray-50 text-gray-700 font-medium rounded-lg">
            Profil & Perangkat
          </Link>
          
          {/* Menu Penanggung Jawab Absen */}
          {(payload.role === 'PENANGGUNG_JAWAB_ABSEN' || payload.role === 'SUPER_ADMIN') && (
            <Link href="/absen-kantor/penanggung-jawab" className="block px-4 py-2.5 bg-blue-50 text-blue-700 font-medium rounded-lg mt-2">
              Generate Sesi Absen
            </Link>
          )}

          {/* Menu Admin Kantor */}
          {(payload.role === 'ADMIN_KANTOR' || payload.role === 'PENANGGUNG_JAWAB_ABSEN' || payload.role === 'SUPER_ADMIN') && (
            <Link href="/admin-kantor/persetujuan" className="block px-4 py-2.5 hover:bg-gray-50 text-gray-700 font-medium rounded-lg mt-2">
              Persetujuan Pengajuan
            </Link>
          )}

          {(payload.role === 'ADMIN_KANTOR' || payload.role === 'SUPER_ADMIN') && (
            <Link href="/admin-kantor/karyawan" className="block px-4 py-2.5 hover:bg-gray-50 text-gray-700 font-medium rounded-lg">
              Kelola Karyawan
            </Link>
          )}
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
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
