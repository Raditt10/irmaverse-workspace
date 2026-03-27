import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const instructors = await prisma.users.findMany({
      where: { role: "instruktur" },
      select: {
        id: true,
        name: true,
        avatar: true,
        bidangKeahlian: true,
        pengalaman: true,
        bio: true,
        material: {
          select: {
            id: true,
            date: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const now = new Date();

    const result = await Promise.all(
      instructors.map(async (instructor) => {
        // Hitung kajian yang sudah selesai (tanggal sudah lewat)
        const completedKajianCount = instructor.material.filter(
          (m) => new Date(m.date) < now
        ).length;

        // Hitung rata-rata rating dari attendance untuk material instruktur ini
        const materialIds = instructor.material.map((m) => m.id);
        let avgRating = 0;
        if (materialIds.length > 0) {
          const ratingResult = await prisma.attendance.aggregate({
            where: {
              materialId: { in: materialIds },
              rating: { not: null },
            },
            _avg: { rating: true },
          });
          avgRating = ratingResult._avg.rating ?? 0;
        }

        const { material, ...rest } = instructor;
        return {
          ...rest,
          rating: Math.round(avgRating * 10) / 10,
          kajianCount: completedKajianCount,
        };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch instructors" }, { status: 500 });
  }
}
