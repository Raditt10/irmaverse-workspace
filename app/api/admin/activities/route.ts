import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/activities
 * Ambil riwayat aktivitas admin dan super_admin
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const role = session?.user?.role?.toLowerCase();
    
    if (!session || (role !== "admin" && role !== "super_admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

    const activities = await prisma.activityLog.findMany({
      where: {
        user: {
          role: {
            in: ["admin", "super_admin"] as any[]
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        xpEarned: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            role: true
          }
        }
      },
    });

    return NextResponse.json({
      activities
    });
  } catch (error: any) {
    console.error("🔥 Error GET /api/admin/activities:", error.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
