import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/badges
 * Ambil semua badge beserta status earned oleh user yang login
 * Query params:
 *   - userId: (opsional) lihat badge user lain
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session.user.id;

    // Ambil semua badge
    const allBadges = await prisma.badges.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    // Ambil badge yang sudah dimiliki user
    const earnedBadges = await prisma.user_badges.findMany({
      where: { userId },
      select: {
        badgeId: true,
        earnedAt: true,
      },
    });

    const earnedMap = new Map(
      earnedBadges.map((eb) => [eb.badgeId, eb.earnedAt]),
    );

    const badges = allBadges.map((badge) => ({
      id: badge.id,
      code: badge.code,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      category: badge.category,
      requirement: badge.requirement,
      xpReward: badge.xpReward,
      earned: earnedMap.has(badge.id),
      earnedAt: earnedMap.get(badge.id) || null,
    }));

    const earnedCount = earnedBadges.length;
    const totalCount = allBadges.length;

    return NextResponse.json({
      badges,
      earnedCount,
      totalCount,
    });
  } catch (error: any) {
    console.error("🔥 Error GET /api/badges:", error.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
