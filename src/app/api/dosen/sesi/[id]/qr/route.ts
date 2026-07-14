import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (session.userRole !== "DOSEN") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;

    const sesi = await prisma.jadwalSesi.findUnique({
      where: { id },
      include: { jadwalTemplate: { include: { kelasMataKuliah: true } } }
    });

    if (!sesi || sesi.jadwalTemplate.kelasMataKuliah.dosenId !== session.userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (sesi.status !== "ONGOING") {
      return NextResponse.json({ success: false, error: "Sesi tidak sedang berjalan" }, { status: 400 });
    }

    const now = new Date();
    const threshold = new Date(now.getTime() + 2000); // 2 detik

    // Cari token terakhir
    const lastToken = await prisma.qRToken.findFirst({
      where: { jadwalSesiId: id },
      orderBy: { expiresAt: 'desc' }
    });

    let activeToken = lastToken;

    // Jika tidak ada token atau token sudah/hampir kedaluwarsa, buat baru
    if (!lastToken || lastToken.expiresAt < threshold) {
      const newTokenString = crypto.randomUUID();
      const expiresAt = new Date(now.getTime() + 7000); // 7 detik

      activeToken = await prisma.qRToken.create({
        data: {
          jadwalSesiId: id,
          token: newTokenString,
          issuedAt: now,
          expiresAt: expiresAt
        }
      });
    }

    // Hitung sisa waktu
    const expiresInSeconds = Math.max(0, Math.floor((activeToken!.expiresAt.getTime() - new Date().getTime()) / 1000));

    return NextResponse.json({ 
      success: true, 
      data: {
        token: activeToken!.token,
        expiresIn: expiresInSeconds
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
