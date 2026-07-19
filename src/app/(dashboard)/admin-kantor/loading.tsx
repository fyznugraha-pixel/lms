import { cookies } from "next/headers";
import { getDictionary } from "@/lib/dictionaries";

export default async function Loading() {
  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value || "en";
  const dict = getDictionary(lang);

  return (
    <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-gray-500 font-medium animate-pulse">{dict.adminKantor?.persetujuan?.loading || "Memuat halaman..."}</p>
    </div>
  );
}
