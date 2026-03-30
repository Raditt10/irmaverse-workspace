"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";

import BackButton from "@/components/ui/BackButton";
import { Calendar, Eye, Share2, Bookmark } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import Loading from "@/components/ui/Loading";
import Toast from "@/components/ui/Toast";
import { Newspaper } from "lucide-react";

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
  isSaved?: boolean;
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
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info" | "warning";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error" | "info" | "warning" = "success") => {
    setToast({ show: true, message, type });
  };

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
        showToast("Berhasil dibagikan!", "success");
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast("Link berita berhasil disalin ke clipboard!", "success");
      }
    } catch (error) {
       if ((error as Error).name !== 'AbortError') {
         showToast("Gagal membagikan", "error");
       }
    }
  };

  const handleSave = async () => {
    if (!news || isSaving) return;
    
    setIsSaving(true);
    try {
      const response = await fetch("/api/news/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsId: news.id }),
      });

      if (!response.ok) throw new Error("Gagal menyimpan berita");
      
      const data = await response.json();
      setNews(prev => prev ? { ...prev, isSaved: data.isSaved } : null);
      showToast(data.message, data.isSaved ? "success" : "info");
    } catch (error) {
      console.error("Error saving news:", error);
      showToast("Gagal menyimpan berita", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <Loading text="Memuat berita..." size="lg" />
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Berita tidak ditemukan</p>
          <BackButton onClick={() => window.history.back()} />
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
      className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100"
      style={{

      }}
    >
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <div className="mb-8">
              <BackButton onClick={() => window.history.back()} />
            </div>

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
                <h1 className="text-4xl lg:text-5xl font-black text-slate-800 mb-4 wrap-break-word">
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
                    Diposting oleh: <span className="font-semibold">{news.author.name || news.author.email}</span>
                  </div>
                </div>

                {/* Markdown Content */}
                <div className="prose prose-lg max-w-none mb-8">
                  <ReactMarkdown
                    components={{
                      h1: ({ node, ...props }) => (
                        <h1 className="text-3xl font-bold text-slate-800 mt-6 mb-4 wrap-break-word" {...props} />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2 className="text-2xl font-bold text-slate-800 mt-6 mb-4 wrap-break-word" {...props} />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3 className="text-xl font-bold text-slate-800 mt-4 mb-3 wrap-break-word" {...props} />
                      ),
                      p: ({ node, ...props }) => (
                        <p className="text-slate-700 leading-7 mb-4 wrap-break-word" {...props} />
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
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`p-3 rounded-xl border-2 border-b-4 transition-all ${
                      news.isSaved
                        ? "bg-amber-400 border-amber-600 text-white shadow-inner active:border-b-2 translate-y-0.5"
                        : "bg-white border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-400 active:border-b-2 active:translate-y-0.5 shadow-md"
                    }`}
                    title={news.isSaved ? "Hapus dari simpanan" : "Simpan berita"}
                  >
                    <Bookmark className={`h-5 w-5 ${news.isSaved ? "fill-current" : ""}`} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-3 rounded-xl border-2 border-slate-200 border-b-4 bg-white text-slate-400 hover:text-teal-500 hover:border-teal-400 active:border-b-2 active:translate-y-0.5 transition-all shadow-md group"
                    title="Bagikan berita"
                  >
                    <Share2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  </button>
                </div>

                {/* Save Prompt */}
                {!news.isSaved && (
                  <div className="mt-8 bg-amber-50 rounded-4xl p-6 border-2 border-amber-200 border-dashed flex flex-col items-center text-center">
                    <Newspaper className="h-8 w-8 text-amber-500 mb-3" />
                    <h3 className="text-lg font-black text-amber-900 mb-1">Berita ini menarik?</h3>
                    <p className="text-sm text-amber-700 font-bold mb-4">Simpan agar berita ini selalu muncul di paling atas daftar berita Anda!</p>
                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-6 py-3 rounded-2xl bg-amber-400 text-white font-black border-2 border-amber-600 border-b-4 hover:bg-amber-500 active:border-b-2 active:translate-y-0.5 transition-all flex items-center gap-2 shadow-lg"
                    >
                      <Bookmark className="h-5 w-5" />
                      Sematkan Berita
                    </button>
                  </div>
                )}
              </div>
            </article>
          </div>
        </div>
      </div>

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
}
