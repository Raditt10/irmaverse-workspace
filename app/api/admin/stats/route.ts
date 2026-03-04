import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session || session.user.role?.toLowerCase() !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [totalUsers, totalInstructors, totalActiveMaterials] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          role: "instruktur"
        }
      }),
      prisma.material.count()
    ]);

    return NextResponse.json({
      totalUsers,
      totalInstructors,
      totalActiveMaterials,
    });
  } catch (error) {
    console.error("Admin Stats API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
