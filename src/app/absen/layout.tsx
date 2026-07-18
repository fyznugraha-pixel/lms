"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Home, Calendar, Clock, LogOut, Key } from "lucide-react";
import ChangePasswordModal from "@/components/ChangePasswordModal";

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const navItems = [
    { name: "Home", href: "/absen", icon: Home },
    { name: "Jadwal", href: "/absen/jadwal", icon: Calendar },
    { name: "Riwayat", href: "/absen/riwayat", icon: Clock },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 relative pb-20">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white glass-panel flex items-center justify-between px-6 z-40 border-b border-slate-100 shadow-sm">
        <div className="font-heading font-bold text-lg text-primary-600 flex items-center gap-2">
          <img src="/logo/LOGO%20TACTLINK.png" alt="TactLink Logo" className="h-8 w-auto object-contain" />
          Absensi<span className="text-slate-800">QR</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsPasswordModalOpen(true)}
            className="text-slate-400 hover:text-blue-500 transition-colors p-2"
            aria-label="Ubah Password"
          >
            <Key size={20} />
          </button>
          <button 
            onClick={handleLogout}
            className="text-slate-400 hover:text-danger-500 transition-colors p-2"
            aria-label="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto pt-16 h-full relative z-10">
        {children}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-slate-100 flex items-center justify-around px-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-40">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              href={item.href} 
              key={item.name}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? "text-primary-600" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <div className={`p-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-primary-50' : 'bg-transparent'}`}>
                <item.icon size={22} className={isActive ? "fill-primary-100 stroke-primary-600 stroke-[2.5]" : "stroke-2"} />
              </div>
              <span className={`text-[10px] font-medium tracking-wide ${isActive ? "text-primary-700 font-bold" : ""}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
      
      {/* Global CSS for iOS safe area (bottom bar) */}
      <style dangerouslySetInnerHTML={{__html: `
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
      `}} />

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}
