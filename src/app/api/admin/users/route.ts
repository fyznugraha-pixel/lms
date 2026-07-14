import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function GET() {
  const session = await getSession();
  
  if (session.userRole !== "SUPER_ADMIN" && session.userRole !== "ADMIN_KAMPUS") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  try {
    const whereClause = session.userRole === "ADMIN_KAMPUS" && session.kampusId 
      ? { kampusId: session.kampusId }
      : {};

    const users = await prisma.user.findMany({
      where: whereClause,
      include: { kampus: true },
      orderBy: { createdAt: "desc" }
    });
    
    // Hilangkan passwordHash dari response
    const sanitizedUsers = users.map(user => {
      const { passwordHash, ...rest } = user;
      return rest;
    });

    return NextResponse.json({ success: true, data: sanitizedUsers });
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
    const { email, password, role, kampusId, nim } = body;

    // Jika Admin Kampus, paksa kampusId ke kampus mereka sendiri
    const finalKampusId = session.userRole === "ADMIN_KAMPUS" ? session.kampusId : kampusId;

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        kampusId: finalKampusId || null,
        nim: nim || null
      }
    });

    const { passwordHash: _, ...rest } = newUser;
    return NextResponse.json({ success: true, data: rest });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
