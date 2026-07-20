"use client";

import { useState, useEffect } from "react";
import { useDictionary, useLocale } from "@/hooks/useDictionary";
import { CheckCircle2, Calendar, AlertTriangle, Inbox, Lock, User, RefreshCw } from "lucide-react";

export default function AdminWorkLogPage() {
  const dict = useDictionary();
  const locale = useLocale();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin-kantor/worklog");
      const result = await res.json();
      if (result.success) {
        setLogs(result.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatTanggal = (isoString: string) => {
    return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(isoString));
  };

  return (
    <div className="w-full mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laporan Pekerjaan</h1>
          <p className="text-gray-500 mt-1">Pantau seluruh log aktivitas dan rencana kerja karyawan (termasuk Privat).</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-auto min-h-[600px]">
        <div className="p-5 md:p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">Feed Pekerjaan Keseluruhan</h2>
          <p className="text-sm text-gray-500 mt-1">Data diurutkan dari yang terbaru.</p>
        </div>
        
        <div className="flex-1 p-5 md:p-6 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-[#394887] rounded-full animate-spin"></div>
              <p className="text-gray-500 font-medium animate-pulse">Memuat laporan...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Inbox className="w-16 h-16 mb-4 opacity-50" />
              <p className="font-medium">Belum ada laporan pekerjaan yang masuk.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map(log => (
                <div key={log.id} className={`p-5 rounded-xl border transition-all hover:shadow-sm ${log.isPrivat ? 'bg-amber-50/30 border-amber-200' : 'bg-white border-gray-100'}`}>
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100/60">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${log.isPrivat ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-[#394887]'}`}>
                        {log.isPrivat ? <Lock className="w-5 h-5" /> : <User className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 flex items-center gap-2">
                          {log.karyawan?.namaLengkap}
                          {log.isPrivat && <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">PRIVAT (Only Admin)</span>}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatTanggal(log.tanggal)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-green-700">
                        <CheckCircle2 className="w-4 h-4" />
                        Dikerjakan Hari Ini
                      </div>
                      <div className="text-gray-700 text-sm whitespace-pre-wrap pl-6 font-medium">
                        {log.dikerjakanHariIni}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-blue-700">
                        <Calendar className="w-4 h-4" />
                        Rencana Besok
                      </div>
                      <div className="text-gray-700 text-sm whitespace-pre-wrap pl-6 font-medium">
                        {log.rencanaBesok}
                      </div>
                    </div>
                    {log.blocker && (
                      <div className="space-y-2 md:col-span-2 mt-2 pt-4 border-t border-gray-100/60">
                        <div className="flex items-center gap-2 text-sm font-bold text-red-600">
                          <AlertTriangle className="w-4 h-4" />
                          Blocker / Kendala
                        </div>
                        <div className="text-gray-700 text-sm whitespace-pre-wrap pl-6 bg-red-50/50 p-3 rounded-lg border border-red-100 mt-1">
                          {log.blocker}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
