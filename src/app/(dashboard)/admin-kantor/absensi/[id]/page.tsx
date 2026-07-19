"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, QrCode, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import ConfirmModal from "@/components/ConfirmModal";
import { useDictionary } from "@/hooks/useDictionary";

export default function SesiAbsensiDetail(props: { params: Promise<{ id: string }> }) {
  const dict = useDictionary();
  const params = use(props.params);
  const [sesi, setSesi] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [qrModalToken, setQrModalToken] = useState<string | null>(null);
  const [qrModalName, setQrModalName] = useState<string>("");
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean; title: string; message: string; type: "confirm" | "alert"; onConfirm?: () => void; confirmTheme?: "blue" | "red" }>({
    isOpen: false,
    title: "",
    message: "",
    type: "alert"
  });

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
      title: dict.notifications?.warningTitle || "Tutup Sesi?",
      message: "Karyawan tidak akan bisa absen lagi dengan barcode sesi ini.",
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
          <h1 className="text-2xl font-bold text-gray-900">Detail Sesi Absensi: {sesi.jenisAbsen}</h1>
          <p className="text-gray-500">
            {new Date(sesi.tanggal).toLocaleDateString("id-ID", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">Status Sesi</p>
          <div className="mt-1">
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
              sesi.status === 'AKTIF' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {sesi.status}
            </span>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Karyawan</p>
          <p className="text-xl font-bold">{sesi.tokens.length}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Sudah Absen</p>
          <p className="text-xl font-bold text-green-600">
            {sesi.tokens.filter((t: any) => t.isUsed).length}
          </p>
        </div>
        {sesi.status === 'AKTIF' && (
          <button
            onClick={handleCloseClick}
            className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Tutup Sesi
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-700">Daftar Barcode Karyawan</h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-sm">
              <th className="p-4 font-semibold text-gray-600">Nama Karyawan</th>
              <th className="p-4 font-semibold text-gray-600">Email</th>
              <th className="p-4 font-semibold text-gray-600">Status Absen</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sesi.tokens.map((tokenObj: any) => (
              <tr key={tokenObj.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-900">{tokenObj.karyawan.namaLengkap}</td>
                <td className="p-4 text-gray-500">{tokenObj.karyawan.email}</td>
                <td className="p-4">
                  {tokenObj.isUsed ? (
                    <span className="flex items-center gap-1.5 text-green-600 font-medium text-sm">
                      <CheckCircle size={16} /> Sudah Absen
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-gray-400 font-medium text-sm">
                      <XCircle size={16} /> Belum
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  {!tokenObj.isUsed && sesi.status === 'AKTIF' && (
                    <button
                      onClick={() => {
                        setQrModalToken(tokenObj.token);
                        setQrModalName(tokenObj.karyawan.namaLengkap);
                      }}
                      className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      <QrCode size={16} /> Tampilkan QR
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* QR Modal */}
      {qrModalToken && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 truncate pr-4">{qrModalName}</h3>
              <button onClick={() => setQrModalToken(null)} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-8 flex flex-col items-center justify-center">
              <div className="bg-white p-4 rounded-xl border-2 border-gray-100 shadow-sm inline-block mb-6">
                <QRCodeSVG 
                  value={`https://absensi.byfayiz.web.id/absen-kantor/scan/${qrModalToken}`} 
                  size={240} 
                  level="H"
                />
              </div>
              <p className="text-center text-sm text-gray-500">
                Silakan scan QR Code ini menggunakan aplikasi/browser untuk mencatat kehadiran Anda.
              </p>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        showCancel={modalConfig.type === "confirm"}
        confirmText={modalConfig.type === "confirm" ? "Ya, Tutup" : "Oke"}
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
