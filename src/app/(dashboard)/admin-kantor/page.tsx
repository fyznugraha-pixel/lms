import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Users, FileText, QrCode, Download, Clock, CheckCircle, XCircle, ClipboardList } from "lucide-react";
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

      {/* Update Information Card */}
      <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-blue-900">{dict.dashboard?.updateTitle || "System Update"}</h3>
            <ul className="text-sm text-blue-800 mt-2 list-disc list-inside space-y-1">
              <li>{dict.dashboard?.updateInfo1 || "Update info 1"}</li>
              <li>{dict.dashboard?.updateInfo2 || "Update info 2"}</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-[#394887] text-white rounded-xl">
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
          <div className="p-4 bg-green-600 text-white rounded-xl">
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
          <div className="flex flex-col gap-3">
            <Link href="/admin-kantor/worklog" className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-[#394887]/30 hover:shadow-md transition-all flex items-center gap-4 group">
              <div className="p-3 bg-[#394887]/10 text-[#394887] rounded-lg group-hover:bg-[#394887] group-hover:text-white transition-colors">
                <ClipboardList size={20} />
              </div>
              <div>
                <p className="font-bold text-gray-900 group-hover:text-[#394887] transition-colors">{dict.adminKantor?.sidebar?.workLog || "Log Pekerjaan"}</p>
                <p className="text-xs text-gray-500">{dict.adminKantor?.dashboard?.workLogDesc || "Pantau laporan harian karyawan"}</p>
              </div>
            </Link>

            <div className="grid grid-cols-3 md:grid-cols-1 gap-3">
              <Link href="/admin-kantor/absensi" className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-green-500 hover:bg-green-500 hover:shadow-md transition-all flex justify-center md:justify-start items-center gap-4 group h-14 md:h-auto" title={dict.adminKantor?.dashboard?.manageSession || "Kelola Sesi Absensi"}>
                <div className="text-[#394887] md:bg-[#394887]/10 md:p-3 md:rounded-lg group-hover:text-white group-hover:scale-110 transition-all">
                  <CheckCircle size={24} className="md:w-5 md:h-5" />
                </div>
                <div className="hidden md:block">
                  <p className="font-bold text-gray-900 group-hover:text-white transition-colors">{dict.adminKantor?.dashboard?.manageSession || "Kelola Sesi Absensi"}</p>
                  <p className="text-xs text-gray-500 group-hover:text-green-50 transition-colors">{dict.adminKantor?.dashboard?.manageSessionDesc || "Buka atau tutup sesi absen"}</p>
                </div>
              </Link>
              
              <Link href="/admin-kantor/karyawan" className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-blue-600 hover:bg-blue-600 hover:shadow-md transition-all flex justify-center md:justify-start items-center gap-4 group h-14 md:h-auto" title={dict.adminKantor?.dashboard?.manageEmployees || "Kelola Karyawan"}>
                <div className="text-[#394887] md:bg-[#394887]/10 md:p-3 md:rounded-lg group-hover:text-white group-hover:scale-110 transition-all">
                  <Users size={24} className="md:w-5 md:h-5" />
                </div>
                <div className="hidden md:block">
                  <p className="font-bold text-gray-900 group-hover:text-white transition-colors">{dict.adminKantor?.dashboard?.manageEmployees || "Kelola Karyawan"}</p>
                  <p className="text-xs text-gray-500 group-hover:text-blue-50 transition-colors">{dict.adminKantor?.dashboard?.manageEmployeesDesc || "Tambah atau nonaktifkan akun"}</p>
                </div>
              </Link>

              <Link href="/admin-kantor/rekap" className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-[#EFC94B] hover:bg-[#EFC94B] hover:shadow-md transition-all flex justify-center md:justify-start items-center gap-4 group h-14 md:h-auto" title={dict.adminKantor?.dashboard?.exportReport || "Export Laporan"}>
                <div className="text-[#394887] md:bg-[#EFC94B]/40 md:p-3 md:rounded-lg group-hover:text-[#394887] group-hover:scale-110 transition-all">
                  <Download size={24} className="md:w-5 md:h-5" />
                </div>
                <div className="hidden md:block">
                  <p className="font-bold text-gray-900 group-hover:text-[#394887] transition-colors">{dict.adminKantor?.dashboard?.exportReport || "Export Laporan"}</p>
                  <p className="text-xs text-gray-500 group-hover:text-[#394887] transition-colors">{dict.adminKantor?.dashboard?.exportReportDesc || "Unduh rekap bulanan CSV"}</p>
                </div>
              </Link>
            </div>
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
