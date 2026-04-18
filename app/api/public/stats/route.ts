import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [totalMembers, totalInstructors] = await Promise.all([
      prisma.users.count({
        where: {
          role: "user"
        }
      }),
      prisma.users.count({
        where: {
          role: "instruktur"
        }
      })
    ]);

    return NextResponse.json({
      totalMembers,
      totalInstructors
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error("Public Stats API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
