"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import Loading from "@/components/ui/Loading";
import {
  BookOpen,
  ArrowLeft,
  Calendar,
  User,
  FileText,
  Pencil,
  ExternalLink,
  Clock,
  Tag,
  GraduationCap,
} from "lucide-react";

interface RekapanData {
  id: string;
  materialId: string;
  content?: string;
  link?: string;
  createdAt: string;
  updatedAt: string;
  material: {
    id: string;
    title: string;
    description: string;
    date: string;
    category: string;
    grade: string;
    instructor: string;
  };
}

const CATEGORY_LABEL: Record<string, string> = {
  Wajib: "Program Wajib",
  Extra: "Program Ekstra",
  NextLevel: "Program Susulan",
  Susulan: "Program Susulan",
};
const CATEGORY_COLOR: Record<string, string> = {
  Wajib: "bg-teal-100 text-teal-700 border-teal-200",
  Extra: "bg-purple-100 text-purple-700 border-purple-200",
  NextLevel: "bg-amber-100 text-amber-700 border-amber-200",
  Susulan: "bg-orange-100 text-orange-700 border-orange-200",
};

const GRADE_LABEL: Record<string, string> = {
  X: "Kelas 10",
  XI: "Kelas 11",
  XII: "Kelas 12",
};

const RekapanDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const materialId = params.id as string;

  const [rekapan, setRekapan] = useState<RekapanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      if (typeof window !== "undefined") {
        window.location.href = "/auth";
      }
    },
  });

  const role = session?.user?.role?.toLowerCase();
  const isPrivileged =
    role === "instruktur" || role === "admin" || role === "instructor" || role === "super_admin";

  useEffect(() => {
    if (status === "authenticated" && materialId) {
      fetchRekapan();
    }
  }, [status, materialId]);

  const fetchRekapan = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/materials/${materialId}/rekapan`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error("Gagal mengambil rekapan");
      const data = await res.json();
      setRekapan(data);
    } catch (error) {
      console.error("Error fetching rekapan:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
            <Loading text="Memuat rekapan..." size="lg" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#FDFBF7]">
        <DashboardHeader />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 p-8 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center border-4 border-dashed border-slate-300 mb-6 mx-auto">
                <FileText className="h-10 w-10 text-slate-400" />
              </div>
              <h2 className="text-2xl font-black text-slate-700 mb-2">
                Rekapan Belum Tersedia
              </h2>
              <p className="text-slate-500 mb-6">
                Instruktur belum membuat ringkasan materi untuk kajian ini.
              </p>
              <button
                onClick={() => router.push(`/materials/${materialId}`)}
                className="px-6 py-3 rounded-xl bg-teal-500 text-white font-black border-2 border-teal-700 border-b-4 hover:bg-teal-600 active:border-b-2 active:translate-y-0.5 transition-all"
              >
                Kembali ke Materi
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!rekapan) return null;

  const categoryLabel = CATEGORY_LABEL[rekapan.material.category] || rekapan.material.category;
  const categoryColor = CATEGORY_COLOR[rekapan.material.category] || "bg-slate-100 text-slate-600 border-slate-200";
  const gradeLabel = GRADE_LABEL[rekapan.material.grade] || rekapan.material.grade;

  const hasDedicatedLink = rekapan.link && rekapan.link.trim() !== "";
  const contentStr = rekapan.content?.trim() || "";
  const isUrlInContent = /^(https?:\/\/[^\s]+)$/.test(contentStr);
  const finalLink = hasDedicatedLink ? rekapan.link : (isUrlInContent ? contentStr : null);
  const hasTextContent = !finalLink && contentStr.length > 0;

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 w-full max-w-[100vw] overflow-x-hidden px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
          <div className="max-w-3xl mx-auto">

            {/* --- TOP NAV --- */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => router.push("/materials/rekapan")}
                className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 font-bold transition-all group px-4 py-2 rounded-xl border-2 border-transparent hover:border-slate-200 hover:bg-white hover:shadow-sm"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Kembali
              </button>

              {isPrivileged && (
                <button
                  onClick={() => router.push(`/materials/${materialId}/rekapan/edit`)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-700 font-bold border-2 border-amber-200 hover:bg-amber-100 transition-all text-sm"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Rekapan
                </button>
              )}
            </div>

            {/* --- ARTICLE HEADER --- */}
            <article>
              {/* Meta badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${categoryColor}`}>
                  <Tag className="h-3 w-3" />
                  {categoryLabel}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border bg-slate-100 text-slate-600 border-slate-200">
                  <GraduationCap className="h-3 w-3" />
                  {gradeLabel}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl lg:text-4xl font-black text-slate-900 leading-tight mb-5 tracking-tight">
                {rekapan.material.title}
              </h1>

              {/* Author & Date bar */}
              <div className="flex flex-wrap items-center gap-5 pb-6 mb-8 border-b-2 border-dashed border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pemateri</p>
                    <p className="text-sm font-black text-slate-700">{rekapan.material.instructor}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-semibold">
                    {new Date(rekapan.material.date).toLocaleDateString("id-ID", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 ml-auto">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="text-xs font-bold">
                    Diperbarui{" "}
                    {new Date(rekapan.updatedAt).toLocaleDateString("id-ID", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* --- CONTENT AREA --- */}
              {finalLink ? (
                /* Link card */
                <div className="rounded-3xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-8 flex flex-col md:flex-row items-center gap-6">
                  <div className="w-20 h-20 shrink-0 bg-white rounded-2xl flex items-center justify-center border-2 border-emerald-200 shadow-md">
                    <ExternalLink className="h-9 w-9 text-emerald-500" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-1">Materi Eksternal</p>
                    <h2 className="text-xl font-black text-slate-800 mb-2">Ringkasan tersedia di tautan luar</h2>
                    <p className="text-sm text-slate-500 font-medium mb-5 line-clamp-1">{finalLink}</p>
                    <a
                      href={finalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-[0_4px_0_0_#047857] hover:shadow-[0_2px_0_0_#047857] active:translate-y-0.5 active:shadow-none transition-all"
                    >
                      <BookOpen className="h-4 w-4" />
                      Buka Materi
                    </a>
                  </div>
                </div>
              ) : hasTextContent ? (
                /* Full article text */
                <div
                  className="
                    prose prose-slate max-w-none
                    prose-p:text-slate-700 prose-p:leading-[1.9] prose-p:font-medium prose-p:text-base
                    prose-headings:font-black prose-headings:text-slate-900 prose-headings:tracking-tight
                    prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b-2 prose-h2:border-slate-100
                    prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                    prose-strong:text-slate-900 prose-strong:font-black
                    prose-blockquote:border-l-4 prose-blockquote:border-teal-400 prose-blockquote:bg-teal-50 prose-blockquote:py-2 prose-blockquote:px-5 prose-blockquote:rounded-r-2xl prose-blockquote:not-italic
                    prose-li:text-slate-700 prose-li:font-medium prose-li:leading-relaxed
                    prose-ul:space-y-1 prose-ol:space-y-1
                    [&_p]:mb-5
                  "
                  dangerouslySetInnerHTML={{ __html: rekapan.content || "" }}
                />
              ) : (
                <div className="text-center py-12 text-slate-400 font-bold">
                  Konten rekapan belum tersedia.
                </div>
              )}
            </article>
          </div>
        </div>
      </div>
      <ChatbotButton />
    </div>
  );
};

export default RekapanDetailPage;
