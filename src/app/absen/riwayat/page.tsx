"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";

export default function RiwayatPage() {
  const [data, setData] = useState<{ summary: any, breakdown: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedMk, setExpandedMk] = useState<string | null>(null);

  useEffect(() => {
    const fetchRiwayat = async () => {
      try {
        const res = await fetch("/api/mahasiswa/riwayat");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRiwayat();
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case "HADIR": return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "TERLAMBAT": return "text-amber-600 bg-amber-50 border-amber-200";
      case "ALPHA": return "text-danger-600 bg-danger-50 border-danger-200";
      case "IZIN": return "text-blue-600 bg-blue-50 border-blue-200";
      case "SAKIT": return "text-purple-600 bg-purple-50 border-purple-200";
      default: return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "HADIR": return <CheckCircle2 size={16} />;
      case "ALPHA": return <XCircle size={16} />;
      case "TERLAMBAT": return <Clock size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const renderDate = (dateString: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-32 bg-slate-200 rounded-2xl w-full"></div>
        <div className="h-20 bg-slate-200 rounded-2xl w-full"></div>
        <div className="h-20 bg-slate-200 rounded-2xl w-full"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="px-6 py-6 bg-white border-b border-slate-100 sticky top-16 z-20">
        <h1 className="text-2xl font-bold font-heading text-slate-900 mb-1">Riwayat Kehadiran</h1>
        <p className="text-slate-500 text-sm">Rekapitulasi absensi Anda semester ini.</p>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto">
        
        {/* Global Summary Card */}
        <div className="bg-gradient-to-br from-primary-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
          
          <h2 className="text-primary-100 font-medium mb-4 text-sm">Total Kehadiran Keseluruhan</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-4xl font-bold font-heading">{data.summary.HADIR}</p>
              <p className="text-emerald-400 text-xs font-medium uppercase tracking-wider mt-1">Hadir</p>
            </div>
            <div>
              <p className="text-4xl font-bold font-heading">{data.summary.ALPHA}</p>
              <p className="text-danger-400 text-xs font-medium uppercase tracking-wider mt-1">Alpha</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 border-t border-white/20 pt-4 mt-2">
            <div>
              <p className="text-lg font-bold">{data.summary.IZIN}</p>
              <p className="text-white/60 text-[10px] uppercase">Izin</p>
            </div>
            <div>
              <p className="text-lg font-bold">{data.summary.SAKIT}</p>
              <p className="text-white/60 text-[10px] uppercase">Sakit</p>
            </div>
            <div>
              <p className="text-lg font-bold">{data.summary.TERLAMBAT}</p>
              <p className="text-white/60 text-[10px] uppercase">Telat</p>
            </div>
          </div>
        </div>

        {/* Breakdown per MK */}
        <div>
          <h3 className="font-bold text-slate-800 mb-4 px-1">Rincian per Mata Kuliah</h3>
          
          {data.breakdown.length === 0 ? (
            <div className="text-center p-8 bg-slate-100 rounded-2xl text-slate-500 text-sm border border-dashed border-slate-300">
              Belum ada riwayat absensi.
            </div>
          ) : (
            <div className="space-y-3">
              {data.breakdown.map((mk: any) => {
                const isExpanded = expandedMk === mk.namaMk;
                const percentHadir = mk.TOTAL > 0 ? Math.round((mk.HADIR / mk.TOTAL) * 100) : 0;
                const isWarning = percentHadir < 75 && mk.TOTAL > 3; // Contoh rule simple

                return (
                  <div key={mk.namaMk} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all duration-200">
                    {/* Accordion Header */}
                    <button 
                      onClick={() => setExpandedMk(isExpanded ? null : mk.namaMk)}
                      className="w-full px-5 py-4 flex items-center justify-between bg-white hover:bg-slate-50 focus:outline-none"
                    >
                      <div className="text-left flex-1">
                        <h4 className="font-bold text-slate-900 text-sm leading-tight pr-2">{mk.namaMk}</h4>
                        <div className="flex items-center mt-2 space-x-3">
                          <span className="text-xs font-mono text-slate-500">{mk.kodeMk}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isWarning ? 'bg-danger-100 text-danger-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {percentHadir}% Hadir
                          </span>
                        </div>
                      </div>
                      <div className="text-slate-400">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </button>
                    
                    {/* Accordion Body */}
                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-slate-100 bg-slate-50/50">
                        
                        {isWarning && (
                          <div className="mt-4 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start">
                            <AlertCircle size={16} className="text-amber-600 mt-0.5 mr-2 shrink-0" />
                            <p className="text-xs text-amber-800">
                              Peringatan: Persentase kehadiran Anda di bawah 75%. Perhatikan syarat kehadiran minimal untuk mengikuti UAS.
                            </p>
                          </div>
                        )}

                        <div className="mt-4 space-y-2">
                          {mk.history.map((hist: any) => (
                            <div key={hist.id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                              <div>
                                <p className="text-sm font-medium text-slate-800">Pertemuan {hist.pertemuanKe}</p>
                                <p className="text-xs text-slate-500">{renderDate(hist.tanggal)}</p>
                              </div>
                              <div className={`px-2.5 py-1 text-xs font-bold rounded-md flex items-center border ${getStatusColor(hist.status)}`}>
                                <span className="mr-1">{getStatusIcon(hist.status)}</span>
                                {hist.status}
                              </div>
                            </div>
                          ))}
                          
                          {mk.history.length === 0 && (
                            <p className="text-xs text-slate-400 text-center py-2">Belum ada sesi tercatat.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="h-8"></div> {/* Spacer for bottom scroll */}
      </div>
    </div>
  );
}
