import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      const role = payload.role as string;
      if (role === "SUPER_ADMIN" || role === "ADMIN_KAMPUS") {
        redirect("/admin");
      } else if (role === "ADMIN_KANTOR") {
        redirect("/admin-kantor");
      } else if (role === "DOSEN") {
        redirect("/dosen");
      } else if (role === "KARYAWAN") {
        redirect("/absen-kantor");
      } else {
        redirect("/absen");
      }
    }
  }

  // Jika tidak ada token atau token tidak valid, arahkan ke halaman login
  redirect("/login");
}
