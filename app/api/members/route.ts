import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";


export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const User = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
        
    if (!User) {
      console.log('User not found in database:', session.user.id);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const users = await prisma.user.findMany({
      where: {
        role: "user",
        id: { not: User.id },
      },
      select: {
        id: true,
        name: true,
        role: true,
        avatar: true,
        lastSeen: true,
        points: true,
        class: true,
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
