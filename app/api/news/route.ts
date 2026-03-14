import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { recordActivity } from "@/lib/activity";
import { unlink } from "fs/promises";
import { join } from "path";

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-"); // Replace multiple hyphens with single hyphen
}

// Extract plain text from markdown and limit to first 160 characters
function generateDeskripsi(content: string, limit: number = 160): string {
  // Remove markdown syntax
  let plainText = content
    .replace(/#+\s/g, "") // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove bold
    .replace(/\*([^*]+)\*/g, "$1") // Remove italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links
    .replace(/`([^`]+)`/g, "$1") // Remove code
    .replace(/^[-*]\s/gm, "") // Remove list markers
    .trim();

  return plainText.length > limit ? plainText.substring(0, limit) + "..." : plainText;
}

// GET all news or search
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get("slug");
    const id = searchParams.get("id");
    const category = searchParams.get("category");

    const session = await auth();
    let userId: string | null = null;
    let savedNewsIds: Set<string> = new Set();
    
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      });
      if (user) {
        userId = user.id;
        // Fetch saved news separately to avoid Prisma inclusion error if client is out of sync
        const saved = await (prisma as any).savedNews.findMany({
          where: { userId: user.id },
          select: { newsId: true }
        });
        savedNewsIds = new Set(saved.map((s: any) => s.newsId));
      }
    }

    if (slug) {
      // Get specific news by slug
      const news = await prisma.news.findUnique({
        where: { slug },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      if (!news) {
        return NextResponse.json({ error: "News not found" }, { status: 404 });
      }

      const result = {
        ...news,
        isSaved: savedNewsIds.has(news.id),
      };

      return NextResponse.json(result);
    }

    if (id) {
      // Get specific news by id
      const news = await prisma.news.findUnique({
        where: { id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      });

      if (!news) {
        return NextResponse.json({ error: "News not found" }, { status: 404 });
      }

      const result = {
        ...news,
        isSaved: savedNewsIds.has(news.id),
      };

      return NextResponse.json(result);
    }

    // Get all news with optional category filter
    const where: any = {};
    if (category) {
      where.category = category;
    }

    const allNews = await prisma.news.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Map to include isSaved and sort
    const mappedNews = allNews.map((n: any) => ({
      ...n,
      isSaved: savedNewsIds.has(n.id),
    }));

    if (userId) {
      // Sort: saved first, then by createdAt desc
      mappedNews.sort((a: any, b: any) => {
        if (a.isSaved && !b.isSaved) return -1;
        if (!a.isSaved && b.isSaved) return 1;
        return 0; // maintain createdAt desc from database
      });
    }

    return NextResponse.json(mappedNews);
  } catch (error: any) {
    console.error("DEBUG: Error fetching news:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch news" },
      { status: 500 }
    );
  }
}

// POST create new news (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin or instructor
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    const isPrivileged = user?.role === "admin" || user?.role === "instruktur";

    if (!user || !isPrivileged) {
      return NextResponse.json(
        { error: "Only admins and instructors can create news" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, category, content, image } = body;

    if (!title || !category || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const slug = generateSlug(title);
    const deskripsi = generateDeskripsi(content);

    // Check if slug already exists
    const existingNews = await prisma.news.findUnique({
      where: { slug },
    });

    if (existingNews) {
      return NextResponse.json(
        { error: "A news with this title already exists" },
        { status: 400 }
      );
    }

    const news = await prisma.news.create({
      data: {
        title,
        slug,
        category,
        deskripsi,
        content,
        image: image || null,
        authorId: user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Log Activity
    const userRole = user.role?.toLowerCase();
    if (userRole === "admin" || userRole === "super_admin") {
      await recordActivity({
        userId: user.id,
        type: "admin_news_managed" as any,
        title: "Membuat Berita",
        description: `Admin membuat berita baru: ${news.title}`,
        metadata: { newsId: news.id }
      });
    }

    return NextResponse.json(news, { status: 201 });
  } catch (error: any) {
    console.error("Error creating news:", error);
    return NextResponse.json(
      { error: "Failed to create news" },
      { status: 500 }
    );
  }
}

// PUT update news (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    const isPrivileged = user?.role === "admin" || user?.role === "instruktur";

    if (!user || !isPrivileged) {
      return NextResponse.json(
        { error: "Only admins and instructors can update news" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, title, category, content, image, oldImage } = body;

    if (!id) {
      return NextResponse.json(
        { error: "News ID is required" },
        { status: 400 }
      );
    }

    const existingNews = await prisma.news.findUnique({
      where: { id },
    });

    if (!existingNews) {
      return NextResponse.json(
        { error: "News not found" },
        { status: 404 }
      );
    }

    const deskripsi = content ? generateDeskripsi(content) : undefined;
    const newSlug = title ? generateSlug(title) : undefined;

    const updatedNews = await prisma.news.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(newSlug && { slug: newSlug }),
        ...(category && { category }),
        ...(deskripsi && { deskripsi }),
        ...(content && { content }),
        ...(image !== undefined && { image }),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Log Activity
    const userRole = user.role?.toLowerCase();
    if (userRole === "admin" || userRole === "super_admin") {
      await recordActivity({
        userId: user.id,
        type: "admin_news_managed" as any,
        title: "Memperbarui Berita",
        description: `Admin memperbarui berita: ${updatedNews.title}`,
        metadata: { newsId: updatedNews.id }
      });
    }

    // Delete old image if it was replaced with a new one
    if (oldImage && oldImage.startsWith("/uploads/")) {
      try {
        const oldImagePath = join(process.cwd(), "public", oldImage);
        await unlink(oldImagePath);
      } catch (error) {
        console.error("Error deleting old image file:", error);
        // Continue even if old image deletion fails
      }
    }

    return NextResponse.json(updatedNews);
  } catch (error: any) {
    console.error("Error updating news:", error);
    return NextResponse.json(
      { error: "Failed to update news" },
      { status: 500 }
    );
  }
}

// DELETE news (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
    });

    const isPrivileged = user?.role === "admin" || user?.role === "instruktur";

    if (!user || !isPrivileged) {
      return NextResponse.json(
        { error: "Only admins and instructors can delete news" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "News ID is required" },
        { status: 400 }
      );
    }

    // Get news data first to check if there's an uploaded image
    const existingNews = await prisma.news.findUnique({
      where: { id },
    });

    if (!existingNews) {
      return NextResponse.json(
        { error: "News not found" },
        { status: 404 }
      );
    }

    // Delete the news from database
    await prisma.news.delete({
      where: { id },
    });

    // Log Activity
    const userRole = user.role?.toLowerCase();
    if (userRole === "admin" || userRole === "super_admin") {
      await recordActivity({
        userId: user.id,
        type: "admin_news_managed" as any,
        title: "Menghapus Berita",
        description: `Admin menghapus berita: ${existingNews.title}`,
        metadata: { newsId: id }
      });
    }

    // Delete the image file if it's an uploaded file (starts with /uploads/)
    if (existingNews.image && existingNews.image.startsWith("/uploads/")) {
      try {
        const imagePath = join(process.cwd(), "public", existingNews.image);
        await unlink(imagePath);
      } catch (error) {
        console.error("Error deleting image file:", error);
        // Continue even if image deletion fails
      }
    }

    return NextResponse.json(
      { message: "News deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting news:", error);
    return NextResponse.json(
      { error: "Failed to delete news" },
      { status: 500 }
    );
  }
}
