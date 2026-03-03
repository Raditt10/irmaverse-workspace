"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Award,
  TrendingUp,
  Users,
  BookOpen,
  Star,
  Target,
  Activity,
  Clock,
  Trophy,
  CheckCircle2,
  Crosshair,
} from "lucide-react";

interface MemberDetail {
  id: string;
  name: string;
  role: string;
  class: string;
  avatar: string;
  points: number;
  status: "Aktif" | "Tidak Aktif";
  email: string;
  phone: string;
  joinDate: string;
  totalEvents: number;
  totalKajian: number;
  achievements: {
    id: string;
    title: string;
    description: string;
    date: string;
  }[];
  recentActivities: {
    id: string;
    type: "event" | "kajian" | "task";
    title: string;
    date: string;
    points: number;
  }[];
  stats: {
    eventsAttended: number;
    kajianAttended: number;
    tasksCompleted: number;
    contributionRank: number;
  };
}

const MemberDetail = () => {
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (params?.id) {
      fetchMemberDetail(params.id as string);
    }
  }, [params?.id]);

  const fetchMemberDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/members/${id}`);
      if (!res.ok) throw new Error("Gagal mengambil detail anggota");
      const data = await res.json();
      // Mapping ke struktur MemberDetail (tambahkan mapping sesuai field yang tersedia di DB)
      const memberDetail: MemberDetail = {
        id: data.id,
        name: data.name || "-",
        role: data.role || "-",
        class: data.class || "-",
        avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.name || "user"}`,
        points: data.points || 0,
        status: data.status || "Aktif",
        email: data.email || "-",
        phone: data.notelp || "-",
        joinDate: data.createdAt ? data.createdAt.split("T")[0] : "-",
        totalEvents: data.totalEvents || 0,
        totalKajian: data.totalKajian || 0,
        stats: data.stats || { eventsAttended: 0, kajianAttended: 0, tasksCompleted: 0, contributionRank: 0 },
        achievements: data.achievements || [],
        recentActivities: data.recentActivities || [],
      };
      setMember(memberDetail);
    } catch (error: any) {
      console.error("Error fetching member:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "event":
        return <Users className="h-4 w-4" />;
      case "kajian":
        return <BookOpen className="h-4 w-4" />;
      case "task":
        return <Target className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "event":
        return "bg-blue-50 text-blue-600";
      case "kajian":
        return "bg-teal-50 text-teal-600";
      case "task":
        return "bg-purple-50 text-purple-600";
      default:
        return "bg-slate-50 text-slate-600";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <p className="text-slate-500">Memuat...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <p className="text-slate-500">Anggota tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100"
    >
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-600 hover:text-teal-600 mb-6 transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-semibold">Kembali</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Profile Card */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-3xl shadow-lg overflow-hidden sticky top-6">
                  {/* Header with gradient */}
                  <div className="h-32 bg-white"></div>

                  {/* Profile Info */}
                  <div className="px-6 pb-6 -mt-16">
                    {/* Avatar */}
                    <div className="flex justify-center mb-4">
                      <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white shadow-xl">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
             nhjiop[-]         </div>
                    </div>

                    {/* Name & Role */}
                    <div className="text-center mb-6">
                      <h1 className="text-2xl font-black text-slate-800 mb-2">
                        {member.name}
                      </h1>
                      <div className="inline-block px-4 py-2 rounded-full bg-linear-to-r from-green-400 to-teal-500 text-white text-sm font-semibold mb-1">
                        {member.role}
                      </div>
                      <p className="text-slate-600 text-sm font-medium">
                        {member.class}
                      </p>
                    </div>

                    {/* Points Display */}
                    <div className="bg-linear-to-br from-amber-50 to-orange-50 rounded-2xl p-6 mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600 font-medium">
                          Total Poin
                        </span>
                        <Star className="h-5 w-5 text-amber-500" />
                      </div>
                      <div className="text-4xl font-black text-amber-600">
                        {member.points}
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        Peringkat #{member.stats.contributionRank} di IRMA
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-teal-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-500">Email</p>
                          <p className="text-slate-700 font-medium truncate">
                            {member.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                          <Phone className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-500">Telepon</p>
                          <p className="text-slate-700 font-medium">
                            {member.phone}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-500">
                            Bergabung Sejak
                          </p>
                          <p className="text-slate-700 font-medium">
                            {new Date(member.joinDate).toLocaleDateString(
                              "id-ID",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Stats & Activities */}
              <div className="lg:col-span-2 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Event Diikuti */}
                  <div className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-[0_6px_24px_0_rgba(60,72,88,0.10)] flex items-center justify-center">
                        <Users className="h-7 w-7 text-[#23272f] stroke-[1.2]" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-slate-800 mb-1">
                      {member.stats.eventsAttended}
                    </div>
                    <div className="text-sm text-slate-600 font-medium">
                      Event Diikuti
                    </div>
                  </div>
                  {/* Kajian Diikuti */}
                  <div className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-[0_6px_24px_0_rgba(60,72,88,0.10)] flex items-center justify-center">
                        <BookOpen className="h-7 w-7 text-[#23272f] stroke-[1.2]" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-slate-800 mb-1">
                      {member.stats.kajianAttended}
                    </div>
                    <div className="text-sm text-slate-600 font-medium">
                      Kajian Diikuti
                    </div>
                  </div>
                  {/* Tugas Selesai */}
                  <div className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-[0_6px_24px_0_rgba(60,72,88,0.10)] flex items-center justify-center">
                        <Target className="h-7 w-7 text-[#23272f] stroke-[1.2]" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-slate-800 mb-1">
                      {member.stats.tasksCompleted}
                    </div>
                    <div className="text-sm text-slate-600 font-medium">
                      Tugas Selesai
                    </div>
                  </div>
                  {/* Peringkat */}
                  <div className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-[0_6px_24px_0_rgba(60,72,88,0.10)] flex items-center justify-center">
                        <TrendingUp className="h-7 w-7 text-[#23272f] stroke-[1.2]" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-slate-800 mb-1">
                      #{member.stats.contributionRank}
                    </div>
                    <div className="text-sm text-slate-600 font-medium">
                      Peringkat
                    </div>
                  </div>
                </div>

                {/* Achievements */}
                <div className="bg-white rounded-3xl shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-[0_6px_24px_0_rgba(60,72,88,0.10)] flex items-center justify-center">
                      <Award className="h-7 w-7 text-[#23272f] stroke-[1.2]" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-800">
                        Pencapaian
                      </h2>
                      <p className="text-sm text-slate-600">
                        Badge dan penghargaan
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {member.achievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className="bg-linear-to-br from-slate-50 to-slate-100 rounded-2xl p-5 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
                      > 
                        <div className="text-4xl mb-3">
                          {achievement.title === 'Top Contributor' && <Trophy className="h-8 w-8 text-amber-500" />}
                          {achievement.title === 'Perfect Attendance' && <CheckCircle2 className="h-8 w-8 text-yellow-500" />}
                          {achievement.title === 'Event Master' && <Crosshair className="h-8 w-8 text-pink-500" />}
                        </div>
                        <h3 className="font-bold text-slate-800 mb-2">
                          {achievement.title}
                        </h3>
                        <p className="text-sm text-slate-600 mb-3">
                          {achievement.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock className="h-3 w-3" />
                          {new Date(achievement.date).toLocaleDateString(
                            "id-ID",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-white rounded-3xl shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-white border border-slate-200 shadow-[0_6px_24px_0_rgba(60,72,88,0.10)] flex items-center justify-center">
                      <Activity className="h-7 w-7 text-[#23272f] stroke-[1.2]" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-800">
                        Aktivitas Terkini
                      </h2>
                      <p className="text-sm text-slate-600">
                        Riwayat kegiatan terbaru
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {member.recentActivities.map((activity, index) => (
                      <div
                        key={activity.id}
                        className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors duration-200"
                      >
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${getActivityColor(
                            activity.type
                          )}`}
                        >
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-800 mb-1">
                            {activity.title}
                          </h4>
                          <p className="text-sm text-slate-600">
                            {new Date(activity.date).toLocaleDateString(
                              "id-ID",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50">
                            <Star className="h-4 w-4 text-amber-600" />
                            <span className="text-sm font-bold text-amber-600">
                              +{activity.points}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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

export default MemberDetail;
