"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import ChatbotButton from "@/components/ui/Chatbot";
import CustomDropdown from "@/components/ui/CustomDropdown";
import DashedAddButton from "@/components/ui/DashedAddButton";
import { Input } from "@/components/ui/InputText";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MapPin, ArrowLeft, Upload, X, Save, Sparkles, Trophy, Tag, Users, Plus, ShieldCheck, ListChecks, Headset, Phone, Mail } from "lucide-react";
import Toast from "@/components/ui/Toast";
import Loading from "@/components/ui/Loading";

const CreateCompetition = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    prize: "", // Hadiah Utama (Opsional jika Juara 1 diisi)
    category: "Tahfidz" as "Tahfidz" | "Seni" | "Bahasa" | "Lainnya",
    thumbnailUrl: "",
    contactPerson: "",
    contactNumber: "",
    contactEmail: "",
    maxParticipants: "",
  });

  const [schedules, setSchedules] = useState([{ phase: "", date: "", description: "" }]);
  const [winners, setWinners] = useState([
    { rank: 1, prize: "", benefits: "" },
    { rank: 2, prize: "", benefits: "" },
    { rank: 3, prize: "", benefits: "" },
  ]);
  const [requirements, setRequirements] = useState<string[]>([""]);
  const [judgingCriteria, setJudgingCriteria] = useState<string[]>([""]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const role = session?.user?.role?.toLowerCase();
  const isPrivileged = role === "admin" || role === "instruktur" || role === "super_admin";

  useEffect(() => {
    if (status === "authenticated" && !isPrivileged) {
      router.push("/competitions");
    }
  }, [status, isPrivileged, router]);

  if (status === "authenticated" && !isPrivileged) {
    return null;
  }

  if (status === "loading") {
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

  const handleAddWinner = () => {
    const nextRank = winners.length + 1;
    setWinners([...winners, { rank: nextRank, prize: "", benefits: "" }]);
  };

  const handleDeleteWinner = (index: number) => {
    if (winners.length > 1) {
      setWinners(winners.filter((_, i) => i !== index));
    } else {
      showToast("Minimal harus ada 1 juara", "error");
    }
  };

  const handleAddSchedule = () => {
    setSchedules([...schedules, { phase: "", date: "", description: "" }]);
  };

  const handleDeleteSchedule = (index: number) => {
    if (schedules.length > 1) {
      setSchedules(schedules.filter((_, i) => i !== index));
    } else {
      showToast("Minimal harus ada 1 jadwal pelaksanaan", "error");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      setFormData((prev) => ({
        ...prev,
        thumbnailUrl: data.url,
      }));
      showToast("Tumbnail berhasil diunggah", "success");
    } catch (error: any) {
      showToast("Gagal mengunggah Tumbnail", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- LOGIKA PENENTUAN HADIAH UTAMA ---
    // Cek apakah hadiah diisi di "Informasi Dasar" ATAU di "Juara 1"
    const finalPrize = formData.prize.trim() || winners[0]?.prize?.trim() || "";

    // --- VALIDASI SPESIFIK ---
    if (!formData.title.trim()) {
      showToast("Judul kompetisi belum diisi!", "error");
      return;
    }
    if (!formData.category) {
      showToast("Kategori kompetisi belum dipilih!", "error");
      return;
    }
    if (!formData.description.trim()) {
      showToast("Deskripsi kompetisi belum diisi!", "error");
      return;
    }
    if (schedules.length === 0 || !schedules[0].date) {
      showToast("Jadwal pelaksanaan minimal 1 harus diisi!", "error");
      return;
    }
    if (!formData.location?.trim()) {
      showToast("Lokasi kompetisi belum diisi!", "error");
      return;
    }
    
    // Validasi Hadiah: Harus ada isinya di salah satu tempat
    if (!finalPrize) {
      showToast("Hadiah utama/Juara 1 belum diisi!", "error");
      return;
    }
    if (!formData.thumbnailUrl) {
      showToast("Tumbnail kompetisi wajib diunggah", "error");
      return;
    }
    // -------------------------

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        date: new Date().toISOString(), // dummy date to satisfy schema if needed
        location: formData.location,
        prize: finalPrize, // Gunakan hadiah yang sudah divalidasi
        category: formData.category,
        thumbnailUrl: formData.thumbnailUrl || null,
        contactPerson: formData.contactPerson,
        contactNumber: formData.contactNumber,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        requirements: requirements.filter((r) => r.trim() !== ""),
        judgingCriteria: judgingCriteria.filter((j) => j.trim() !== ""),
        prizes: winners
          .filter(w => w.prize || w.benefits)
          .map(w => ({
            rank: `Juara ${w.rank}`,
            amount: w.prize,
            benefits: w.benefits
          })),
        schedules: schedules
          .filter(s => s.phase && s.date)
          .map(s => ({
            phase: s.phase,
            date: s.date,
            description: s.description || undefined
          })),
      };

      const response = await fetch("/api/competitions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (e) {
          const text = await response.text();
          errorData = { error: text || `HTTP ${response.status}` };
        }
        throw new Error((errorData as any)?.details || (errorData as any)?.error || `HTTP ${response.status}: Failed to create competition`);
      }

      const data = await response.json();
      showToast("Perlombaan berhasil dibuat. Mengalihkan...", "success");
      setTimeout(() => router.push("/competitions"), 2000);
    } catch (error: any) {
      console.error("Error creating competition:", error);
      showToast(error.message || "Terjadi kesalahan saat membuat perlombaan", "error");
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
                onClick={() => router.back()}
                className="self-start inline-flex items-center gap-2 px-3 py-2 lg:px-4 lg:py-2 rounded-xl bg-white border-2 border-slate-200 text-slate-500 font-bold hover:border-teal-400 hover:text-teal-600 hover:shadow-[0_4px_0_0_#cbd5e1] active:translate-y-0.5 active:shadow-none transition-all text-sm lg:text-base"
              >
                <ArrowLeft className="h-4 w-4 lg:h-5 lg:w-5 text-emerald-500" strokeWidth={3} />
                Kembali
              </button>
              <div>
                <h1 className="text-2xl lg:text-4xl font-black text-slate-800 tracking-tight mb-2 flex items-center gap-2 lg:gap-3">
                  Buat Informasi Lomba
                </h1>
                <p className="text-slate-500 font-medium text-sm lg:text-lg">
                  Isi detail kompetisi dan upload gambar thumbnail.
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
                        Deskripsi Perlombaan <span className="text-red-500">*</span>
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
                          placeholder="Contoh: Aula Utama IRMA / Online"
                          className="pl-12 lg:pl-12 border-2 border-slate-200 focus:border-emerald-400 focus:ring-emerald-100"
                        />
                      </div>
                    </div>

                    {/* HAPUS INPUT HADIAH DISINI AGAR TIDAK BINGUNG */}
                    {/* <div className="space-y-2">
                         <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">Hadiah Utama</label>
                         <Input ... />
                        </div> 
                    */}
                  </div>
                </div>

                {/* Timeline / Jadwal Pelaksanaan */}
                <div className="bg-white p-5 lg:p-8 rounded-3xl lg:rounded-[2.5rem] border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1] lg:shadow-[0_8px_0_0_#cbd5e1]">
                  <h2 className="text-lg lg:text-xl font-black text-slate-700 mb-4 lg:mb-6 flex items-center gap-2">
                    <Calendar className="h-5 w-5 lg:h-6 lg:w-6 text-emerald-500" /> Jadwal Pelaksanaan
                  </h2>
                  <p className="text-xs lg:text-sm text-slate-500 mb-4 lg:mb-6">Tambahkan linimasa perlombaan seperti masa pendaftaran, penjurian, dll.</p>
                  
                  <div className="space-y-4">
                    {schedules.map((schedule, index) => (
                      <div key={index} className="bg-slate-50 p-4 lg:p-6 rounded-2xl border-2 border-slate-100 relative">
                        <div className="flex items-center justify-between mb-4">
                           <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                               <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs">{index + 1}</span>
                               Tahap {index + 1}
                           </h3>
                           <button
                             type="button"
                             onClick={() => handleDeleteSchedule(index)}
                             className="text-red-500 hover:text-red-700 font-bold text-xs flex items-center gap-1 transition-colors"
                           >
                             <X className="h-4 w-4" /> Hapus
                           </button>
                        </div>
                        
                        <div className="space-y-4 lg:space-y-6">
                           <div className="space-y-2">
                             <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">
                               Fase / Kegiatan <span className="text-red-500">*</span>
                             </label>
                             <Input
                               type="text"
                               value={schedule.phase}
                               onChange={(e) => {
                                 const newSchedules = [...schedules];
                                 newSchedules[index].phase = e.target.value;
                                 setSchedules(newSchedules);
                               }}
                               placeholder="Contoh: Pendaftaran / Babak Penyisihan"
                             />
                           </div>
                           
                           <div className="space-y-2">
                             <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">
                               Waktu Pelaksanaan <span className="text-red-500">*</span>
                             </label>
                             <Input
                               type="text"
                               value={schedule.date}
                               onChange={(e) => {
                                 const newSchedules = [...schedules];
                                 newSchedules[index].date = e.target.value;
                                 setSchedules(newSchedules);
                               }}
                               placeholder="Contoh: 10 - 20 Agustus 2024"
                             />
                           </div>
                           
                           <div className="space-y-2">
                             <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">Keterangan Tambahan (Opsional)</label>
                             <Textarea
                               value={schedule.description}
                               onChange={(e) => {
                                 const newSchedules = [...schedules];
                                 newSchedules[index].description = e.target.value;
                                 setSchedules(newSchedules);
                               }}
                               rows={2}
                               placeholder="Keterangan singkat..."
                             />
                           </div>
                        </div>
                      </div>
                    ))}
                    
                    <DashedAddButton
                      label="Tambah Jadwal"
                      onClick={handleAddSchedule}
                      count={schedules.length}
                      emptyLabel="Mulai Tambah Jadwal Pertama"
                    />
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
                  <p className="text-xs lg:text-sm text-slate-500 mb-4 lg:mb-6">Isi detail hadiah dan benefit untuk setiap juara.</p>

                  <div className="space-y-6">
                    {winners.map((winner, index) => (
                      <div key={index} className="bg-slate-50 p-4 lg:p-6 rounded-2xl border-2 border-slate-100 relative">
                        <div className="flex items-center gap-2 mb-4">
                          <Trophy className={`h-5 w-5 ${index === 0 ? "text-yellow-500" : index === 1 ? "text-slate-400" : "text-orange-400"}`} />
                          <h3 className="font-bold text-slate-700">
                            {index === 0 ? "🥇 Juara 1" : index === 1 ? "🥈 Juara 2" : index === 2 ? "🥉 Juara 3" : `Juara ${index + 1}`}
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleDeleteWinner(index)}
                            className="ml-auto px-3 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 font-bold text-xs flex items-center gap-1 transition-all"
                          >
                            <X className="h-3 w-3" /> Hapus
                          </button>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">
                              Hadiah {index === 0 && <span className="text-red-500">*</span>}
                            </label>
                            <Input
                              type="text"
                              value={winner.prize}
                              onChange={(e) => {
                                const newWinners = [...winners];
                                newWinners[index].prize = e.target.value;
                                setWinners(newWinners);
                              }}
                              placeholder="Contoh: Rp 5.000.000"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block text-xs lg:text-sm font-bold text-slate-600 ml-1">Benefit / Hadiah Tambahan</label>
                            <Textarea
                              value={winner.benefits}
                              onChange={(e) => {
                                const newWinners = [...winners];
                                newWinners[index].benefits = e.target.value;
                                setWinners(newWinners);
                              }}
                              rows={3}
                              placeholder={`Contoh untuk juara ${index + 1}: Uang tunai, piala, sertifikat, beasiswa, dll`}
                              maxLength={300}
                            />
                            <p className="text-xs text-slate-500 ml-1">{winner.benefits.length}/300 karakter</p>
                          </div>
                        </div>
                      </div>
                    ))}

                    <DashedAddButton
                      label="Tambah Juara"
                      onClick={handleAddWinner}
                      count={winners.length}
                      emptyLabel="Tambah Juara Pertama"
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
                <div className="bg-amber-500 p-6 rounded-[2.5rem] text-white border-2 border-amber-600 shadow-[0_6px_0_0_#d97706] mb-8">
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
                        Buat Kompetisi
                      </>
                    )}
                  </button>
                  <p className="text-xs text-amber-100 font-bold mt-4 text-center opacity-80">
                    Pastikan semua informasi lomba sudah benar sebelum diterbitkan.
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

export default CreateCompetition;