"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, X, Search } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import { useDictionary, useLocale } from "@/hooks/useDictionary";

export default function SesiAbsensiDetail(props: { params: Promise<{ id: string }> }) {
  const dict = useDictionary();
  const locale = useLocale();
  const params = use(props.params);
  const [sesi, setSesi] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message: string; type: "confirm" | "alert"; onConfirm?: () => void; confirmTheme?: "blue" | "red" }>({
    isOpen: false,
    title: "",
    message: "",
    type: "alert"
  });
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    fetchSesiDetail();
  }, []);

  const fetchSesiDetail = async () => {
    try {
      const res = await fetch(`/api/admin-kantor/absensi/sesi/${params.id}`);
      const data = await res.json();
      if (data.success) {
        setSesi(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const closeSesi = async () => {
    try {
      const res = await fetch(`/api/admin-kantor/absensi/sesi/${params.id}`, { method: "PUT" });
      if (res.ok) fetchSesiDetail();
    } catch (err) {
      setModalConfig({ isOpen: true, title: dict.notifications?.errorTitle || "Error", message: dict.notifications?.errorSystem || "Terjadi kesalahan sistem.", type: "alert" });
    }
  };

  const handleCloseClick = () => {
    setModalConfig({
      isOpen: true,
      title: dict.adminKantor?.absensi?.btnCloseConfirmMsg || "Tutup Sesi?",
      message: dict.adminKantor?.absensi?.closeWarningMsg || "Karyawan tidak akan bisa absen lagi ke sesi ini.",
      type: "confirm",
      confirmTheme: "red",
      onConfirm: closeSesi
    });
  };

  if (isLoading) return <div className="p-8">{dict.adminKantor?.absensi?.loadingDetail || "Memuat detail sesi..."}</div>;
  if (!sesi) return <div className="p-8 text-red-500">Sesi tidak ditemukan.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin-kantor/absensi" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {dict.adminKantor?.absensi?.detailTitle || "Detail Sesi Absensi"}: {
              sesi.jenisAbsen === 'MASUK' 
                ? (dict.adminKantor?.absensi?.typeIn || "MASUK") 
                : (dict.adminKantor?.absensi?.typeOut || "PULANG")
            }
          </h1>
          <p className="text-gray-500">
            {new Date(sesi.tanggal).toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm grid grid-cols-2 md:flex md:justify-between items-center gap-4">
        <div>
          <p className="text-sm text-gray-500">{dict.adminKantor?.absensi?.statusSession || "Status Sesi"}</p>
          <div className="mt-1">
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
              sesi.status === 'AKTIF' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {sesi.status === 'AKTIF' ? (dict.adminKantor?.absensi?.statusActive || "AKTIF") : (dict.adminKantor?.absensi?.statusClosed || "SELESAI")}
            </span>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-500">{dict.adminKantor?.absensi?.totalEmployee || "Total Karyawan"}</p>
          <p className="text-xl font-bold">{sesi.tokens.length}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">{dict.adminKantor?.absensi?.alreadyCheckedIn || "Sudah Absen"}</p>
          <p className="text-xl font-bold text-green-600">
            {sesi.tokens.filter((t: any) => t.isUsed).length}
          </p>
        </div>
        {sesi.status === 'AKTIF' && (
          <div className="col-span-2 md:col-span-1 mt-2 md:mt-0">
            <button
              onClick={handleCloseClick}
              className="w-full md:w-auto bg-red-50 hover:bg-red-100 text-red-600 px-4 py-3 md:py-2 rounded-lg font-medium transition-colors"
            >
              {dict.adminKantor?.absensi?.btnClose || "Tutup Sesi"}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <h3 className="font-semibold text-gray-700 w-full md:w-auto">{dict.adminKantor?.absensi?.employeeListTitle || "Daftar Kehadiran Karyawan"}</h3>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari karyawan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#394887] focus:border-[#394887] bg-white outline-none transition-all"
            />
          </div>
        </div>
        {(() => {
          const filtered = sesi.tokens.filter((t: any) => 
            (t.karyawan.namaLengkap || "").toLowerCase().includes(search.toLowerCase()) || 
            (t.karyawan.email || "").toLowerCase().includes(search.toLowerCase())
          );
          const totalPages = Math.ceil(filtered.length / itemsPerPage);
          const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

          if (filtered.length === 0) return <div className="p-12 text-center text-gray-500">Tidak ada karyawan yang cocok dengan pencarian "{search}".</div>;

          return (
            <>
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-gray-200 text-sm">
              <th className="p-4 font-semibold text-gray-600">{dict.adminKantor?.absensi?.colEmployeeName || "Nama Karyawan"}</th>
              <th className="p-4 font-semibold text-gray-600">{dict.adminKantor?.absensi?.colEmail || "Email"}</th>
              <th className="p-4 font-semibold text-gray-600">{dict.adminKantor?.absensi?.colTime || "Waktu Absen"}</th>
              <th className="p-4 font-semibold text-gray-600">{dict.adminKantor?.absensi?.colStatusAbsen || "Status Absen"}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((tokenObj: any) => {
              const absensiRecord = sesi.jenisAbsen === 'MASUK'
                ? sesi.absensiMasuk.find((a: any) => a.karyawan?.id === tokenObj.karyawan.id)
                : sesi.absensiPulang.find((a: any) => a.karyawan?.id === tokenObj.karyawan.id);
              
              const waktuAbsen = sesi.jenisAbsen === 'MASUK'
                ? absensiRecord?.waktuAbsenMasuk
                : absensiRecord?.waktuAbsenPulang;

              return (
              <tr key={tokenObj.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-900">{tokenObj.karyawan.namaLengkap}</td>
                <td className="p-4 text-gray-500">{tokenObj.karyawan.email}</td>
                <td className="p-4 font-medium text-gray-700">
                  {waktuAbsen ? new Date(waktuAbsen).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : '-'}
                </td>
                <td className="p-4">
                  {tokenObj.isUsed ? (
                    <span className="flex items-center gap-1.5 text-green-600 font-medium text-sm">
                      <CheckCircle size={16} /> {dict.adminKantor?.absensi?.alreadyCheckedIn || "Sudah Absen"}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-gray-400 font-medium text-sm">
                      <XCircle size={16} /> {dict.adminKantor?.absensi?.statusNotYet || "Belum"}
                    </span>
                  )}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
        </div>

        {/* Mobile Card List View */}
        <div className="md:hidden flex flex-col divide-y divide-gray-100">
          {paginatedData.map((tokenObj: any) => {
            const absensiRecord = sesi.jenisAbsen === 'MASUK'
              ? sesi.absensiMasuk.find((a: any) => a.karyawan?.id === tokenObj.karyawan.id)
              : sesi.absensiPulang.find((a: any) => a.karyawan?.id === tokenObj.karyawan.id);
            
            const waktuAbsen = sesi.jenisAbsen === 'MASUK'
              ? absensiRecord?.waktuAbsenMasuk
              : absensiRecord?.waktuAbsenPulang;

            return (
            <div key={tokenObj.id} className="p-4 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-gray-900 text-lg">{tokenObj.karyawan.namaLengkap}</div>
                  <div className="text-sm text-gray-500">{tokenObj.karyawan.email}</div>
                </div>
                <div>
                  {tokenObj.isUsed ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-green-50 text-green-700 border border-green-200 text-xs font-bold shadow-sm">
                      <CheckCircle size={14} /> {dict.adminKantor?.absensi?.alreadyCheckedIn || "Sudah Absen"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 text-gray-500 border border-gray-200 text-xs font-bold shadow-sm">
                      <XCircle size={14} /> {dict.adminKantor?.absensi?.statusNotYet || "Belum"}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                <span className="text-sm text-gray-500">{dict.adminKantor?.absensi?.colTime || "Waktu Absen"}:</span>
                <span className="text-sm font-bold text-[#394887]">
                  {waktuAbsen ? new Date(waktuAbsen).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : '-'}
                </span>
              </div>
            </div>
            );
          })}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50/50">
            <span className="text-sm text-gray-500">
              Halaman <span className="font-bold text-gray-900">{currentPage}</span> dari <span className="font-bold text-gray-900">{totalPages}</span>
            </span>
            <div className="flex gap-2">
              <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-3 py-1 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-bold"
              >
                Prev
              </button>
              <button 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-3 py-1 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-bold"
              >
                Next
              </button>
            </div>
          </div>
          )}
          </>
          );
        })()}
      </div>

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        showCancel={modalConfig.type === "confirm"}
        confirmText={modalConfig.type === "confirm" ? (dict.adminKantor?.absensi?.closeConfirm || "Ya, Tutup") : "Oke"}
        confirmTheme={modalConfig.confirmTheme || "blue"}
        onCancel={() => setModalConfig({ ...modalConfig, isOpen: false })}
        onConfirm={() => {
          if (modalConfig.onConfirm) modalConfig.onConfirm();
          setModalConfig({ ...modalConfig, isOpen: false });
        }}
      />
    </div>
  );
}
