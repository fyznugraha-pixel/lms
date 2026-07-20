import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Users, FileText, QrCode, Download, Clock, CheckCircle, XCircle } from "lucide-react";
import { getDictionary } from "@/lib/dictionaries";
import { cookies } from "next/headers";

export default async function AdminKantorDashboard() {
  const session = await getSession();
  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value || "en";
  const dict = await getDictionary(lang as "en" | "id");

  if (!session.userId) {
    redirect("/login");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalKaryawan,
    menungguPersetujuan,
    kehadiranHariIni,
    absensiTerbaru,
    pengajuanTerbaru
  ] = await Promise.all([
    prisma.user.count({ where: { role: "KARYAWAN" } }),
    prisma.pengajuanIzin.count({ where: { status: "PENDING" } }),
    prisma.absensiKantor.count({ where: { tanggal: today, status: "HADIR" } }),
    prisma.absensiKantor.findMany({
      where: { tanggal: today },
      orderBy: { waktuAbsenMasuk: 'desc' },
      take: 5,
      include: { karyawan: { select: { namaLengkap: true, email: true } } }
    }),
    prisma.pengajuanIzin.findMany({
      orderBy: { createdAt: 'desc' },
      take: 4,
      include: { karyawan: { select: { namaLengkap: true } } }
    })
  ]);

  const formatJam = (date: Date | null) => {
    if (!date) return "--:--";
    return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'id-ID', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading text-slate-900">{dict.adminKantor?.dashboard?.title || "Dashboard Admin Kantor"}</h1>
        <p className="mt-2 text-slate-600">
          {dict.adminKantor?.dashboard?.subtitle || "Selamat datang di panel administrasi kantor (internal TactLink)."} 
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-[#394887]/10 text-[#394887] rounded-xl">
            <Users size={28} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{dict.adminKantor?.dashboard?.totalEmployees || "Total Karyawan"}</h3>
            <p className="text-3xl font-black text-gray-900 mt-1">{totalKaryawan}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-[#EFC94B]/40 text-[#394887] rounded-xl">
            <FileText size={28} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{dict.adminKantor?.dashboard?.pendingLeave || "Menunggu Izin"}</h3>
            <p className="text-3xl font-black text-gray-900 mt-1">{menungguPersetujuan}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-[#394887]/10 text-[#394887] rounded-xl">
            <CheckCircle size={28} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{dict.adminKantor?.dashboard?.presentToday || "Hadir Hari Ini"}</h3>
            <p className="text-3xl font-black text-gray-900 mt-1">{kehadiranHariIni}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Links */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">{dict.adminKantor?.dashboard?.quickLinks || "Akses Cepat"}</h2>
          <div className="grid grid-cols-1 gap-3">
            <Link href="/admin-kantor/absensi" className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-[#394887]/30 hover:shadow-md transition-all flex items-center gap-4 group">
              <div className="p-3 bg-[#394887]/10 text-[#394887] rounded-lg group-hover:bg-[#394887] group-hover:text-white transition-colors">
                <CheckCircle size={20} />
              </div>
              <div>
                <p className="font-bold text-gray-900 group-hover:text-[#394887] transition-colors">{dict.adminKantor?.dashboard?.manageSession || "Kelola Sesi Absensi"}</p>
                <p className="text-xs text-gray-500">{dict.adminKantor?.dashboard?.manageSessionDesc || "Buka atau tutup sesi absen"}</p>
              </div>
            </Link>
            
            <Link href="/admin-kantor/karyawan" className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-[#394887]/30 hover:shadow-md transition-all flex items-center gap-4 group">
              <div className="p-3 bg-[#394887]/10 text-[#394887] rounded-lg group-hover:bg-[#394887] group-hover:text-white transition-colors">
                <Users size={20} />
              </div>
              <div>
                <p className="font-bold text-gray-900 group-hover:text-[#394887] transition-colors">{dict.adminKantor?.dashboard?.manageEmployees || "Kelola Karyawan"}</p>
                <p className="text-xs text-gray-500">{dict.adminKantor?.dashboard?.manageEmployeesDesc || "Tambah atau nonaktifkan akun"}</p>
              </div>
            </Link>

            <Link href="/admin-kantor/rekap" className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-[#EFC94B]/50 hover:shadow-md transition-all flex items-center gap-4 group">
              <div className="p-3 bg-[#EFC94B]/40 text-[#394887] rounded-lg group-hover:bg-[#EFC94B] group-hover:text-[#394887] transition-colors">
                <Download size={20} />
              </div>
              <div>
                <p className="font-bold text-gray-900 group-hover:text-[#2D3A6E] transition-colors">{dict.adminKantor?.dashboard?.exportReport || "Export Laporan"}</p>
                <p className="text-xs text-gray-500">{dict.adminKantor?.dashboard?.exportReportDesc || "Unduh rekap bulanan CSV"}</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">{dict.adminKantor?.dashboard?.todayActivity || "Aktivitas Absensi Hari Ini"}</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {absensiTerbaru.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {absensiTerbaru.map((absen) => (
                  <div key={absen.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        {absen.karyawan.namaLengkap?.charAt(0) || "K"}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{absen.karyawan.namaLengkap}</p>
                        <p className="text-xs text-gray-500">{absen.karyawan.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2 text-sm font-medium">
                        <Clock size={14} className="text-green-500" />
                        <span className="text-gray-900">{dict.adminKantor?.dashboard?.in || "In"}: {formatJam(absen.waktuAbsenMasuk)}</span>
                      </div>
                      {absen.waktuAbsenPulang && (
                        <div className="flex items-center justify-end gap-2 text-sm font-medium mt-1">
                          <Clock size={14} className="text-orange-500" />
                          <span className="text-gray-500">{dict.adminKantor?.dashboard?.out || "Out"}: {formatJam(absen.waktuAbsenPulang)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                  <Clock className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">{dict.adminKantor?.dashboard?.noActivity || "Belum ada karyawan yang absen hari ini."}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
