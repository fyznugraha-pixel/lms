import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (token) {
    const payload = await verifyToken(token);
    if (payload) {
      const role = payload.role as string;
      if (role === "SUPER_ADMIN" || role === "ADMIN_KANTOR") {
        redirect("/admin-kantor");
      } else if (role === "KARYAWAN") {
        redirect("/absen-kantor");
      }
    }
  }

  return <>{children}</>;
}
