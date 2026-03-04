import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Debug endpoint to test fetching invitations for a specific user
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter required" },
        { status: 400 },
      );
    }

    console.log("[DEBUG-USER-INVITATIONS] Fetching for user:", userId);

    // Get pending invitations for this user
    const invitations = await prisma.materialinvite.findMany({
      where: {
        userId,
        status: "pending",
      },
      include: {
        material: true,
        users_materialinvite_instructorIdTousers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(
      "[DEBUG-USER-INVITATIONS] Found:",
      invitations.length,
      "invitations",
    );

    return NextResponse.json({
      success: true,
      userId,
      invitations,
      total: invitations.length,
    });
  } catch (error) {
    console.error("[DEBUG-USER-INVITATIONS] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch", details: String(error) },
      { status: 500 },
    );
  }
}
