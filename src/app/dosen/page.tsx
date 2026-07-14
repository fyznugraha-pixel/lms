"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, MapPin, Users, ArrowRight } from "lucide-react";

export default function DosenDashboard() {
  const [sesiList, setSesiList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchJadwal = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/dosen/jadwal"); // Defaults to today
      const data = await res.json();
      if (data.success) {
        setSesiList(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJadwal();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ONGOING": return <span className="bg-primary-100 text-primary-700 px-2.5 py-1 rounded-md text-xs font-semibold animate-pulse">SEDANG BERJALAN</span>;
      case "SELESAI": return <span className="bg-success-100 text-success-700 px-2.5 py-1 rounded-md text-xs font-semibold">SELESAI</span>;
      case "DIBATALKAN": return <span className="bg-danger-100 text-danger-700 px-2.5 py-1 rounded-md text-xs font-semibold">DIBATALKAN</span>;
      default: return <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold">BELUM MULAI</span>;
    }
  };

  const renderTime = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-slate-900">Jadwal Hari Ini</h1>
        <p className="text-slate-500 text-sm mt-1">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Memuat jadwal...</div>
      ) : sesiList.length === 0 ? (
        <div className="glass-panel p-12 rounded-xl border border-slate-200 text-center flex flex-col items-center">
          <div className="bg-slate-100 p-4 rounded-full mb-4">
            <Clock size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Tidak ada jadwal mengajar</h3>
          <p className="text-slate-500 text-sm mt-1">Anda tidak memiliki jadwal mengajar untuk hari ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sesiList.map((sesi) => (
            <div key={sesi.id} className="glass-panel rounded-xl border border-slate-200 overflow-hidden flex flex-col transition-all hover:shadow-md hover:border-primary-200">
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  {getStatusBadge(sesi.status)}
                  <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    Pertemuan {sesi.pertemuanKe}
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                  {sesi.jadwalTemplate?.kelasMataKuliah?.mataKuliah?.namaMk}
                </h3>
                <div className="text-sm font-mono text-primary-600 mb-4 mt-1">
                  {sesi.jadwalTemplate?.kelasMataKuliah?.kelas?.kodeKelas}
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center">
                    <Clock size={16} className="mr-2 text-slate-400" />
                    {renderTime(sesi.jamMulai)} - {renderTime(sesi.jamSelesai)}
                  </div>
                  <div className="flex items-center">
                    <MapPin size={16} className="mr-2 text-slate-400" />
                    Ruang {sesi.jadwalTemplate?.ruangan}
                  </div>
                </div>
              </div>
              
              <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                <Link 
                  href={`/dosen/sesi/${sesi.id}`}
                  className="w-full flex items-center justify-center bg-white border border-slate-300 hover:border-primary-500 hover:text-primary-600 text-slate-700 py-2 rounded-lg text-sm font-medium transition-colors group"
                >
                  Buka Sesi
                  <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
