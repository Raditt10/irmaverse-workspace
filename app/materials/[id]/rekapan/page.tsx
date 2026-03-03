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
} from "lucide-react";

interface RekapanData {
  id: string;
  materialId: string;
  content: string;
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
  NextLevel: "Program Next Level",
  Susulan: "Program Susulan",
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
    role === "instruktur" || role === "admin" || role === "instructor";

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
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center border-4 border-dashed border-slate-300 mb-6">
              <FileText className="h-10 w-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-black text-slate-700 mb-2">
              Rekapan Belum Tersedia
            </h2>
            <p className="text-slate-500 mb-6 text-center max-w-md">
              Instruktur belum membuat ringkasan materi untuk kajian ini.
            </p>
            <button
              onClick={() => router.push(`/materials/${materialId}`)}
              className="px-6 py-3 rounded-xl bg-teal-400 text-white font-black border-2 border-teal-600 border-b-4 hover:bg-teal-500 active:border-b-2 active:translate-y-0.5 transition-all"
            >
              Kembali ke Materi
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!rekapan) return null;

  const categoryLabel =
    CATEGORY_LABEL[rekapan.material.category] || rekapan.material.category;
  const gradeLabel =
    GRADE_LABEL[rekapan.material.grade] || rekapan.material.grade;

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 w-full max-w-[100vw] overflow-x-hidden px-4 sm:px-6 lg:px-8 py-6 lg:py-12">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => router.push("/materials/rekapan")}
              className="inline-flex items-center gap-2 text-slate-500 hover:text-teal-600 font-bold transition-all group px-4 py-2 rounded-xl border-2 border-transparent hover:border-slate-200 hover:bg-white hover:shadow-sm mb-6"
            >
              <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform stroke-3" />
              Kembali ke Daftar Rekapan
            </button>

            {/* Header Card */}
            <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-[0_6px_0_0_#cbd5e1] overflow-hidden mb-8">
              <div className="bg-gradient-to-br from-teal-400 to-emerald-500 p-6 lg:p-10 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                <div className="relative z-10">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-3 py-1 rounded-lg text-xs font-black uppercase bg-white/20 backdrop-blur-sm border border-white/30">
                      {categoryLabel}
                    </span>
                    <span className="px-3 py-1 rounded-lg text-xs font-black uppercase bg-white/20 backdrop-blur-sm border border-white/30">
                      {gradeLabel}
                    </span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-black mb-3">
                    {rekapan.material.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-teal-50">
                    <div className="flex items-center gap-1.5">
                      <User className="h-4 w-4" />
                      {rekapan.material.instructor}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {new Date(rekapan.material.date).toLocaleDateString(
                        "id-ID",
                        { day: "numeric", month: "long", year: "numeric" },
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rekapan Content */}
              <div className="p-6 lg:p-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-teal-50 rounded-xl border-2 border-teal-100">
                      <BookOpen className="h-5 w-5 text-teal-600" />
                    </div>
                    <h2 className="text-xl font-black text-slate-800">
                      Ringkasan Materi
                    </h2>
                  </div>

                  {isPrivileged && (
                    <button
                      onClick={() =>
                        router.push(`/materials/${materialId}/rekapan/edit`)
                      }
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-600 font-bold border-2 border-amber-200 hover:bg-amber-100 transition-all text-sm"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                  )}
                </div>

                <div
                  className="prose prose-slate max-w-none prose-headings:font-black prose-p:font-medium prose-p:leading-relaxed prose-li:font-medium"
                  dangerouslySetInnerHTML={{ __html: rekapan.content }}
                />

                <div className="mt-8 pt-6 border-t-2 border-slate-100 text-xs text-slate-400 font-bold">
                  Terakhir diperbarui:{" "}
                  {new Date(rekapan.updatedAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ChatbotButton />
    </div>
  );
};

export default RekapanDetailPage;
