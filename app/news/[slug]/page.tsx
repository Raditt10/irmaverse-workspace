import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import { auth } from "@/lib/auth";
import NewsDetailClient from "./NewsDetailClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const news = await prisma.news.findUnique({
    where: { slug },
  });

  if (!news) {
    return {
      title: "Berita Tidak Ditemukan | IRMA Verse",
      description: "Berita yang Anda cari tidak dapat ditemukan.",
    };
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const imageUrl = news.image?.startsWith("http")
    ? news.image
    : `${baseUrl}${news.image || "/og-image.png"}`;

  return {
    title: `${news.title} | IRMA Verse`,
    description: news.deskripsi || "Baca berita terbaru di IRMA Verse!",
    openGraph: {
      title: news.title,
      description: news.deskripsi || "Baca berita terbaru di IRMA Verse!",
      url: `${baseUrl}/news/${slug}`,
      siteName: "IRMA Verse",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: news.title,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: news.title,
      description: news.deskripsi || "Baca berita terbaru di IRMA Verse!",
      images: [imageUrl],
    },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();

  try {
    const news = await prisma.news.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!news) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <p className="text-slate-500">Berita tidak ditemukan</p>
        </div>
      );
    }

    // Check if saved
    let isSaved = false;
    if (session?.user?.id && (prisma as any).savedNews) {
      try {
        // @ts-ignore
        const saved = await prisma.savedNews.findUnique({
          where: {
            userId_newsId: {
              userId: session.user.id,
              newsId: news.id,
            },
          },
        });
        isSaved = !!saved;
      } catch (e) {
        console.error("Error checking savedNews in NewsDetailPage:", e);
      }
    }

    const formattedNews = {
      ...news,
      createdAt: news.createdAt.toISOString(),
      updatedAt: news.updatedAt.toISOString(),
      isSaved,
    };

    return <NewsDetailClient news={formattedNews as any} />;
  } catch (error) {
    console.error("Error loading news page:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Terjadi kesalahan saat memuat berita</p>
      </div>
    );
  }
}
