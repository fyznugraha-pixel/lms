import { redirect } from "next/navigation";

export default function Home() {
  // Sementara diarahkan ke halaman login
  redirect("/login");
}
