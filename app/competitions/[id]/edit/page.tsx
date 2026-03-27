"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import { Input } from "@/components/ui/InputText";
import { Textarea } from "@/components/ui/textarea";
import CustomDropdown from "@/components/ui/CustomDropdown";
import DatePicker from "@/components/ui/DatePicker";
import TimePicker from "@/components/ui/TimePicker";
import DashedAddButton from "@/components/ui/DashedAddButton";
import { 
  ArrowLeft, Upload, X, Plus, Trophy, Sparkles, Save, 
  Calendar, CalendarClock, MapPin, Tag, Users, ShieldCheck, ListChecks, Headset, Phone, Mail
} from "lucide-react";
import Toast from "@/components/ui/Toast"; // Import Toast
import Loading from "@/components/ui/Loading";

const EditCompetition = () => {
  const router = useRouter();
  const params = useParams();
  const competitionId = params.id as string;
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Toast State
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    prize: "",
    category: "Tahfidz" as "Tahfidz" | "Seni" | "Bahasa" | "Lainnya",
    thumbnailUrl: "",
    contactPerson: "",
    contactNumber: "",
    contactEmail: "",
    maxParticipants: "",
  });

  const [requirements, setRequirements] = useState<string[]>([""]);
  const [judgingCriteria, setJudgingCriteria] = useState<string[]>([""]);
  const [prizes, setPrizes] = useState<{ rank: string; amount: string; benefits?: string }[]>([
    { rank: "", amount: "", benefits: "" },
  ]);
  const [schedules, setSchedules] = useState<{ phase: string; date: string; description: string }[]>([
    { phase: "", date: "", description: "" },
  ]);

  // Helper Toast
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    if (competitionId) {
      fetchCompetitionData();
    }
  }, [competitionId]);

  const fetchCompetitionData = async () => {
    try {
      setFetchingData(true);
      const response = await fetch(`/api/competitions/${competitionId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch competition");
      }

      const data = await response.json();


      const dateObj = new Date(data.date);
      const formattedDate = dateObj.toISOString().split('T')[0];
      const formattedTime = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');

      setFormData({
        title: data.title || "",
        description: data.description || "",
        date: formattedDate,
        time: formattedTime,
        location: data.location || "",
        prize: data.prize || "",
        category: data.category || "Tahfidz",
        thumbnailUrl: data.thumbnailUrl || "",
        contactPerson: data.contactPerson || "",
        contactNumber: data.contactNumber || "",
        contactEmail: data.contactEmail || "",
        maxParticipants: data.maxParticipants?.toString() || "",
      });

      setRequirements(data.requirements && data.requirements.length > 0 ? data.requirements : [""]);
      setJudgingCriteria(data.judgingCriteria && data.judgingCriteria.length > 0 ? data.judgingCriteria : [""]);
      setPrizes(data.prizes && data.prizes.length > 0 ? data.prizes.map((p: any) => ({
        rank: p.rank || "",
        amount: p.amount || "",
        benefits: p.benefits || ""
      })) : [{ rank: "", amount: "", benefits: "" }]);
      setSchedules(
        data.schedules && data.schedules.length > 0
          ? data.schedules.map((s: any) => ({
              phase: s.phase || "",
              date: s.date || "",
              description: s.description || "",
            }))
          : [{ phase: "", date: "", description: "" }]
      );
    } catch (error: any) {
      console.error("Error fetching competition:", error);
      showToast("Gagal memuat data perlombaan", "error");
      setTimeout(() => router.push("/competitions"), 2000);
    } finally {
      setFetchingData(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "instruktur" && session?.user?.role !== "admin" && session?.user?.role !== "super_admin") {
      router.push("/competitions");
    }
  }, [status, session, router]);

  if (status === "authenticated" && session?.user?.role !== "instruktur" && session?.user?.role !== "admin" && session?.user?.role !== "super_admin") {
    return null;
  }

  if (status === "loading" || fetchingData) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <Loading text="Memuat..." />
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      setFormData((prev) => ({
        ...prev,
        thumbnailUrl: data.url,
      }));
      showToast("Gambar berhasil diunggah", "success");
    } catch (error: any) {
      showToast("Gagal mengunggah gambar", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.date || !formData.location || !formData.prize || !formData.category) {
      showToast("Mohon lengkapi semua field yang wajib diisi", "error");
      return;
    }

    if (!formData.thumbnailUrl) {
      showToast("Tumbnail kompetisi wajib diunggah", "error");
      return;
    }

    setLoading(true);
    try {
      // Create a combined date object from date and time
      let finalDate = formData.date;
      if (formData.time) {
        finalDate = `${formData.date}T${formData.time}:00`;
      }

      const payload = {
        id: competitionId,
        ...formData,
        date: finalDate,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        requirements: requirements.filter((r) => r.trim() !== ""),
        judgingCriteria: judgingCriteria.filter((j) => j.trim() !== ""),
        prizes: prizes.filter((p) => p.rank || p.amount || p.benefits),
        schedules: schedules.filter((s) => s.phase && s.date),
      };

      const response = await fetch("/api/competitions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update competition");
      }

      const data = await response.json();
      showToast("Informasi Perlombaan berhasil diedit! Mengalihkan...", "success");
      setTimeout(() => router.push(`/competitions/${competitionId}`), 1500);

    } catch (error: any) {
      showToast(error.message || "Terjadi kesalahan saat memperbarui perlombaan", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="flex flex-col lg:flex-row">
        <Sidebar />
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-12 w-full max-w-[100vw] overflow-hidden">
          <div className="max-w-5xl mx-auto">
            {/* Header & Back Button */}
            <div className="flex flex-col gap-4 lg:gap-6 mb-6 lg:mb-8">
              <button
                onClick={() => router.push(`/competitions/`)}
                className="self-start inline-flex items-center gap-2 px-3 py-2 lg:px-4 lg:py-2 rounded-xl bg-white border-2 border-slate-200 text-slate-500 font-bold hover:border-teal-400 hover:text-teal-600 hover:shadow-[0_4px_0_0_#cbd5e1] active:translate-y-0.5 active:shadow-none transition-all text-sm lg:text-base"
              >
                <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5 text-emerald-500" strokeWidth={3} />
                Kembali
              </button>
              <div>
                <h1 className="text-2xl lg:text-4xl font-black text-slate-800 tracking-tight mb-2 flex items-center gap-2 lg:gap-3">                
                  Edit Informasi Lomba
                </h1>
                <p className="text-slate-500 font-medium text-sm lg:text-lg">
                  Sesuaikan detail kompetisi dan perbarui gambar thumbnail.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold bg-rose-50 text-rose-600 px-3 py-2 rounded-xl border-2 border-rose-100">
                  <span className="text-rose-500 font-black text-lg leading-none mt-1">*</span> Wajib diisi
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* --- KOLOM KIRI: FORM UTAMA --- */}
              <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                {/* Card Informasi Dasar */}
                <div className="bg-white p-5 lg:p-8 rounded-3xl lg:rounded-[2.5rem] border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] lg:shadow-[0_8px_0_0_#cbd5e1]">
                  <h2 className="text-lg lg:text-xl font-black text-slate-700 mb-4 lg:mb-6 flex items-center gap-2">
                    <Tag className="h-5 w-5 lg:h-6 lg:w-6 text-emerald-500" /> Informasi Dasar
                  </h2>

                  <div className="space-y-4 lg:space-y-6">
                    <div className="space-y-2">
                      <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">
                        Judul Kompetisi <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Contoh: Lomba Tahfidz Tingkat Nasional"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">
                        Kategori <span className="text-red-500">*</span>
                      </label>
                      <CustomDropdown
                        options={[
                          { value: "Tahfidz", label: "Tahfidz" },
                          { value: "Seni", label: "Seni" },
                          { value: "Bahasa", label: "Bahasa" },
                          { value: "Lainnya", label: "Lainnya" },
                        ]}
                        value={formData.category}
                        onChange={(value) => setFormData({ ...formData, category: value as any })}
                        placeholder="Pilih Kategori"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">
                        Deskripsi Singkat <span className="text-red-500">*</span>
                      </label>
                      <Textarea
                        name="description"
                        rows={4}
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Jelaskan tentang kompetisi ini..."
                        maxLength={200}
                      />
                      <p className="text-xs text-slate-500 ml-1">{formData.description.length}/200 karakter</p>
                    </div>
                  </div>
                </div>

                {/* Card Waktu & Tempat */}
                <div className="bg-white p-5 lg:p-8 rounded-3xl lg:rounded-[2.5rem] border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] lg:shadow-[0_8px_0_0_#cbd5e1]">
                  <h2 className="text-lg lg:text-xl font-black text-slate-700 mb-4 lg:mb-6 flex items-center gap-2">
                    <Calendar className="h-5 w-5 lg:h-6 lg:w-6 text-emerald-500" /> Waktu & Lokasi
                  </h2>
                  <div className="space-y-4 lg:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                      <div className="space-y-2">
                        <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">
                          Tanggal Kompetisi <span className="text-red-500">*</span>
                        </label>
                        <DatePicker
                          value={formData.date}
                          onChange={(date) => setFormData({ ...formData, date })}
                          label=""
                          placeholder="Pilih tanggal"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">Jam Mulai</label>
                        <TimePicker
                          value={formData.time}
                          onChange={(time) => setFormData({ ...formData, time })}
                          label=""
                          placeholder="HH:MM"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">
                        Lokasi <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <MapPin className="h-5 w-5 text-emerald-500 group-hover:text-emerald-600 transition-colors" />
                        </div>
                        <Input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          placeholder="Contoh: Aula Utama IRMA"
                          className="pl-12 lg:pl-12 border-2 border-slate-200 focus:border-emerald-400 focus:ring-emerald-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Persyaratan & Kriteria */}
                <div className="bg-white p-5 lg:p-8 rounded-3xl lg:rounded-[2.5rem] border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] lg:shadow-[0_8px_0_0_#cbd5e1]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    {/* Requirements Column */}
                    <div className="space-y-4 lg:space-y-6">
                      <h2 className="text-lg lg:text-xl font-black text-slate-700 mb-6 lg:mb-8 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                          <ShieldCheck className="h-5 w-5 lg:h-6 lg:w-6" />
                        </div>
                        Persyaratan
                      </h2>
                      <div className="space-y-4">
                        {requirements.map((req, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={req}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const newReqs = [...requirements];
                                newReqs[index] = e.target.value;
                                setRequirements(newReqs);
                              }}
                              placeholder={`Persyaratan ${index + 1}`}
                            />
                            {requirements.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setRequirements(requirements.filter((_, i) => i !== index))}
                                className="px-3 py-2 bg-red-100 text-red-600 rounded-xl border-2 border-red-200 hover:bg-red-200 transition-all active:translate-y-0.5"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <DashedAddButton
                          label="Tambah Persyaratan"
                          onClick={() => setRequirements([...requirements, ""])}
                          count={requirements.length}
                        />
                      </div>
                    </div>

                    {/* Criteria Column */}
                    <div className="space-y-4 lg:space-y-6">
                      <h2 className="text-lg lg:text-xl font-black text-slate-700 mb-6 lg:mb-8 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600">
                          <ListChecks className="h-5 w-5 lg:h-6 lg:w-6" />
                        </div>
                        Kriteria Penilaian
                      </h2>
                      <div className="space-y-4">
                        {judgingCriteria.map((criteria, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={criteria}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const newCriteria = [...judgingCriteria];
                                newCriteria[index] = e.target.value;
                                setJudgingCriteria(newCriteria);
                              }}
                              placeholder={`Kriteria ${index + 1}`}
                            />
                            {judgingCriteria.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setJudgingCriteria(judgingCriteria.filter((_, i) => i !== index))}
                                className="px-3 py-2 bg-red-100 text-red-600 rounded-xl border-2 border-red-200 hover:bg-red-200 transition-all active:translate-y-0.5"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <DashedAddButton
                          label="Tambah Kriteria"
                          onClick={() => setJudgingCriteria([...judgingCriteria, ""])}
                          count={judgingCriteria.length}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Info Juara */}
                <div className="bg-white p-5 lg:p-8 rounded-3xl lg:rounded-[2.5rem] border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] lg:shadow-[0_8px_0_0_#cbd5e1]">
                  <h2 className="text-lg lg:text-xl font-black text-slate-700 mb-4 lg:mb-6 flex items-center gap-2">
                    <Trophy className="h-5 w-5 lg:h-6 lg:w-6 text-emerald-500" /> Info Juara
                  </h2>
                  <div className="space-y-6">
                    {prizes.map((prize, index) => (
                      <div key={index} className="bg-slate-50 p-4 lg:p-6 rounded-2xl border-2 border-slate-100 relative">
                        <div className="flex items-center gap-2 mb-4">
                          <Trophy className={`h-5 w-5 ${index === 0 ? "text-yellow-500" : index === 1 ? "text-slate-400" : "text-orange-400"}`} />
                          <h3 className="font-bold text-slate-700">
                            {prize.rank || `Juara ${index + 1}`}
                          </h3>
                          <button
                            type="button"
                            onClick={() => setPrizes(prizes.filter((_, i) => i !== index))}
                            className="ml-auto px-3 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 font-bold text-xs flex items-center gap-1 transition-all"
                          >
                            <X className="h-3 w-3" /> Hapus
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">Nama Ranking (Misal: Juara 1)</label>
                            <Input
                              type="text"
                              value={prize.rank}
                              onChange={(e) => {
                                const newPrizes = [...prizes];
                                newPrizes[index].rank = e.target.value;
                                setPrizes(newPrizes);
                              }}
                              placeholder="Ranking"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">
                              Hadiah {index === 0 && <span className="text-red-500">*</span>}
                            </label>
                            <Input
                              type="text"
                              value={prize.amount}
                              onChange={(e) => {
                                const newPrizes = [...prizes];
                                newPrizes[index].amount = e.target.value;
                                setPrizes(newPrizes);
                              }}
                              placeholder="Contoh: Rp 5.000.000"
                            />
                          </div>
                        </div>
                        <div className="space-y-2 mt-4">
                          <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">Benefit Tambahan</label>
                          <Textarea
                            value={prize.benefits || ""}
                            onChange={(e) => {
                              const newPrizes = [...prizes];
                              newPrizes[index].benefits = e.target.value;
                              setPrizes(newPrizes);
                            }}
                            rows={2}
                            placeholder="Benefit tambahan..."
                            maxLength={200}
                          />
                        </div>
                      </div>
                    ))}
                    <DashedAddButton
                      label="Tambah Ranking"
                      onClick={() => setPrizes([...prizes, { rank: "", amount: "", benefits: "" }])}
                      count={prizes.length}
                    />
                  </div>
                </div>

                {/* Card Jadwal Kompetisi */}
                <div className="bg-white p-5 lg:p-8 rounded-3xl lg:rounded-[2.5rem] border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] lg:shadow-[0_8px_0_0_#cbd5e1]">
                  <h2 className="text-lg lg:text-xl font-black text-slate-700 mb-4 lg:mb-6 flex items-center gap-2">
                    <CalendarClock className="h-5 w-5 lg:h-6 lg:w-6 text-emerald-500" /> Jadwal Kompetisi
                  </h2>
                  <div className="space-y-6">
                    {schedules.map((schedule, index) => (
                      <div key={index} className="bg-slate-50 p-4 lg:p-6 rounded-2xl border-2 border-slate-100 relative space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xs">
                            {index + 1}
                          </div>
                          <button
                            type="button"
                            onClick={() => setSchedules(schedules.filter((_, i) => i !== index))}
                            className="ml-auto px-3 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 font-bold text-xs flex items-center gap-1 transition-all"
                          >
                            <X className="h-3 w-3" /> Hapus
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">
                              Fase / Tahapan <span className="text-red-500">*</span>
                            </label>
                            <Input
                              value={schedule.phase}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const newSchedules = [...schedules];
                                newSchedules[index].phase = e.target.value;
                                setSchedules(newSchedules);
                              }}
                              placeholder="Misal: Pendaftaran"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">
                              Waktu <span className="text-red-500">*</span>
                            </label>
                            <Input
                              value={schedule.date}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const newSchedules = [...schedules];
                                newSchedules[index].date = e.target.value;
                                setSchedules(newSchedules);
                              }}
                              placeholder="Misal: 1 - 10 Nov 2024"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">Keterangan</label>
                          <Textarea
                            value={schedule.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                              const newSchedules = [...schedules];
                              newSchedules[index].description = e.target.value;
                              setSchedules(newSchedules);
                            }}
                            placeholder="Keterangan opsional..."
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                    <DashedAddButton
                      label="Tambah Jadwal"
                      onClick={() => setSchedules([...schedules, { phase: "", date: "", description: "" }])}
                      count={schedules.length}
                    />
                  </div>
                </div>

                {/* Card Kontak */}
                <div className="bg-white p-5 lg:p-8 rounded-3xl lg:rounded-[2.5rem] border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] lg:shadow-[0_8px_0_0_#cbd5e1]">
                  <h2 className="text-lg lg:text-xl font-black text-slate-700 mb-4 lg:mb-6 flex items-center gap-2">
                    <Users className="h-5 w-5 lg:h-6 lg:w-6 text-emerald-500" /> Kontak Person
                  </h2>
                  <div className="space-y-4 lg:space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs lg:text-sm font-bold text-slate-600 ml-1">
                        Narahubung
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Headset className="h-5 w-5 text-emerald-500 group-hover:text-emerald-600 transition-colors" />
                        </div>
                        <Input
                          type="text"
                          name="contactPerson"
                          value={formData.contactPerson}
                          onChange={handleChange}
                          placeholder="Contoh: Ahmad Fauzi"
                          className="pl-12 lg:pl-12 border-2 border-slate-200 focus:border-emerald-400 focus:ring-emerald-100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                      <div className="space-y-2">
                        <label className="text-xs lg:text-sm font-bold text-slate-600 ml-1">
                          Nomor Telepon
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Phone className="h-5 w-5 text-emerald-500 group-hover:text-emerald-600 transition-colors" />
                          </div>
                          <Input
                            type="tel"
                            name="contactNumber"
                            value={formData.contactNumber}
                            onChange={handleChange}
                            placeholder="Contoh: 08123456789"
                            className="pl-12 lg:pl-12 border-2 border-slate-200 focus:border-emerald-400 focus:ring-emerald-100"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs lg:text-sm font-bold text-slate-600 ml-1">
                          Email
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-emerald-500 group-hover:text-emerald-600 transition-colors" />
                          </div>
                          <Input
                            type="email"
                            name="contactEmail"
                            value={formData.contactEmail}
                            onChange={handleChange}
                            placeholder="email@example.com"
                            className="pl-12 lg:pl-12 border-2 border-slate-200 focus:border-emerald-400 focus:ring-emerald-100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- KOLOM KANAN: UPLOAD GAMBAR --- */}
              <div className="space-y-6 lg:space-y-8">
                {/* Upload Thumbnail */}
                <div className="bg-white p-5 lg:p-6 rounded-3xl lg:rounded-[2.5rem] border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] lg:shadow-[0_8px_0_0_#cbd5e1] text-center">
                  <label className="block text-xs lg:text-sm font-bold text-slate-600 mb-3 lg:mb-4">Thumbnail Kompetisi</label>
                  <div className="relative group cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="upload-comp"
                    />
                    {formData.thumbnailUrl ? (
                      <div className="relative w-full h-40 lg:h-48 rounded-2xl lg:rounded-3xl overflow-hidden border-2 border-slate-200 group-hover:border-teal-400 transition-all">
                        <img src={formData.thumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setFormData((prev) => ({ ...prev, thumbnailUrl: "" }));
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform"
                        >
                          <X className="w-3 h-3 lg:w-4 lg:h-4" />
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="upload-comp"
                        className="flex flex-col items-center justify-center w-full h-40 lg:h-48 rounded-2xl lg:rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-teal-50 hover:border-teal-400 transition-all cursor-pointer"
                      >
                        {uploadingImage ? (
                          <Sparkles className="w-6 h-6 lg:w-8 lg:h-8 text-teal-400 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-6 h-6 lg:w-8 lg:h-8 text-emerald-500 mb-2 group-hover:text-emerald-600" />
                            <span className="text-xs lg:text-sm font-bold text-slate-400">Klik untuk Upload</span>
                          </>
                        )}
                      </label>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">Max Peserta</label>
                  <Input
                    type="number"
                    name="maxParticipants"
                    value={formData.maxParticipants}
                    onChange={handleChange}
                    placeholder="Misal: 100"
                  />
                </div>

                {/* Submit Card */}
                <div className="bg-amber-500 p-6 rounded-[2.5rem] text-white border-2 border-amber-600 shadow-[0_6px_0_0_#d97706] mt-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Trophy className="h-8 w-8 text-amber-100" strokeWidth={2.5} />
                    <h3 className="text-xl font-black">Siap Terbit?</h3>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-white text-amber-600 font-black text-lg rounded-2xl shadow-[0_4px_0_0_#fef3c7] border-2 border-amber-100 hover:bg-amber-50 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Sparkles className="h-6 w-6 animate-spin" />{" "}
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="h-6 w-6" />
                        Simpan Perubahan
                      </>
                    )}
                  </button>
                  <p className="text-xs text-amber-100 font-bold mt-4 text-center opacity-80">
                    Pastikan semua informasi lomba sudah benar sebelum disimpan.
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      <ChatbotButton />

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </div>
  );
};

export default EditCompetition;