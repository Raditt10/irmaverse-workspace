import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/activities
 * Ambil riwayat aktivitas pengguna yang sedang login
 * Query params:
 *   - limit: jumlah data (default 20)
 *   - cursor: pagination cursor (id aktivitas terakhir)
 *   - userId: (opsional) untuk melihat aktivitas user lain (public)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const cursor = searchParams.get("cursor");
    const userId = searchParams.get("userId") || session.user.id;

    const activities = await prisma.activity_logs.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        xpEarned: true,
        createdAt: true,
        metadata: true,
      },
    });

    const hasMore = activities.length > limit;
    const data = hasMore ? activities.slice(0, limit) : activities;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return NextResponse.json({
      activities: data,
      nextCursor,
      hasMore,
    });
  } catch (error: any) {
    console.error("🔥 Error GET /api/activities:", error.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
