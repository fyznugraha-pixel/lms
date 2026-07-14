"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Clock, MapPin, Users, PlayCircle, StopCircle, QrCode, UserCheck, AlertTriangle
} from "lucide-react";

export default function SesiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const fetchSesi = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/dosen/sesi/${id}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data.sesi);
        setStudents(json.data.students);
      } else {
        alert(json.error);
        router.push("/dosen");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSesi();
  }, [id]);

  const handleAction = async (action: "START" | "END") => {
    const msg = action === "START" 
      ? "Mulai sesi absensi sekarang? Mahasiswa akan bisa mulai scan QR." 
      : "Akhiri sesi absensi? QR Code tidak akan bisa discan lagi.";
      
    if (!confirm(msg)) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/dosen/sesi/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const json = await res.json();
      if (json.success) {
        fetchSesi();
      } else {
        alert(json.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOverride = async (mahasiswaIds: string[], statusBaru: string) => {
    if (!statusBaru || mahasiswaIds.length === 0) return;
    
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/dosen/sesi/${id}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mahasiswaIds, statusBaru })
      });
      const json = await res.json();
      if (json.success) {
        setSelectedStudents([]); // Reset selection on success
        fetchSesi();
      } else {
        alert(json.error);
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const handleSelectOne = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const renderTime = (dateString: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderDate = (dateString: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ONGOING": return <span className="bg-primary-100 text-primary-700 px-3 py-1.5 rounded-md text-sm font-semibold animate-pulse">SEDANG BERJALAN</span>;
      case "SELESAI": return <span className="bg-success-100 text-success-700 px-3 py-1.5 rounded-md text-sm font-semibold">SELESAI</span>;
      case "DIBATALKAN": return <span className="bg-danger-100 text-danger-700 px-3 py-1.5 rounded-md text-sm font-semibold">DIBATALKAN</span>;
      default: return <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md text-sm font-semibold">BELUM MULAI</span>;
    }
  };

  const getStudentStatusBadge = (status: string) => {
    switch (status) {
      case "HADIR": return <span className="bg-success-100 text-success-700 px-2 py-1 rounded text-xs font-semibold">Hadir</span>;
      case "TERLAMBAT": return <span className="bg-warning-100 text-warning-700 px-2 py-1 rounded text-xs font-semibold">Terlambat</span>;
      case "ALPHA": return <span className="bg-danger-100 text-danger-700 px-2 py-1 rounded text-xs font-semibold">Alpha</span>;
      case "IZIN": return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">Izin</span>;
      case "SAKIT": return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-semibold">Sakit</span>;
      default: return <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs font-semibold">Belum Absen</span>;
    }
  }

  if (isLoading) return <div className="text-center py-12 text-slate-500">Memuat detail sesi...</div>;
  if (!data) return <div className="text-center py-12 text-danger-500">Data sesi tidak ditemukan.</div>;

  const mk = data.jadwalTemplate?.kelasMataKuliah?.mataKuliah;
  const kelas = data.jadwalTemplate?.kelasMataKuliah?.kelas;

  // Hitung ringkasan absensi
  const summary = {
    total: students.length,
    hadir: students.filter(s => s.statusLabel === "HADIR" || s.statusLabel === "TERLAMBAT").length,
    izin: students.filter(s => s.statusLabel === "IZIN" || s.statusLabel === "SAKIT").length,
    alpha: students.filter(s => s.statusLabel === "ALPHA").length,
    belum: students.filter(s => s.statusLabel === "BELUM_ABSEN").length,
  };

  return (
    <div className="space-y-6">
      <Link href="/dosen" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-primary-600 transition-colors">
        <ArrowLeft size={16} className="mr-1" />
        Kembali ke Jadwal
      </Link>

      <div className="glass-panel p-6 rounded-xl border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              {getStatusBadge(data.status)}
              <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                Pertemuan {data.pertemuanKe}
              </span>
            </div>
            <h1 className="text-2xl font-bold font-heading text-slate-900 mt-2">
              {mk?.namaMk}
            </h1>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600">
              <div className="flex items-center"><UserCheck size={16} className="mr-1.5 text-primary-500" /> Kelas {kelas?.kodeKelas}</div>
              <div className="flex items-center"><Clock size={16} className="mr-1.5 text-primary-500" /> {renderDate(data.tanggal)} ({renderTime(data.jamMulai)} - {renderTime(data.jamSelesai)})</div>
              <div className="flex items-center"><MapPin size={16} className="mr-1.5 text-primary-500" /> Ruang {data.jadwalTemplate?.ruangan}</div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 min-w-[200px]">
            {data.status === "SCHEDULED" && (
              <button 
                onClick={() => handleAction("START")}
                disabled={isUpdating}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center transition-colors"
              >
                <PlayCircle size={18} className="mr-2" />
                Mulai Sesi
              </button>
            )}
            
            {data.status === "ONGOING" && (
              <>
                <Link 
                  href={`/dosen/sesi/${id}/proyektor`}
                  target="_blank"
                  className="flex-1 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center transition-colors shadow-lg shadow-slate-800/20"
                >
                  <QrCode size={18} className="mr-2" />
                  Buka Proyektor
                </Link>
                <button 
                  onClick={() => handleAction("END")}
                  disabled={isUpdating}
                  className="flex-1 bg-danger-500 hover:bg-danger-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center transition-colors"
                >
                  <StopCircle size={18} className="mr-2" />
                  Akhiri Sesi
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-slate-200">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Mhs</div>
          <div className="text-2xl font-bold text-slate-800">{summary.total}</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-success-200 bg-success-50/30">
          <div className="text-success-600 text-xs font-semibold uppercase tracking-wider mb-1">Hadir</div>
          <div className="text-2xl font-bold text-success-700">{summary.hadir}</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-danger-200 bg-danger-50/30">
          <div className="text-danger-600 text-xs font-semibold uppercase tracking-wider mb-1">Alpha / Belum</div>
          <div className="text-2xl font-bold text-danger-700">{summary.alpha + summary.belum}</div>
        </div>
        <div className="glass-panel p-4 rounded-xl border border-blue-200 bg-blue-50/30">
          <div className="text-blue-600 text-xs font-semibold uppercase tracking-wider mb-1">Izin / Sakit</div>
          <div className="text-2xl font-bold text-blue-700">{summary.izin}</div>
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-semibold text-slate-800 flex items-center">
            <Users size={18} className="mr-2 text-primary-600" />
            Daftar Mahasiswa
          </h2>
          {selectedStudents.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">{selectedStudents.length} dipilih</span>
              <select 
                onChange={(e) => handleOverride(selectedStudents, e.target.value)}
                className="text-sm border border-slate-300 rounded-md px-3 py-1.5 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                disabled={isUpdating}
                value=""
              >
                <option value="" disabled>Tandai Semua Sebagai...</option>
                <option value="HADIR">Hadir</option>
                <option value="IZIN">Izin</option>
                <option value="SAKIT">Sakit</option>
                <option value="ALPHA">Alpha</option>
              </select>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 uppercase font-medium">
              <tr>
                <th className="px-6 py-3 w-10">
                  <input 
                    type="checkbox" 
                    checked={students.length > 0 && selectedStudents.length === students.length}
                    onChange={handleSelectAll}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="px-6 py-3">NIM</th>
                <th className="px-6 py-3">Nama Mahasiswa</th>
                <th className="px-6 py-3">Waktu Absen</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Aksi Manual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white/50">
              {students.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-500">Belum ada mahasiswa yang terdaftar di kelas ini</td></tr>
              ) : (
                students.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3">
                      <input 
                        type="checkbox" 
                        checked={selectedStudents.includes(s.id)}
                        onChange={() => handleSelectOne(s.id)}
                        className="rounded text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-6 py-3 font-mono font-medium text-slate-700">{s.nim || "-"}</td>
                    <td className="px-6 py-3 font-medium text-slate-900">{s.email.split('@')[0]}</td>
                    <td className="px-6 py-3 text-slate-500">
                      {s.absensi?.waktuAbsen ? renderTime(s.absensi.waktuAbsen) : "-"}
                      {s.absensi?.metode === "QR" && <span className="ml-2 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">QR</span>}
                      {s.absensi?.metode === "MANUAL_DOSEN" && <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">MANUAL</span>}
                    </td>
                    <td className="px-6 py-3">{getStudentStatusBadge(s.statusLabel)}</td>
                    <td className="px-6 py-3 text-right">
                      <select 
                        className="text-xs border border-slate-300 rounded px-2 py-1 outline-none focus:border-primary-500 bg-white"
                        onChange={(e) => handleOverride([s.id], e.target.value)}
                        disabled={isUpdating}
                        value={s.statusLabel === "BELUM_ABSEN" ? "" : (s.statusLabel === "TERLAMBAT" ? "HADIR" : s.statusLabel)}
                      >
                        <option value="" disabled>Ubah Status...</option>
                        <option value="HADIR">Hadir</option>
                        <option value="IZIN">Izin</option>
                        <option value="SAKIT">Sakit</option>
                        <option value="ALPHA">Alpha</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
