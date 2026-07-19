"use client";

import LanguageToggle from "@/components/LanguageToggle";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert, User, LogOut } from "lucide-react";
import { useDictionary } from "@/hooks/useDictionary";

export default function MobileTopHeader({ langCookie, role }: { langCookie: string; role?: string }) {
  const pathname = usePathname();
  const dict = useDictionary();
  const isAdmin = role === 'ADMIN_KANTOR' || role === 'SUPER_ADMIN' ;
  
  // If we are currently in admin-kantor, the switch button should go to absen-kantor (employee mode)
  const isCurrentlyAdmin = pathname?.startsWith('/admin-kantor');
  
  // If Penanggung Jawab, their admin portal is /absen-kantor/penanggung-jawab
  const isCurrentlyPJ = pathname?.startsWith('/absen-kantor/penanggung-jawab');
  
  const inAdminMode = isCurrentlyAdmin || isCurrentlyPJ;
  
  const switchTarget = inAdminMode ? '/absen-kantor' : '/admin-kantor';

  return (
    <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <img src="/logo/LOGO%20TACTLINK.png" alt="TactLink Logo" className="h-8 w-auto object-contain" />
        <span className="font-bold text-gray-900 text-lg">TactLink</span>
      </div>
      <div className="flex items-center gap-3">
        {isAdmin && !inAdminMode && (
          <Link href={switchTarget} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100">
            <ShieldAlert size={16} />
            <span className="text-xs font-bold">Admin</span>
          </Link>
        )}
        <LanguageToggle currentLang={langCookie} compact={true} />
        {inAdminMode && (
          <Link 
            href={isCurrentlyAdmin ? "/admin-kantor/profil" : "/absen-kantor/profil"} 
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center" 
            title={dict.sidebar?.profile || "Profil"}
          >
            <User size={20} />
          </Link>
        )}
      </div>
    </div>
  );
}
