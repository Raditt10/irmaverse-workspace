import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: ambil semua favorit instruktur milik user yang login
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const favorites = await prisma.favorite_instructors.findMany({
    where: { userId: session.user.id },
    select: { instructorId: true },
  });

  const ids = favorites.map((f: { instructorId: string }) => f.instructorId);
  return NextResponse.json({ favoriteIds: ids });
}

// POST: toggle favorit (tambah atau hapus)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { instructorId } = await req.json();
  if (!instructorId) {
    return NextResponse.json({ error: "instructorId required" }, { status: 400 });
  }

  const userId = session.user.id;

  const existing = await prisma.favorite_instructors.findUnique({
    where: {
      userId_instructorId: {
        userId,
        instructorId,
      },
    },
  });

  if (existing) {
    // Sudah ada → hapus (unfavorite)
    await prisma.favorite_instructors.delete({
      where: {
        userId_instructorId: {
          userId,
          instructorId,
        },
      },
    });
    return NextResponse.json({ action: "removed", instructorId });
  } else {
    // Belum ada → tambah (favorite)
    await prisma.favorite_instructors.create({
      data: { 
        id: crypto.randomUUID(),
        userId, 
        instructorId 
      },
    });
    return NextResponse.json({ action: "added", instructorId });
  }
}
