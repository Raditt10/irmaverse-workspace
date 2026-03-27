import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const VALID_ROLES = ["user", "instruktur", "admin", "super_admin"] as const;
type ValidRole = (typeof VALID_ROLES)[number];

const isValidRole = (value: string): value is ValidRole =>
  VALID_ROLES.includes(value as ValidRole);

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role") || "all"; // all | user | instruktur
    const period = searchParams.get("period") || "all"; // all | week | month
    const limit = Math.min(Number(searchParams.get("limit") || 100), 200);

    // ── Build where clause ──────────────────────────────────────────────
    const where: Record<string, unknown> = {};
    if (role !== "all" && isValidRole(role)) {
      where.role = role;
    }

    // ── Period-based leaderboard ────────────────────────────────────────
    if (period !== "all") {
      const now = new Date();
      const startDate = new Date(now);
      if (period === "week") {
        startDate.setDate(now.getDate() - 7);
      } else if (period === "month") {
        startDate.setDate(now.getDate() - 30);
      }

      // For period-based, we aggregate XP from activity logs
      const periodRanking = await prisma.activity_logs.groupBy({
        by: ["userId"],
        where: {
          createdAt: { gte: startDate },
          ...(role !== "all" && isValidRole(role) ? { user: { role } } : {}),
        },
        _sum: { xpEarned: true },
        orderBy: { _sum: { xpEarned: "desc" } },
        take: limit,
      });

      const userIds = periodRanking.map((r) => r.userId);
      const usersMap = new Map(
        (
          await prisma.users.findMany({
            where: { id: { in: userIds } },
            select: {
              id: true,
              name: true,
              avatar: true,
              role: true,
              points: true,
              badges: true,
              level: true,
              streak: true,
            },
          })
        ).map((u) => [u.id, u]),
      );

      const users = periodRanking
        .map((r, i) => {
          const u = usersMap.get(r.userId);
          if (!u) return null;
          return {
            id: u.id,
            name: u.name ?? "Pengguna",
            avatar: u.avatar,
            role: u.role,
            points: u.points,
            periodXp: r._sum.xpEarned ?? 0,
            badges: u.badges,
            level: u.level,
            streak: u.streak,
            globalRank: i + 1,
          };
        })
        .filter(Boolean);

      // Find current user rank in this period
      const myPeriodXp = periodRanking.find(
        (r) => r.userId === session.user!.id,
      );
      const myRank = myPeriodXp ? periodRanking.indexOf(myPeriodXp) + 1 : null;

      return NextResponse.json({
        users,
        period,
        role,
        myRank,
        total: users.length,
      });
    }

    // ── All-time leaderboard ────────────────────────────────────────────
    const rawUsers = await prisma.users.findMany({
      where,
      orderBy: { points: "desc" },
      select: {
        id: true,
        name: true,
        avatar: true,
        role: true,
        points: true,
        badges: true,
        level: true,
        streak: true,
      },
      take: limit,
    });

    const users = rawUsers.map((u, i) => ({
      id: u.id,
      name: u.name ?? "Pengguna",
      avatar: u.avatar,
      role: u.role,
      points: u.points,
      periodXp: u.points,
      badges: u.badges,
      level: u.level,
      streak: u.streak,
      globalRank: i + 1,
    }));

    // Find current user rank
    const myIdx = users.findIndex((u) => u.id === session.user!.id);
    const myRank = myIdx >= 0 ? myIdx + 1 : null;

    return NextResponse.json({
      users,
      period,
      role,
      myRank,
      total: users.length,
    });
  } catch (error) {
    console.error("[LEADERBOARD] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
