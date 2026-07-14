import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (session.userRole !== "SUPER_ADMIN" && session.userRole !== "ADMIN_KAMPUS") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const whereClause = session.userRole === "ADMIN_KAMPUS" && session.kampusId 
      ? { kampusId: session.kampusId }
      : {};

    const mhs = await prisma.masterMahasiswa.findMany({
      where: whereClause,
      include: { kampus: true },
      orderBy: { nim: "asc" }
    });
    
    return NextResponse.json({ success: true, data: mhs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (session.userRole !== "SUPER_ADMIN" && session.userRole !== "ADMIN_KAMPUS") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { data, kampusId } = body;
    
    // Keamanan: Admin kampus hanya bisa import untuk kampusnya sendiri
    const finalKampusId = session.userRole === "ADMIN_KAMPUS" ? session.kampusId : kampusId;

    if (!finalKampusId) {
      return NextResponse.json({ success: false, error: "Kampus ID diperlukan" }, { status: 400 });
    }

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ success: false, error: "Data mahasiswa kosong" }, { status: 400 });
    }

    // Siapkan data untuk insert (dengan validasi duplikat menggunakan upsert atau try-catch, 
    // disini kita pakai createMany dengan skipDuplicates)
    const records = data.map((item: any) => ({
      nim: String(item.nim).trim(),
      namaLengkap: String(item.namaLengkap).trim(),
      prodi: String(item.prodi).trim(),
      kampusId: finalKampusId
    }));

    const result = await prisma.masterMahasiswa.createMany({
      data: records,
      skipDuplicates: true, // Akan skip jika kombinasi kampusId dan nim sudah ada
    });

    return NextResponse.json({ 
      success: true, 
      message: `${result.count} data mahasiswa berhasil diimport.` 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  // Fitur tambahan untuk menghapus semua data (berguna saat development)
  const session = await getSession();
  if (session.userRole !== "SUPER_ADMIN" && session.userRole !== "ADMIN_KAMPUS") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const finalKampusId = session.userRole === "ADMIN_KAMPUS" ? session.kampusId : null;
    
    if (finalKampusId) {
      await prisma.masterMahasiswa.deleteMany({ where: { kampusId: finalKampusId } });
    } else if (session.userRole === "SUPER_ADMIN") {
      // Super admin bisa mengirim ID kampus via url param, tapi untuk contoh ini kita biarkan dulu.
      // Kita tolak jika super admin tidak menspesifikasi kampus untuk delete all.
      return NextResponse.json({ success: false, error: "Super Admin must specify kampus to clear" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
