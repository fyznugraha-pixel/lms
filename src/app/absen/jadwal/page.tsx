"use client";

import { useEffect, useState } from "react";
import { Clock, MapPin, CalendarDays } from "lucide-react";

const HARI = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU", "MINGGU"];

export default function JadwalPage() {
  const [jadwal, setJadwal] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("SENIN");

  useEffect(() => {
    // Set active tab based on today
    const todayIndex = new Date().getDay(); // 0 = Minggu, 1 = Senin
    const currentHari = todayIndex === 0 ? "MINGGU" : HARI[todayIndex - 1];
    setActiveTab(currentHari);

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

  const renderTime = (dateString: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredJadwal = jadwal.filter(j => j.hari === activeTab).sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="px-6 py-6 bg-white border-b border-slate-100 sticky top-16 z-20">
        <h1 className="text-2xl font-bold font-heading text-slate-900 mb-1">Jadwal Kuliah</h1>
        <p className="text-slate-500 text-sm">Lihat jadwal kelas rutin mingguan Anda.</p>
        
        {/* Horizontal Scrollable Tabs */}
        <div className="flex space-x-2 overflow-x-auto mt-6 pb-2 no-scrollbar">
          {HARI.map(h => (
            <button
              key={h}
              onClick={() => setActiveTab(h)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === h
                  ? "bg-primary-600 text-white shadow-md shadow-primary-500/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="animate-pulse bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="h-5 bg-slate-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredJadwal.length > 0 ? (
          <div className="space-y-4">
            {filteredJadwal.map((j) => (
              <div key={j.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary-500"></div>
                
                <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1">
                  {j.kelasMataKuliah.mataKuliah.namaMk}
                </h3>
                <p className="text-sm font-mono text-primary-600 mb-4">
                  {j.kelasMataKuliah.mataKuliah.kodeMk} — Kelas {j.kelasMataKuliah.kelas.kodeKelas}
                </p>
                
                <div className="flex flex-col space-y-2 text-sm text-slate-600">
                  <div className="flex items-center">
                    <Clock size={16} className="mr-2 text-slate-400" />
                    <span>{renderTime(j.jamMulai)} - {renderTime(j.jamSelesai)}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin size={16} className="mr-2 text-slate-400" />
                    <span>Ruang {j.ruangan}</span>
                  </div>
                  <div className="flex items-center">
                    <CalendarDays size={16} className="mr-2 text-slate-400" />
                    <span>Dosen: {j.kelasMataKuliah.dosen?.email || "-"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
            <CalendarDays size={48} className="mb-4 text-slate-300" />
            <p>Tidak ada jadwal kelas di hari {activeTab}.</p>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
