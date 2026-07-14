"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { ArrowLeft, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ScanPage() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "loading" | "success" | "error">("idle");
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // 1. Dapatkan Lokasi Background
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          let msg = `Gagal mendapatkan lokasi. (${error.message})`;
          if (error.code === error.PERMISSION_DENIED) {
            msg = "Izin lokasi ditolak. Mohon izinkan akses lokasi di pengaturan browser Anda.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = "Sinyal GPS/Lokasi tidak tersedia di perangkat ini. Gunakan fitur Sensor Location di DevTools jika di PC.";
          } else if (error.code === error.TIMEOUT) {
            msg = "Waktu pencarian lokasi habis (Timeout). Pastikan sinyal internet stabil.";
          }
          setLocationError(msg);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationError("Perangkat/Browser ini tidak mendukung geolokasi.");
    }
  }, []);

  // 2. Inisialisasi Scanner
  useEffect(() => {
    // Pastikan kita hanya start jika belum ada error lokasi dan belum success
    if (scanStatus === "success" || scanStatus === "loading") return;

    const startScanner = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        // Jika berhasil minta izin, matikan stream karena Html5Qrcode akan minta lagi dengan sendirinya, 
        // tapi kita sudah pastikan browser punya permission.
        stream.getTracks().forEach(track => track.stop());
        setHasPermission(true);

        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          onScanSuccess,
          onScanFailure
        );
        setScanStatus("scanning");
      } catch (err) {
        setHasPermission(false);
        console.error("Camera error:", err);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScanSuccess = async (decodedText: string) => {
    if (scanStatus === "loading") return; // Cegah double scan
    
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().catch(console.error);
    }

    setScanStatus("loading");
    setScanMessage("Memvalidasi kehadiran Anda...");

    if (!location) {
      setScanStatus("error");
      setScanMessage("Lokasi belum didapatkan. Pastikan GPS aktif dan izinkan akses lokasi.");
      return;
    }

    try {
      // Parse QR Content (JSON)
      let qrData;
      try {
        qrData = JSON.parse(decodedText);
      } catch (e) {
        setScanStatus("error");
        setScanMessage("Format QR Code tidak dikenali.");
        return;
      }

      if (!qrData.sesiId || !qrData.token) {
        setScanStatus("error");
        setScanMessage("QR Code tidak valid untuk sistem ini.");
        return;
      }

      // Kirim ke backend
      const res = await fetch("/api/mahasiswa/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sesiId: qrData.sesiId,
          token: qrData.token,
          latitude: location.lat,
          longitude: location.lng
        })
      });

      const json = await res.json();
      
      if (json.success) {
        setScanStatus("success");
        setScanMessage(json.message);
      } else {
        setScanStatus("error");
        setScanMessage(json.error);
      }

    } catch (err: any) {
      setScanStatus("error");
      setScanMessage(err.message || "Terjadi kesalahan jaringan.");
    }
  };

  const onScanFailure = (error: any) => {
    // Abaikan frame error, ini normal terjadi berkali-kali per detik saat kamera mencari QR
  };

  const retryScan = () => {
    setScanStatus("idle");
    setScanMessage(null);
    window.location.reload(); // Reload halaman paling bersih untuk restart kamera di mobile browser
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header Transparan */}
      <div className="h-16 flex items-center justify-between px-4 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent">
        <Link href="/absen" className="p-2 text-white bg-black/20 rounded-full backdrop-blur-md">
          <ArrowLeft size={24} />
        </Link>
        <span className="text-white font-medium">Scan QR Absensi</span>
        <div className="w-10"></div>
      </div>

      {/* Main Scanner Area */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        
        {/* Layer Kamera */}
        <div id="reader" className="w-full h-full object-cover"></div>

        {/* Overlay Lokasi Info */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
          {locationError ? (
            <div className="bg-danger-500/90 text-white px-4 py-2 rounded-full text-xs font-medium flex items-center shadow-lg backdrop-blur-sm">
              <AlertCircle size={14} className="mr-1.5" />
              {locationError}
            </div>
          ) : location ? (
            <div className="bg-emerald-500/90 text-white px-4 py-2 rounded-full text-xs font-medium flex items-center shadow-lg backdrop-blur-sm">
              <MapPin size={14} className="mr-1.5" />
              Lokasi GPS Akurat Ditemukan
            </div>
          ) : (
            <div className="bg-slate-800/90 text-slate-200 px-4 py-2 rounded-full text-xs font-medium flex items-center shadow-lg backdrop-blur-sm animate-pulse">
              <MapPin size={14} className="mr-1.5 animate-bounce" />
              Mencari koordinat lokasi...
            </div>
          )}
        </div>

        {/* Overlay Izin Kamera */}
        {hasPermission === false && (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center text-center p-6 z-30">
            <AlertCircle size={48} className="text-danger-500 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Akses Kamera Ditolak</h2>
            <p className="text-slate-400 text-sm mb-6">Kami memerlukan akses kamera untuk memindai QR Code. Silakan izinkan di pengaturan browser Anda.</p>
            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-white text-black rounded-full font-bold">
              Coba Lagi
            </button>
          </div>
        )}

        {/* Overlay Loading / Success / Error */}
        {(scanStatus === "loading" || scanStatus === "success" || scanStatus === "error") && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40 transition-all duration-300">
            {scanStatus === "loading" && (
              <>
                <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mb-6"></div>
                <h2 className="text-xl font-bold text-white mb-2">Memproses...</h2>
                <p className="text-slate-300 text-sm">{scanMessage}</p>
              </>
            )}

            {scanStatus === "success" && (
              <>
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 size={48} className="text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Berhasil!</h2>
                <p className="text-emerald-100 text-sm mb-8">{scanMessage}</p>
                <Link href="/absen" className="w-full max-w-xs py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-colors">
                  Kembali ke Beranda
                </Link>
              </>
            )}

            {scanStatus === "error" && (
              <>
                <div className="w-20 h-20 bg-danger-500/20 rounded-full flex items-center justify-center mb-6">
                  <AlertCircle size={48} className="text-danger-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Gagal Absen</h2>
                <p className="text-danger-100 text-sm mb-8">{scanMessage}</p>
                
                <div className="flex w-full max-w-xs space-x-3">
                  <Link href="/absen" className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors">
                    Batal
                  </Link>
                  <button onClick={retryScan} className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition-colors">
                    Scan Ulang
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer / Helper Text */}
      <div className="h-24 bg-black flex items-center justify-center px-6 text-center absolute bottom-0 left-0 right-0 z-10 pb-safe">
        <p className="text-slate-400 text-sm">
          Arahkan kamera ke QR Code yang ditampilkan oleh dosen di depan kelas.
        </p>
      </div>

      {/* Global CSS for iOS safe area */}
      <style dangerouslySetInnerHTML={{__html: `
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
      `}} />
    </div>
  );
}
