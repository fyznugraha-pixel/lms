import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  const session = await getSession();

  if (!session.userId) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading text-slate-900">Dashboard Admin</h1>
        <p className="mt-2 text-slate-600">
          Selamat datang di panel administrasi. 
          {session.userRole === "SUPER_ADMIN" ? " Anda login sebagai Super Admin." : ` Anda login sebagai Admin Kampus (${session.subdomain}).`}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-xl border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Total Pengguna</h3>
          <p className="text-3xl font-bold text-primary-600 mt-2">--</p>
        </div>
        <div className="glass-panel p-6 rounded-xl border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Total Kelas</h3>
          <p className="text-3xl font-bold text-primary-600 mt-2">--</p>
        </div>
        <div className="glass-panel p-6 rounded-xl border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Absensi Hari Ini</h3>
          <p className="text-3xl font-bold text-success-500 mt-2">--</p>
        </div>
      </div>
    </div>
  );
}
