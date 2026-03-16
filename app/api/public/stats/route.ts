import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [totalMembers, totalInstructors] = await Promise.all([
      prisma.user.count({
        where: {
          role: "user"
        }
      }),
      prisma.user.count({
        where: {
          role: "instruktur"
        }
      })
    ]);

    return NextResponse.json({
      totalMembers,
      totalInstructors
    });
  } catch (error) {
    console.error("Public Stats API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
