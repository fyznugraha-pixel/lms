"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { AlertCircle, Maximize, Minimize } from "lucide-react";

export default function ProyektorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sesiData, setSesiData] = useState<any>(null);

  // Fetch Session Meta
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await fetch(`/api/dosen/sesi/${id}`);
        const json = await res.json();
        if (json.success) {
          setSesiData(json.data.sesi);
        }
      } catch (err) {}
    };
    fetchMeta();
  }, [id]);

  // Polling QR Token
  useEffect(() => {
    const fetchQR = async () => {
      try {
        const res = await fetch(`/api/dosen/sesi/${id}/qr`);
        const json = await res.json();
        if (json.success) {
          if (json.data.token !== token) {
            setToken(json.data.token);
            setTimeLeft(5); // Reset visual timer ke 5 detik saat token berganti
          }
          setError(null);
        } else {
          setError(json.error);
        }
      } catch (err) {
        setError("Koneksi terputus.");
      }
    };

    fetchQR();
    const intervalId = setInterval(fetchQR, 2000); // Poll tiap 2 detik
    return () => clearInterval(intervalId);
  }, [id]);

  // Timer Countdown Visual
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6">
        <AlertCircle size={64} className="text-danger-500 mb-4" />
        <h1 className="text-2xl font-bold font-heading mb-2">QR Code Tidak Tersedia</h1>
        <p className="text-slate-400 text-center">{error}</p>
        <button onClick={() => router.push(`/dosen/sesi/${id}`)} className="mt-8 px-6 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
          Kembali ke Detail Sesi
        </button>
      </div>
    );
  }

  // Persentase waktu tersisa untuk animasi progress bar
  const progressPercent = (timeLeft / 5) * 100;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="h-20 border-b border-slate-900 flex justify-between items-center px-8 relative z-10">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-100">
            {sesiData?.jadwalTemplate?.kelasMataKuliah?.mataKuliah?.namaMk || "Memuat..."}
          </h1>
          <p className="text-slate-400 font-mono text-sm mt-1">
            Kelas {sesiData?.jadwalTemplate?.kelasMataKuliah?.kelas?.kodeKelas} — Pertemuan {sesiData?.pertemuanKe}
          </p>
        </div>
        <button 
          onClick={toggleFullscreen}
          className="p-3 bg-slate-900 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 relative">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl relative z-10">
          {token ? (
            <QRCodeSVG 
              value={JSON.stringify({ sesiId: id, token, kampusId: sesiData?.jadwalTemplate?.kelasMataKuliah?.mataKuliah?.kampusId })}
              size={Math.min(window.innerWidth * 0.6, window.innerHeight * 0.6, 500)}
              bgColor="#ffffff"
              fgColor="#0f172a"
              level="H"
              includeMargin={false}
            />
          ) : (
            <div 
              className="flex items-center justify-center bg-slate-100 rounded-2xl animate-pulse"
              style={{ width: Math.min(window.innerWidth * 0.6, 500), height: Math.min(window.innerWidth * 0.6, 500) }}
            >
              <span className="text-slate-400 font-medium">Memuat QR Code...</span>
            </div>
          )}
        </div>

        <div className="mt-12 text-center relative z-10 w-full max-w-md mx-auto">
          <p className="text-slate-400 mb-3 text-sm tracking-wide uppercase font-semibold">Memperbarui dalam {timeLeft} detik</p>
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${timeLeft < 5 ? 'bg-danger-500' : 'bg-primary-500'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </main>

      <footer className="h-16 flex items-center justify-center text-slate-500 text-sm border-t border-slate-900">
        Silakan buka aplikasi mahasiswa dan scan QR Code di atas.
      </footer>
    </div>
  );
}
