import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();
    if (!id) return NextResponse.json({ error: "No id provided" }, { status: 400 });
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        role: true,
        avatar: true,
        email: true,
        notelp: true,
        createdAt: true,
        // Tambahkan field lain jika ada (class, points, status, dsb)
        },
      });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    // Dummy/empty for stats, achievements, recentActivities (bisa diisi jika sudah ada di DB)
    return NextResponse.json({
      ...user,
      class: "-",
      points: 0,
      status: "Aktif",
      totalEvents: 0,
      totalKajian: 0,
      stats: { eventsAttended: 0, kajianAttended: 0, tasksCompleted: 0, contributionRank: 0 },
      achievements: [],
      recentActivities: [],
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch member detail" }, { status: 500 });
  }
}
