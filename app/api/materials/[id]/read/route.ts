import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { grantXp } from "@/lib/gamification";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

// POST /api/materials/[id]/read — Grant XP for reading a material (once per user per material)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check material exists
    const material = await prisma.material.findUnique({
      where: { id },
      select: { id: true, title: true },
    });
    if (!material) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 },
      );
    }

    // Check if user already got XP for this material (prevent duplicates)
    const existing = await prisma.activityLog.findFirst({
      where: {
        userId: session.user.id,
        type: "material_read",
        metadata: {
          path: "materialId",
          equals: id,
        } as Prisma.JsonNullableFilter,
      },
    });

    if (existing) {
      return NextResponse.json({
        alreadyRead: true,
        message: "Kamu sudah membaca materi ini sebelumnya",
      });
    }

    // Grant XP
    const result = await grantXp({
      userId: session.user.id,
      type: "material_read",
      title: `Membaca Materi: ${material.title}`,
      description: `Menyelesaikan bacaan materi "${material.title}"`,
      metadata: { materialId: id, materialTitle: material.title },
    });

    return NextResponse.json({
      alreadyRead: false,
      xpEarned: result.xpEarned,
      newTotal: result.newTotal,
      leveledUp: result.leveledUp,
      newLevel: result.newLevel,
      badgesEarned: result.badgesEarned,
      message: `+${result.xpEarned} XP dari membaca materi!`,
    });
  } catch (error) {
    console.error("[MATERIAL_READ] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
