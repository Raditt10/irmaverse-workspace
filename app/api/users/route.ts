import { NextResponse } from "next/server";
import  prisma  from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    // Hanya admin/instruktur yang boleh lihat list user
    if (!session || (session.user.role !== "instruktur" && session.user.role !== "admin" && session.user.role !== "super_admin")) {
        return NextResponse.json([], { status: 403 });
    }

    const users = await prisma.users.findMany({
      where: {
        role: 'user' // Hanya ambil siswa biasa
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true
      },
      take: 50 // Batasi agar query ringan
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed fetch users" }, { status: 500 });
  }
}