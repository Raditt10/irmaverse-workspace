"use client";
import { useState } from "react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import BackButton from "@/components/ui/BackButton";
import { Calendar, Eye, Share2, Bookmark, Newspaper } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Toast from "@/components/ui/Toast";

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

export default function NewsDetailClient({ news: initialNews }: { news: NewsDetail }) {
  const [news, setNews] = useState(initialNews);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
  };

  const handleShare = async () => {
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
        showToast("Link berita berhasil disalin!", "success");
      }
    } catch (error) {
       if ((error as Error).name !== 'AbortError') {
         showToast("Gagal membagikan", "error");
       }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/news/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsId: news.id }),
      });

      if (!response.ok) throw new Error("Gagal menyimpan berita");
      
      const data = await response.json();
      setNews(prev => ({ ...prev, isSaved: data.isSaved }));
      showToast(data.message, "success");
    } catch (error) {
      console.error("Error saving news:", error);
      showToast("Gagal menyimpan berita", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDate = new Date(news.createdAt).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8 lg:py-12 w-full max-w-[100vw] overflow-x-hidden">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <div className="mb-8">
              <BackButton onClick={() => window.history.back()} />
            </div>

            {/* Article Container */}
            <article className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-[0_8px_0_0_#cbd5e1] overflow-hidden">
              {/* Header Image */}
              {news.image && (
                <div className="w-full h-64 md:h-96 overflow-hidden border-b-2 border-slate-200">
                  <img
                    src={news.image}
                    alt={news.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-6 md:p-8 lg:p-12">
                {/* Category Badge */}
                <div className="mb-6 flex items-center justify-between">
                  <span
                    className={`inline-block px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider ${
                      categoryStyles[news.category] || "bg-emerald-500 text-white"
                    }`}
                  >
                    {news.category}
                  </span>
                  
                  <div className="flex items-center gap-2">
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
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-5xl font-black text-slate-800 mb-6 leading-tight">
                  {news.title}
                </h1>

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-6 text-slate-400 font-bold text-sm mb-10 pb-8 border-b-2 border-slate-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-teal-500" />
                    <span>{formattedDate}</span>
                  </div>
                  {news.views !== undefined && (
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-emerald-500" />
                      <span>{news.views?.toLocaleString()} views</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 border border-slate-200">
                      {(news.author.name || news.author.email).charAt(0).toUpperCase()}
                    </div>
                    <span>{news.author.name || news.author.email}</span>
                  </div>
                </div>

                {/* Markdown Content */}
                <div className="prose prose-slate prose-lg max-w-none mb-12 prose-headings:font-black prose-headings:text-slate-800 prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-slate-900 prose-blockquote:border-teal-500 prose-blockquote:bg-slate-50 prose-blockquote:rounded-r-2xl prose-img:rounded-3xl prose-a:text-teal-600 prose-a:no-underline hover:prose-a:underline">
                  <ReactMarkdown>
                    {news.content}
                  </ReactMarkdown>
                </div>
                
                {/* Save Prompt */}
                {!news.isSaved && (
                  <div className="bg-amber-50 rounded-3xl p-6 border-2 border-amber-200 border-dashed flex flex-col items-center text-center">
                    <Newspaper className="h-8 w-8 text-amber-500 mb-3" />
                    <h3 className="text-lg font-black text-amber-900 mb-1">Berita ini menarik?</h3>
                    <p className="text-sm text-amber-700 font-bold mb-4">Simpan agar berita ini selalu muncul di paling atas daftar berita Anda!</p>
                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-6 py-3 rounded-2xl bg-amber-400 text-white font-black border-2 border-amber-600 border-b-4 hover:bg-amber-500 active:border-b-2 active:translate-y-0.5 transition-all flex items-center gap-2"
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
      <ChatbotButton />
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
}
