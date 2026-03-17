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

    // 2. Ambil list kajian (materi) yang dibuat instruktur
    const materials = await prisma.material.findMany({
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
      },
    });

    // 3. Hitung stats: Total Peserta (attendance) & Avg Rating
    const materialIds = materials.map((m) => m.id);
    
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

    return NextResponse.json({
      instructor: {
        ...instructor,
        createdAt: instructor.createdAt.toISOString(),
        lastSeen: instructor.lastSeen.toISOString(),
      },
      materials: materials.map(m => ({
        ...m,
        date: m.date.toISOString(),
      })),
      stats: {
        kajianCount: materials.length,
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
