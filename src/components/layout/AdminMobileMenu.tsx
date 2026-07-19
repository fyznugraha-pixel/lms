"use client";

import Link from "next/link";
import { ShieldAlert, LayoutDashboard } from "lucide-react";

export default function AdminMobileMenu({ role, dict }: { role: string; dict: any }) {
  if (role !== 'ADMIN_KANTOR' && role !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <div className="md:hidden p-4 pb-0">
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-indigo-900 text-sm">Mode Admin</h3>
            <p className="text-xs text-indigo-600">Akses panel khusus admin</p>
          </div>
        </div>
        <Link 
          href={'/admin-kantor'} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-2"
        >
          Masuk
        </Link>
      </div>
    </div>
  );
}
