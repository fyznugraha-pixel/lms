"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  CalendarDays, 
  LogOut, 
  Menu, 
  X,
  BookOpen,
  Key
} from "lucide-react";
import ChangePasswordModal from "@/components/ChangePasswordModal";

export default function DosenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const navigation = [
    { name: "Jadwal Hari Ini", href: "/dosen", icon: CalendarDays },
    { name: "Semua Kelas", href: "/dosen/kelas", icon: BookOpen },
  ];

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xl font-bold font-heading tracking-wide">
            <img src="/logo/LOGO%20TACTLINK.png" alt="TactLink Logo" className="h-8 w-auto object-contain brightness-0 invert" />
            Panel Dosen
          </div>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dosen" && pathname.startsWith(item.href));
            return (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? "bg-slate-800 text-white" 
                    : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 ${isActive ? "text-primary-400" : "text-slate-500"}`} />
                {item.name}
              </a>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-300 rounded-lg hover:bg-slate-800/50 hover:text-white transition-colors"
          >
            <Key className="mr-3 h-5 w-5 text-slate-500" />
            Ubah Password
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-300 rounded-lg hover:bg-slate-800/50 hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 text-slate-500" />
            Keluar
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white glass-panel border-b border-slate-200 lg:hidden flex items-center justify-between px-4 z-10 relative">
          <button 
            className="text-slate-600 hover:text-slate-900 focus:outline-none"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <span className="font-heading font-semibold text-slate-800">Panel Dosen</span>
          <div className="w-6" />
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </div>
      </main>

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}
