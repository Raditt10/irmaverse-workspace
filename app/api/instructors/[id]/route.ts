import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: instructorId } = await params;

    // 1. Ambil profile dasar instruktur
    const instructor = await prisma.users.findUnique({
      where: { id: instructorId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        role: true,
        bidangKeahlian: true,
        pengalaman: true,
        createdAt: true,
        lastSeen: true,
      },
    });

    if (!instructor || instructor.role !== "instruktur") {
      return NextResponse.json(
        { error: "Instruktur tidak ditemukan" },
        { status: 404 },
      );
    }

    // 2. Ambil list kajian beserta invite per kajian
    const materials = await (prisma as any).material.findMany({
      where: { instructorId },
      orderBy: { date: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        date: true,
        thumbnailUrl: true,
        category: true,
        grade: true,
        materialinvite: {
          select: {
            userId: true,
          },
        },
      },
    });

    // 3. Ambil attendance secara terpisah karena tidak ada relasi formal di schema
    const materialIds = materials.map((m: any) => m.id);
    const allAttendance = await prisma.attendance.findMany({
      where: {
        materialId: { in: materialIds },
      },
      select: {
        userId: true,
        materialId: true,
        status: true,
      },
    });

    // Determine "tuntas" per kajian: semua yang diundang sudah mengisi absensi
    const materialsWithStatus = materials.map((m: any) => {
      const invitedUserIds: string[] = m.materialinvite.map((i: any) => i.userId);
      const mAttendance = allAttendance.filter((a: any) => a.materialId === m.id);
      const attendedUserIds: string[] = mAttendance.map((a: any) => a.userId);
      
      const totalInvited = invitedUserIds.length;
      const totalAttended = invitedUserIds.filter((uid) =>
        attendedUserIds.includes(uid)
      ).length;
      const isTuntas = totalInvited > 0 && totalAttended === totalInvited;
      return {
        id: m.id,
        title: m.title,
        description: m.description,
        date: m.date.toISOString(),
        thumbnailUrl: m.thumbnailUrl,
        category: m.category,
        grade: m.grade,
        isTuntas,
        totalInvited,
        totalAttended,
      };
    });

    // Count unique users who attended this instructor's materials
    const totalParticipants = await prisma.attendance.count({
      where: {
        materialId: { in: materialIds },
        status: "hadir",
      },
    });

    // Average rating from attendance
    const ratingStats = await prisma.attendance.aggregate({
      where: {
        materialId: { in: materialIds },
        rating: { not: null },
      },
      _avg: { rating: true },
    });

    const completedKajianCount = materialsWithStatus.filter((m: any) => m.isTuntas).length;

    return NextResponse.json({
      instructor: {
        ...instructor,
        createdAt: instructor.createdAt.toISOString(),
        lastSeen: instructor.lastSeen.toISOString(),
      },
      materials: materialsWithStatus,
      stats: {
        kajianCount: materials.length,
        completedKajianCount,
        totalParticipants,
        averageRating: Math.round((ratingStats._avg.rating || 0) * 10) / 10,
      }
    });
  } catch (error: any) {
    console.error("Error fetching instructor detail:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
