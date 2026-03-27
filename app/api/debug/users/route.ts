import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const allUsers = await prisma.users.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    console.log("All users in database:", JSON.stringify(allUsers, null, 2));

    return NextResponse.json({
      success: true,
      total: allUsers.length,
      users: allUsers,
    });
  } catch (error) {
    console.error("Debug users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
