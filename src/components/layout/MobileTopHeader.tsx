"use client";

import LanguageToggle from "@/components/LanguageToggle";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function MobileTopHeader({ langCookie, role }: { langCookie: string; role?: string }) {
  const isAdmin = role === 'ADMIN_KANTOR' || role === 'SUPER_ADMIN' || role === 'PENANGGUNG_JAWAB_ABSEN';
  const adminHref = role === 'PENANGGUNG_JAWAB_ABSEN' ? '/absen-kantor/penanggung-jawab' : '/admin-kantor';

  return (
    <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <img src="/logo/LOGO%20TACTLINK.png" alt="TactLink Logo" className="h-8 w-auto object-contain" />
        <span className="font-bold text-gray-900 text-lg">TactLink</span>
      </div>
      <div className="flex items-center gap-3">
        {isAdmin && (
          <Link href={adminHref} className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors">
            <ShieldAlert size={16} />
            <span className="text-xs font-bold">Admin</span>
          </Link>
        )}
        <LanguageToggle currentLang={langCookie} compact={true} />
      </div>
    </div>
  );
}
