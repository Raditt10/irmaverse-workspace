"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import { ArrowLeft, Calendar, Eye, Share2, Bookmark } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface NewsDetail {
  id: string;
  title: string;
  slug: string;
  category: string;
  content: string;
  deskripsi: string;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  views?: number;
}

const categoryStyles: Record<string, string> = {
  Prestasi: "bg-emerald-500 text-white",
  Kerjasama: "bg-cyan-500 text-white",
  Update: "bg-blue-500 text-white",
  Event: "bg-purple-500 text-white",
  Pengumuman: "bg-amber-500 text-white",
};

export default function NewsDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [news, setNews] = useState<NewsDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNewsDetail();
  }, [slug]);

  const fetchNewsDetail = async () => {
    try {
      const response = await fetch(`/api/news?slug=${slug}`);
      if (!response.ok) throw new Error("Failed to fetch news");
      const data = await response.json();
      setNews(data);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!news) return;

    const shareData = {
      title: news.title,
      text: news.deskripsi,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link berita berhasil disalin ke clipboard!");
      }
    } catch (error) {
      try {
        await navigator.clipboard.writeText(window.location.href);
      } catch (clipboardError) {
        console.error("Clipboard error:", clipboardError);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <p className="text-slate-500">Memuat berita...</p>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Berita tidak ditemukan</p>
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke daftar berita
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(news.createdAt).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100"
      style={{

      }}
    >
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Link
              href="/news"
              className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-semibold mb-8"
            >
              <ArrowLeft className="h-5 w-5" />
              Kembali ke daftar berita
            </Link>

            {/* Article Container */}
            <article className="bg-white rounded-3xl shadow-lg overflow-hidden">
              {/* Header Image */}
              {news.image && (
                <div className="w-full h-96 overflow-hidden">
                  <img
                    src={news.image}
                    alt={news.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-8 lg:p-12">
                {/* Category Badge */}
                <div className="mb-4">
                  <span
                    className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                      categoryStyles[news.category] ||
                      "bg-emerald-500 text-white"
                    }`}
                  >
                    {news.category}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-4xl lg:text-5xl font-black text-slate-800 mb-4">
                  {news.title}
                </h1>

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-6 text-slate-500 mb-8 pb-8 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <span>{formattedDate}</span>
                  </div>
                  {news.views !== undefined && (
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      <span>{news.views?.toLocaleString()} views</span>
                    </div>
                  )}
                  <div className="text-sm">
                    Oleh: <span className="font-semibold">{news.author.name || news.author.email}</span>
                  </div>
                </div>

                {/* Markdown Content */}
                <div className="prose prose-lg max-w-none mb-8">
                  <ReactMarkdown
                    components={{
                      h1: ({ node, ...props }) => (
                        <h1 className="text-3xl font-bold text-slate-800 mt-6 mb-4" {...props} />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2 className="text-2xl font-bold text-slate-800 mt-6 mb-4" {...props} />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3 className="text-xl font-bold text-slate-800 mt-4 mb-3" {...props} />
                      ),
                      p: ({ node, ...props }) => (
                        <p className="text-slate-700 leading-7 mb-4" {...props} />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong className="font-bold text-slate-900" {...props} />
                      ),
                      em: ({ node, ...props }) => (
                        <em className="italic text-slate-700" {...props} />
                      ),
                      ul: ({ node, ...props }) => (
                        <ul className="list-disc list-inside text-slate-700 mb-4 space-y-2" {...props} />
                      ),
                      ol: ({ node, ...props }) => (
                        <ol className="list-decimal list-inside text-slate-700 mb-4 space-y-2" {...props} />
                      ),
                      li: ({ node, ...props }) => (
                        <li className="text-slate-700" {...props} />
                      ),
                      blockquote: ({ node, ...props }) => (
                        <blockquote
                          className="border-l-4 border-teal-500 pl-4 py-2 italic text-slate-600 my-4"
                          {...props}
                        />
                      ),
                      code: ({ inline, ...props }: any) =>
                        inline ? (
                          <code
                            className="bg-slate-100 text-slate-800 px-2 py-1 rounded text-sm font-mono"
                            {...props}
                          />
                        ) : (
                          <code
                            className="block bg-slate-100 text-slate-800 p-4 rounded-lg overflow-x-auto text-sm font-mono my-4"
                            {...props}
                          />
                        ),
                      a: ({ node, ...props }) => (
                        <a className="text-teal-600 hover:text-teal-700 underline" {...props} />
                      ),
                    }}
                  >
                    {news.content}
                  </ReactMarkdown>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-8 border-t border-slate-200">
                  <button className="p-3 rounded-lg hover:bg-slate-100 transition-colors text-slate-600">
                    <Bookmark className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-3 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
                    title="Bagikan berita"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>
      <ChatbotButton />
    </div>
  );
}
