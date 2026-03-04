import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: {
        NOT: { role: "instruktur" },
      },
      select: {
        id: true,
        name: true,
        role: true,
        avatar: true,
        // You can add more fields as needed
        // e.g. class, points, status if available in your schema
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}
