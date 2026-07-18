"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";

export default function AdminKantorScanPage() {
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Inisialisasi scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
      },
      false
    );
    scannerRef.current = scanner;

    scanner.render(onScanSuccess, onScanFailure);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const onScanSuccess = async (decodedText: string) => {
    if (isProcessing) return; // Mencegah double scan
    setIsProcessing(true);
    
    // Pause scanner sementara memproses
    if (scannerRef.current) {
      scannerRef.current.pause(true);
    }

    try {
      const res = await fetch("/api/admin-kantor/absensi/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: decodedText }),
      });
      const data = await res.json();
      
      if (data.success) {
        setScanResult({ success: true, message: data.message });
        // Play success sound
        const audio = new Audio("https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=success-1-6297.mp3");
        audio.play().catch(() => {});
      } else {
        setScanResult({ success: false, message: data.error || "Gagal memproses QR Code" });
        // Play error sound
        const audio = new Audio("https://cdn.pixabay.com/download/audio/2022/03/15/audio_7314d3a042.mp3?filename=error-126627.mp3");
        audio.play().catch(() => {});
      }
    } catch (error) {
      setScanResult({ success: false, message: "Terjadi kesalahan sistem saat memproses scan." });
    }

    // Lanjutkan scanner setelah 3 detik
    setTimeout(() => {
      setScanResult(null);
      setIsProcessing(false);
      if (scannerRef.current) {
        scannerRef.current.resume();
      }
    }, 3000);
  };

  const onScanFailure = (error: any) => {
    // Ignore error karena ini jalan terus menerus saat belum nemu QR
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin-kantor/absensi" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kamera Scanner Absensi</h1>
          <p className="text-gray-500">Scan QR Code Karyawan untuk mencatat kehadiran</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
        {scanResult && (
          <div className={`mb-6 p-4 w-full rounded-xl flex items-center justify-center gap-3 animate-in slide-in-from-top-4 duration-300 ${scanResult.success ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
            {scanResult.success ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
            <span className="font-bold text-lg text-center">{scanResult.message}</span>
          </div>
        )}

        <div className="w-full max-w-lg overflow-hidden rounded-2xl border-4 border-gray-100 relative">
          {isProcessing && !scanResult && (
            <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex items-center justify-center flex-col gap-2">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="font-bold text-blue-600">Memproses Barcode...</p>
            </div>
          )}
          <div id="reader" className="w-full"></div>
        </div>
        
        <p className="text-center text-gray-500 mt-6 text-sm font-medium">
          Arahkan Barcode Karyawan ke kamera. <br />
          Sistem akan otomatis mendeteksi dan memvalidasi absensi.
        </p>
      </div>
    </div>
  );
}
