"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ScanLine, MapPin, CalendarClock, UserCircle2 } from "lucide-react";

export default function AbsenHomePage() {
  const [jadwal, setJadwal] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJadwal = async () => {
      try {
        const res = await fetch("/api/mahasiswa/jadwal");
        const json = await res.json();
        if (json.success) {
          setJadwal(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchJadwal();
  }, []);

  // Filter jadwal yang ada sesi hari ini (ONGOING atau SCHEDULED)
  const todaySessions = jadwal.flatMap(t => 
    t.jadwalSesi
      .filter((s: any) => s.status === "ONGOING" || s.status === "SCHEDULED")
      .map((s: any) => ({ ...s, template: t }))
  ).sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));

  const ongoingSession = todaySessions.find(s => s.status === "ONGOING");

  const renderTime = (dateString: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="px-6 py-8 space-y-8">
      
      {/* Header Profile */}
      <div className="flex items-center space-x-4">
        <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl shadow-lg flex items-center justify-center text-white">
          <UserCircle2 size={32} />
        </div>
        <div>
          <p className="text-slate-500 text-sm font-medium">Selamat datang kembali,</p>
          <h1 className="text-xl font-bold font-heading text-slate-900">Mahasiswa</h1>
        </div>
      </div>

      {/* Main Action - Scan Button */}
      <div className="pt-2">
        <Link href="/absen/scan" className="block relative group">
          <div className="absolute inset-0 bg-primary-500 rounded-[2rem] blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
          <div className="relative bg-gradient-to-b from-primary-500 to-primary-700 p-8 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col items-center justify-center text-center transform transition-transform duration-300 group-hover:scale-[1.02] active:scale-95">
            <div className="absolute -top-16 -right-16 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
            
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 border border-white/30 shadow-inner">
              <ScanLine size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold font-heading text-white tracking-wide mb-1">Scan Absen</h2>
            <p className="text-primary-100 text-sm font-medium">Ketuk untuk mulai memindai QR Code</p>
          </div>
        </Link>
      </div>

      {/* Today's Highlight */}
      <div>
        <h3 className="text-lg font-bold font-heading text-slate-800 mb-4 flex items-center">
          <CalendarClock size={20} className="mr-2 text-primary-500" />
          Kelas Hari Ini
        </h3>
        
        {isLoading ? (
          <div className="animate-pulse flex space-x-4 p-4 rounded-2xl bg-white shadow-sm border border-slate-100">
            <div className="rounded-full bg-slate-200 h-10 w-10"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          </div>
        ) : todaySessions.length > 0 ? (
          <div className="space-y-4">
            {todaySessions.map((sesi, idx) => {
              const isOngoing = sesi.status === "ONGOING";
              return (
                <div 
                  key={idx} 
                  className={`p-5 rounded-2xl shadow-sm border relative overflow-hidden transition-all ${
                    isOngoing 
                      ? "bg-white border-primary-200 ring-2 ring-primary-500/20 shadow-primary-500/5" 
                      : "bg-white border-slate-200 opacity-80"
                  }`}
                >
                  {isOngoing && (
                    <div className="absolute top-0 right-0">
                      <span className="bg-primary-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                        Berlangsung
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-slate-900 leading-tight">
                        {sesi.template.kelasMataKuliah.mataKuliah.namaMk}
                      </h4>
                      <p className="text-xs font-mono text-primary-600 mt-0.5">
                        {sesi.template.kelasMataKuliah.mataKuliah.kodeMk} — Kelas {sesi.template.kelasMataKuliah.kelas.kodeKelas}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-xs font-medium text-slate-500 space-x-4">
                    <div className="flex items-center">
                      <Clock size={14} className="mr-1.5 text-slate-400" />
                      {renderTime(sesi.jamMulai)} - {renderTime(sesi.jamSelesai)}
                    </div>
                    <div className="flex items-center">
                      <MapPin size={14} className="mr-1.5 text-slate-400" />
                      R. {sesi.template.ruangan}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-100/50 border border-slate-200 border-dashed rounded-2xl p-8 text-center flex flex-col items-center">
            <CalendarClock size={32} className="text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium text-sm">Tidak ada jadwal kelas untuk Anda hari ini.</p>
            <p className="text-slate-400 text-xs mt-1">Anda bisa bersantai atau mengecek jadwal besok.</p>
          </div>
        )}
      </div>

    </div>
  );
}
