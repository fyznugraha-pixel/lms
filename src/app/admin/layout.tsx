"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  Building2, 
  Users, 
  BookOpen, 
  GraduationCap, 
  LogOut, 
  Menu, 
  X,
  FileSpreadsheet,
  Key
} from "lucide-react";
import ChangePasswordModal from "@/components/ChangePasswordModal";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Kita hardcode role sementara untuk UI, di real app bisa di-pass dari server component via props atau context
  // Karena layout client side, kita asumsikan menu akan di-filter di server, tapi di client kita sediakan semua.
  // Tapi untuk keamanan dan UX lebih baik filter di server. Nanti kita akan refactor ke server component jika perlu.
  const navigation = [
    { name: "Kampus", href: "/admin/kampus", icon: Building2 },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Jurusan", href: "/admin/jurusan", icon: BookOpen },
    { name: "Kelas", href: "/admin/kelas", icon: Building2 },
    { name: "Mata Kuliah", href: "/admin/matakuliah", icon: GraduationCap },
    { name: "Plotting Dosen", href: "/admin/plotting", icon: Users },
    { name: "Jadwal Kuliah", href: "/admin/jadwal", icon: BookOpen },
    { name: "Import Mahasiswa", href: "/admin/master-mahasiswa", icon: FileSpreadsheet },
  ];

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-primary-950 text-white transform transition-transform duration-200 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-primary-800">
          <div className="flex items-center gap-2 text-xl font-bold font-heading text-primary-50 tracking-wide">
            <img src="/logo/LOGO%20TACTLINK.png" alt="TactLink Logo" className="h-8 w-auto object-contain brightness-0 invert" />
            Admin Panel
          </div>
          <button className="lg:hidden text-primary-200 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? "bg-primary-800 text-white" 
                    : "text-primary-200 hover:bg-primary-800/50 hover:text-white"
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 ${isActive ? "text-primary-300" : "text-primary-400"}`} />
                {item.name}
              </a>
            );
          })}
        </nav>

        <div className="p-4 border-t border-primary-800 space-y-2">
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-primary-200 rounded-lg hover:bg-primary-800/50 hover:text-white transition-colors"
          >
            <Key className="mr-3 h-5 w-5 text-primary-400" />
            Ubah Password
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-primary-200 rounded-lg hover:bg-primary-800/50 hover:text-white transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 text-primary-400" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white glass-panel lg:hidden flex items-center justify-between px-4 z-10 relative">
          <button 
            className="text-slate-600 hover:text-slate-900 focus:outline-none"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <span className="font-heading font-semibold text-slate-800">Admin Panel</span>
          <div className="w-6" /> {/* Spacer */}
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="mx-auto max-w-7xl">
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
