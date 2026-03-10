import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { newsId } = await req.json();
    if (!newsId) {
      return NextResponse.json({ error: "News ID is required" }, { status: 400 });
    }

    if (!(prisma as any).savedNews) {
      return NextResponse.json({ error: "Bookmarking system is currently unavailable" }, { status: 503 });
    }

    const existingSave = await (prisma as any).savedNews.findUnique({
      where: {
        userId_newsId: {
          userId: session.user.id,
          newsId: newsId,
        },
      },
    });

    if (existingSave) {
      await (prisma as any).savedNews.delete({
        where: { id: existingSave.id },
      });
      return NextResponse.json({ message: "News unbookmarked", isSaved: false });
    } else {
      await (prisma as any).savedNews.create({
        data: {
          userId: session.user.id,
          newsId: newsId,
        },
      });
      return NextResponse.json({ message: "News bookmarked", isSaved: true });
    }
  } catch (error) {
    console.error("Error toggling news bookmark:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
