"use client";

import { useState, useEffect } from "react";
import ConfirmModal from "@/components/ConfirmModal";
import { useDictionary, useLocale } from "@/hooks/useDictionary";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

export default function AdminPersetujuanPage() {
  const dict = useDictionary();
  const locale = useLocale();
  const [pengajuanList, setPengajuanList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPengajuan = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/absen-kantor/pengajuan?mode=admin");
      const result = await res.json();
      if (result.success) {
        setPengajuanList(result.data);
      }
    } catch (error) {
      console.error("Gagal mengambil data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPengajuan();
  }, []);

  const formatTanggal = (isoString: string) => {
    return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(isoString));
  };

  return (
    <div className="max-w-6xl w-full mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{dict.adminKantor?.persetujuan?.title || "Persetujuan Karyawan"}</h1>
        <p className="text-gray-500 mt-1">{dict.adminKantor?.persetujuan?.subtitle || "Tinjau dan proses pengajuan Izin, Sakit, dan Klarifikasi Absen Karyawan."}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">{dict.adminKantor?.persetujuan?.listTitle || "Daftar Pengajuan Masuk"}</h2>
          <button onClick={fetchPengajuan} className="text-sm font-bold text-[#394887] hover:text-[#2D3A6E] bg-[#394887]/5 hover:bg-[#394887]/10 px-3 py-1.5 rounded-lg border border-[#394887]/20 transition-colors">
            {dict.adminKantor?.persetujuan?.btnRefresh || "Refresh Data"}
          </button>
        </div>
        
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">{dict.adminKantor?.persetujuan?.loading || "Memuat data pengajuan..."}</div>
        ) : pengajuanList.length === 0 ? (
          <div className="p-12 text-center text-gray-500">{dict.adminKantor?.persetujuan?.noData || "Belum ada data pengajuan."}</div>
        ) : (
          <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="px-6 py-4 font-semibold">{dict.adminKantor?.persetujuan?.colEmployee || "Karyawan"}</th>
                  <th className="px-6 py-4 font-semibold">{dict.adminKantor?.persetujuan?.colRequest || "Pengajuan"}</th>
                  <th className="px-6 py-4 font-semibold">{dict.adminKantor?.persetujuan?.colDate || "Rentang / Tanggal"}</th>
                  <th className="px-6 py-4 font-semibold">{dict.adminKantor?.persetujuan?.colReason || "Alasan & Bukti"}</th>
                  <th className="px-6 py-4 font-semibold">{dict.adminKantor?.persetujuan?.colStatus || "Status"}</th>
                  <th className="px-6 py-4 font-semibold text-right">{dict.adminKantor?.persetujuan?.colAction || "Aksi"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pengajuanList.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{p.karyawan.namaLengkap || "-"}</div>
                      <div className="text-xs text-gray-500">{p.karyawan.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                        p.jenis === 'IZIN' ? 'bg-[#EFC94B]/40 text-[#394887] border-[#EFC94B]/60' :
                        p.jenis === 'SAKIT' ? 'bg-[#EFC94B]/40 text-[#394887] border-[#EFC94B]/60' :
                        'bg-[#394887]/10 text-[#394887] border-[#394887]/20'
                      }`}>
                        {p.jenis === 'SAKIT' ? (dict.leaveType?.sick || "SAKIT") : 
                         p.jenis === 'IZIN' ? (dict.leaveType?.leave || "IZIN") : 
                         (dict.leaveType?.clarification || "KLARIFIKASI ABSEN")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {p.tanggalMulai === p.tanggalSelesai ? (
                        formatTanggal(p.tanggalMulai)
                      ) : (
                        <div className="flex flex-col">
                          <span>{formatTanggal(p.tanggalMulai)}</span>
                          <span className="text-xs text-gray-400">{dict.adminKantor?.persetujuan?.to || "s.d"}</span>
                          <span>{formatTanggal(p.tanggalSelesai)}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      <p className="text-sm text-gray-900 truncate" title={p.alasan}>{p.alasan}</p>
                      {p.lampiranUrl && (
                        <a href={p.lampiranUrl} target="_blank" rel="noreferrer" className="text-xs text-[#394887] font-bold hover:underline flex items-center gap-1 mt-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                          {dict.adminKantor?.persetujuan?.viewAttachment || "Lihat Bukti"}
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                        p.status === 'DISETUJUI' ? 'bg-green-50 text-green-700 border-green-200' :
                        p.status === 'DITOLAK' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                        {p.status === 'PENDING' ? (dict.status?.pending || "PENDING") :
                         p.status === 'DISETUJUI' ? (dict.status?.approved || "DISETUJUI") :
                         (dict.status?.rejected || "DITOLAK")}
                      </span>
                      {p.catatanApproval && (
                        <p className="text-xs text-gray-500 mt-1 truncate max-w-[150px]" title={p.catatanApproval}>
                          Admin: {p.catatanApproval}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/admin-kantor/persetujuan/${p.id}`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#394887]/5 text-[#394887] border border-[#394887]/20 hover:bg-[#394887] hover:text-white rounded-lg text-sm font-bold transition-all"
                      >
                        <FileText className="w-4 h-4" /> Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="md:hidden flex flex-col divide-y divide-gray-100">
            {pengajuanList.map((p) => (
              <div key={p.id} className="p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-gray-900 text-lg">{p.karyawan.namaLengkap || "-"}</div>
                    <div className="text-sm text-gray-500">{p.karyawan.email}</div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                    p.status === 'DISETUJUI' ? 'bg-green-50 text-green-700 border-green-200' :
                    p.status === 'DITOLAK' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                  }`}>
                    {p.status === 'PENDING' ? (dict.status?.pending || "PENDING") :
                     p.status === 'DISETUJUI' ? (dict.status?.approved || "DISETUJUI") :
                     (dict.status?.rejected || "DITOLAK")}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold border ${
                      p.jenis === 'IZIN' ? 'bg-[#EFC94B]/40 text-[#394887] border-[#EFC94B]/60' :
                      p.jenis === 'SAKIT' ? 'bg-[#EFC94B]/40 text-[#394887] border-[#EFC94B]/60' :
                      'bg-[#394887]/10 text-[#394887] border-[#394887]/20'
                    }`}>
                      {p.jenis === 'SAKIT' ? (dict.leaveType?.sick || "SAKIT") : 
                       p.jenis === 'IZIN' ? (dict.leaveType?.leave || "IZIN") : 
                       (dict.leaveType?.clarification || "KLARIFIKASI ABSEN")}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {p.tanggalMulai === p.tanggalSelesai ? (
                        formatTanggal(p.tanggalMulai)
                      ) : (
                        `${formatTanggal(p.tanggalMulai)} ${dict.adminKantor?.persetujuan?.to || "s.d"} ${formatTanggal(p.tanggalSelesai)}`
                      )}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-700 line-clamp-2">{p.alasan}</p>
                  
                  {p.lampiranUrl && (
                    <a href={p.lampiranUrl} target="_blank" rel="noreferrer" className="text-sm text-[#394887] font-bold hover:underline flex items-center gap-1 mt-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                      {dict.adminKantor?.persetujuan?.viewAttachment || "Lihat Bukti"}
                    </a>
                  )}

                  {p.catatanApproval && (
                    <div className="text-xs text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200 mt-1">
                      <span className="font-bold">Admin:</span> {p.catatanApproval}
                    </div>
                  )}
                </div>

                <div className="mt-2">
                  <Link 
                    href={`/admin-kantor/persetujuan/${p.id}`}
                    className="flex w-full items-center justify-center gap-2 px-4 py-3 bg-[#394887]/5 text-[#394887] border border-[#394887]/20 hover:bg-[#394887] hover:text-white rounded-xl text-sm font-bold transition-all"
                  >
                    <FileText className="w-4 h-4" /> {dict.adminKantor?.persetujuan?.detailTitle || "Detail"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>

    </div>
  );
}
