"use client";

import { useState, useEffect } from "react";
import { useDictionary, useLocale } from "@/hooks/useDictionary";
import CustomDropdown from "@/components/CustomDropdown";
import useSWR from "swr";

export default function KaryawanRekapPage() {
  const dict = useDictionary();
  const locale = useLocale();
  const currentDate = new Date();
  const [bulan, setBulan] = useState(currentDate.getMonth() + 1);
  const [tahun, setTahun] = useState(currentDate.getFullYear());

  const fetcher = (url: string) => fetch(url).then(res => res.json()).then(res => res.data);
  const { data, error, isLoading: isSwrLoading, mutate } = useSWR(`/api/absen-kantor/rekap?mode=user&bulan=${bulan}&tahun=${tahun}`, fetcher, { revalidateOnFocus: true });
  
  const isLoading = isSwrLoading && !data;

  const formatTanggal = (isoString: string) => {
    return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(isoString));
  };
  
  const formatJam = (isoString: string | null) => {
    if (!isoString) return "--:--";
    return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(isoString));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 w-full min-w-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{dict.recap.title}</h1>
          <p className="text-gray-500 mt-1">{dict.recap.subtitle}</p>
        </div>
        <div className="flex gap-3 items-center">
          <button onClick={() => mutate()} className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 hidden md:flex items-center gap-2 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            Refresh
          </button>
          <CustomDropdown
            value={bulan}
            onChange={(val) => setBulan(Number(val))}
            options={Array.from({length: 12}, (_, i) => i + 1).map(m => ({
              value: m,
              label: new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2000, m - 1, 1))
            }))}
            className="w-40 shadow-sm"
          />
          <CustomDropdown
            value={tahun}
            onChange={(val) => setTahun(Number(val))}
            options={[tahun - 1, tahun, tahun + 1].map(y => ({
              value: y,
              label: y.toString()
            }))}
            className="w-32 shadow-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">{dict.bottomNav?.recapLoading || "Memuat laporan..."}</p>
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center min-w-0">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 truncate w-full">{dict.recap.totalPresent}</span>
              <span className="text-3xl font-black text-green-600">{data.ringkasan.hadir + data.ringkasan.terlambat}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center min-w-0">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 truncate w-full">{dict.recap.totalSick}</span>
              <span className="text-3xl font-black text-red-500">{data.ringkasan.sakit}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center min-w-0">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 truncate w-full">{dict.recap.totalLeave}</span>
              <span className="text-3xl font-black text-blue-500">{data.ringkasan.izin}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center min-w-0">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 truncate w-full">{dict.recap.totalAlpha}</span>
              <span className="text-3xl font-black text-gray-900">{data.ringkasan.alpha}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center min-w-0">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 truncate w-full">{dict.recap.totalIncomplete}</span>
              <span className="text-3xl font-black text-orange-500">{data.ringkasan.incomplete}</span>
            </div>
            <div className="bg-blue-600 p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center text-white min-w-0">
              <span className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1 truncate w-full">{dict.recap.totalHours}</span>
              <span className="text-3xl font-black">{Math.floor(data.ringkasan.totalDurasiMenit / 60)}<span className="text-lg">h</span></span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{dict.dashboard.historyTitle}</h2>
            </div>
            {data.detail.length === 0 ? (
              <div className="p-12 text-center text-gray-500">{dict.dashboard.noHistory}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px] whitespace-nowrap">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                      <th className="px-6 py-4 font-semibold">{dict.dashboard.colDate}</th>
                      <th className="px-6 py-4 font-semibold">{dict.dashboard.colIn}</th>
                      <th className="px-6 py-4 font-semibold">{dict.dashboard.colOut}</th>
                      <th className="px-6 py-4 font-semibold">{dict.dashboard.colDuration}</th>
                      <th className="px-6 py-4 font-semibold">{dict.dashboard.colStatus}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.detail.map((h: any) => (
                      <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{formatTanggal(h.tanggal)}</td>
                        <td className="px-6 py-4 text-gray-700">{formatJam(h.waktuAbsenMasuk)}</td>
                        <td className="px-6 py-4 text-gray-700">{formatJam(h.waktuAbsenPulang)}</td>
                        <td className="px-6 py-4">
                          {h.durasiKerja ? (
                            <span className="font-medium text-gray-900">
                              {Math.floor(h.durasiKerja / 60)}j {h.durasiKerja % 60}m
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {h.isIncomplete ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-orange-50 text-orange-700">{dict.dashboard.statusIncomplete || "INCOMPLETE"}</span>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                              h.status === 'HADIR' ? 'bg-green-50 text-green-700' :
                              h.status === 'TERLAMBAT' ? 'bg-yellow-50 text-yellow-700' :
                              h.status === 'IZIN' ? 'bg-blue-50 text-blue-700' :
                              h.status === 'SAKIT' ? 'bg-red-50 text-red-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {h.status === 'HADIR' ? (dict.dashboard.statusHadir || h.status) : 
                               h.status === 'TERLAMBAT' ? (dict.dashboard.statusTerlambat || h.status) :
                               h.status === 'IZIN' ? (dict.dashboard.statusIzin || h.status) :
                               h.status === 'SAKIT' ? (dict.dashboard.statusSakit || h.status) : h.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
