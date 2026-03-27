import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/users/stats
 * Fetch current logged-in user's dashboard stats
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: {
        points: true,
        badges: true,
        quizzes: true,
        streak: true,
        averageScore: true,
        level: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ stats: user });
  } catch (error: any) {
    console.error("🔥 Error in GET /api/users/stats:", error.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
