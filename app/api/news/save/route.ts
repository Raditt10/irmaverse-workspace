import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { newsId } = await request.json();
    if (!newsId) {
      return NextResponse.json({ error: "News ID is required" }, { status: 400 });
    }

    // Check if news exists
    const news = await prisma.news.findUnique({
      where: { id: newsId },
    });

    if (!news) {
      return NextResponse.json({ error: "News not found" }, { status: 404 });
    }

    // Toggle save status
    const existingSave = await prisma.saved_news.findUnique({
      where: {
        userId_newsId: {
          userId: user.id,
          newsId,
        },
      },
    });

    if (existingSave) {
      // Unsave
      await prisma.saved_news.delete({
        where: {
          id: existingSave.id,
        },
      });
      return NextResponse.json({ 
        message: "Berita dihapus dari simpanan", 
        isSaved: false 
      });
    } else {
      // Save
      await prisma.saved_news.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          newsId,
        },
      });
      return NextResponse.json({ 
        message: "Berita berhasil disimpan!", 
        isSaved: true 
      });
    }
  } catch (error: any) {
    console.error("Error toggling news save:", error);
    return NextResponse.json(
      { error: "Gagal memproses permintaan" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ isSaved: false });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ isSaved: false });
    }

    const newsId = request.nextUrl.searchParams.get("newsId");
    if (!newsId) {
      return NextResponse.json({ error: "News ID is required" }, { status: 400 });
    }

    const existingSave = await prisma.saved_news.findUnique({
      where: {
        userId_newsId: {
          userId: user.id,
          newsId,
        },
      },
    });

    return NextResponse.json({ isSaved: !!existingSave });
  } catch (error) {
    console.error("Error checking news save status:", error);
    return NextResponse.json({ isSaved: false });
  }
}
