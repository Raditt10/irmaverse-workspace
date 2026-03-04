import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: materialId } = await params;

    if (!materialId) {
      return NextResponse.json(
        { error: "Material ID is required" },
        { status: 400 },
      );
    }

    const material = await (prisma as any).material.findUnique({
      where: { id: materialId },
      include: {
        users: true,
      },
    });

    if (!material) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role !== "instruktur" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Only instructor or admin can view attendance" },
        { status: 403 },
      );
    }

    const attendances = await (prisma as any).attendance.findMany({
      where: {
        materialId: materialId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const attendanceWithUsers = await Promise.all(
      attendances.map(async (att: any) => {
        const attendanceUser = await prisma.user.findUnique({
          where: { id: att.userId },
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        });
        return {
          ...att,
          user: attendanceUser,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      material: {
        id: material.id,
        title: material.title,
        date: material.date,
      },
      attendances: attendanceWithUsers,
      total: attendanceWithUsers.length,
    });
  } catch (error) {
    console.error("Get attendance error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 },
    );
  }
}
