"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Star, 
  ThumbsUp, 
  User, 
  Camera, 
  UploadCloud, 
  X, 
  ImageIcon 
} from "lucide-react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";

import BackButton from "@/components/ui/BackButton";
import { Input } from "@/components/ui/InputText";
import { useSession } from "next-auth/react";
import Loading from "@/components/ui/Loading";
import Toast from "@/components/ui/Toast";

type AttendanceForm = {
    session: string;
    date: string;
    time: string;
    location: string;
    status: "hadir" | "tidak";
    notes: string;
    reason?: string;
    instructorArrival: string;
    startTime: string;
    endTime: string;
};

type SurveyForm = {
    rating: number;
    clarity: "yes" | "no";
    relevance: "yes" | "no";
    feedback: string;
};

const Absensi = () => {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true);
    const [isAttendanceOpen, setIsAttendanceOpen] = useState(true);

    // State untuk file upload
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [attendance, setAttendance] = useState<AttendanceForm>({
        session: "",
        date: "",
        time: "",
        location: "",
        status: "hadir",
        notes: "",
        reason: "",
        instructorArrival: "",
        startTime: "",
        endTime: "",
    });

    const [toast, setToast] = useState<{
        show: boolean;
        message: string;
        type: "success" | "error" | "warning" | "info";
    }>({ show: false, message: "", type: "success" });

    const [survey, setSurvey] = useState<SurveyForm>({
        rating: 4,
        clarity: "yes",
        relevance: "yes",
        feedback: "",
    });

    const { data: sessionInfo } = useSession();

    useEffect(() => {
        if (sessionInfo?.user) {
            setUser({
                id: sessionInfo.user.id,
                full_name: sessionInfo.user.name,
                email: sessionInfo.user.email,
                avatar: sessionInfo.user.avatar,
            });
        }

        // Fetch material data and check if attendance is open
        const fetchMaterialData = async () => {
            try {
                const materialId = window.location.pathname.split("/")[2];
                const res = await fetch(`/api/materials/${materialId}`);
                if (res.ok) {
                    const materialData = await res.json();
                    const isAttendanceOpen = materialData.isAttendanceOpen !== false;
                    setIsAttendanceOpen(isAttendanceOpen);
                    
                    if (!isAttendanceOpen) {
                        setToast({ show: true, message: "Maaf, Absensi pada kajian ini telah ditutup oleh instruktur", type: "error" });
                    }

                    // Populate form with real data
                    setAttendance(prev => ({
                        ...prev,
                          session: materialData.title || "",
                        date: materialData.date ? new Date(materialData.date).toISOString().split('T')[0] : "",
                        location: materialData.location || "Online/Onsite",
                        time: materialData.startedAt ? materialData.startedAt : "",
                        startTime: materialData.startedAt ? materialData.startedAt : "",
                    }));
                } else {
                     setToast({ show: true, message: "Gagal memuat data kajian", type: "error" });
                }
            } catch (error) {
                console.error("Error checking status/data:", error);
                setToast({ show: true, message: "Terjadi kesalahan saat memuat data", type: "error" });
            } finally {
                setIsCheckingStatus(false);
            }
        };

        if (sessionInfo) {
            fetchMaterialData();
        }
    }, [router, sessionInfo]);

    // Handler untuk upload file
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProofFile(file);
            // Buat URL preview
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    // Handler untuk hapus file
    const handleRemoveFile = () => {
        setProofFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!isAttendanceOpen) {
            setToast({ show: true, message: "Absensi untuk kajian ini sudah ditutup oleh instruktur.", type: "error" });
            return;
        }
        
        // Validasi sederhana jika status hadir tapi tidak ada bukti
        if (attendance.status === "hadir" && !proofFile) {
            setToast({ show: true, message: "Mohon sertakan foto bukti kehadiran.", type: "warning" });
            return;
        }

        setIsSubmitting(true);

                try {
                    // Get material ID from URL
                    const materialId = window.location.pathname.split("/")[2];
          
                    // Prepare attendance data
                    const attendanceData = {
                        session: attendance.session,
                        date: attendance.date,
                        time: attendance.time,
                        location: attendance.location,
                        status: attendance.status,
                        notes: attendance.notes,
                        reason: attendance.reason,
                        instructorArrival: attendance.instructorArrival,
                        startTime: attendance.startTime,
                        endTime: attendance.endTime,
                    };

                    // Prepare survey data
                    const surveyData = {
                        rating: survey.rating,
                        clarity: survey.clarity,
                        relevance: survey.relevance,
                        feedback: survey.feedback,
                    };

                    // Call attendance API with all form data
                    const response = await fetch("/api/materials/attendance", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ 
                            materialId,
                            attendanceData,
                            surveyData
                        }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.details || errorData.error || "Failed to record attendance");
                    }

                    // Trigger refresh jadwal kajian
                    if (typeof window !== "undefined") {
                        window.dispatchEvent(new Event("materialAction"));
                    }

                    console.log("Absensi terkirim:", { attendanceData, surveyData, proofFile });
                    setToast({ show: true, message: "Absensi terkirim! Terima kasih, absensi dan angket sudah dicatat.", type: "success" });
                    setTimeout(() => router.push("/materials"), 1500);
                } catch (error: any) {
                    console.error("Error submitting attendance:", error);
                    setToast({ show: true, message: `Gagal: ${error.message}`, type: "error" });
                } finally {
                    setIsSubmitting(false);
                }
    };

    if (!user || isCheckingStatus) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loading text="Memuat..." size="lg" />
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
                    <div className="max-w-6xl mx-auto space-y-8">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <h1 className="text-4xl font-black text-slate-800">Absensi Kajian</h1>
                                <p className="text-slate-600 text-lg">Isi kehadiran dan angket kajian minggu ini</p>
                            </div>
                            <BackButton
                                label="Kembali saja"
                                onClick={() => router.push("/materials")}
                            />
                        </div>

                        {!isAttendanceOpen && (
                            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                                Absensi untuk kajian ini sudah ditutup oleh instruktur. Form tidak dapat dikirim.
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Absensi */}
                            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-5">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-emerald-600" />
                                    <h2 className="text-xl font-bold text-slate-900">Form Absensi</h2>
                                </div>

                                <div className="space-y-4">
                                    {/* ... Input Field Lainnya Tetap Sama ... */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Kajian</label>
                                        <Input
                                            value={attendance.session}
                                            onChange={(e) => setAttendance({ ...attendance, session: e.target.value })}
                                            className="bg-slate-50"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-slate-600" /> Tanggal
                                            </label>
                                            <Input
                                                type="date"
                                                value={attendance.date}
                                                onChange={(e) => setAttendance({ ...attendance, date: e.target.value })}
                                                className="bg-slate-50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-slate-600" /> Waktu
                                            </label>
                                            <Input
                                                value={attendance.time}
                                                onChange={(e) => setAttendance({ ...attendance, time: e.target.value })}
                                                className="bg-slate-50"
                                            />
                                        </div>
                                    </div>

                                    {/* Data Waktu Detail */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <User className="h-4 w-4 text-slate-600" /> Instruktur datang
                                            </label>
                                            <Input
                                                type="time"
                                                value={attendance.instructorArrival}
                                                onChange={(e) => setAttendance({ ...attendance, instructorArrival: e.target.value })}
                                                className="bg-slate-50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-slate-600" /> Kajian dimulai
                                            </label>
                                            <Input
                                                type="time"
                                                value={attendance.startTime}
                                                onChange={(e) => setAttendance({ ...attendance, startTime: e.target.value })}
                                                className="bg-slate-50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-slate-600" /> Kajian selesai
                                            </label>
                                            <Input
                                                type="time"
                                                value={attendance.endTime}
                                                onChange={(e) => setAttendance({ ...attendance, endTime: e.target.value })}
                                                className="bg-slate-50"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-slate-600" /> Lokasi
                                        </label>
                                        <Input
                                            value={attendance.location}
                                            onChange={(e) => setAttendance({ ...attendance, location: e.target.value })}
                                            className="bg-slate-50"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Status Kehadiran</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { value: "hadir", label: "Hadir" },
                                                { value: "tidak", label: "Tidak hadir" },
                                            ].map((item) => (
                                                <button
                                                    key={item.value}
                                                    type="button"
                                                    onClick={() => setAttendance({ ...attendance, status: item.value as "hadir" | "tidak" })}
                                                    className={`rounded-xl border px-4 py-3 font-semibold transition-all ${
                                                        attendance.status === item.value
                                                            ? "border-emerald-400 bg-emerald-50 text-emerald-800 shadow-[0_8px_24px_-16px_rgba(16,185,129,0.6)]"
                                                            : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200"
                                                    }`}
                                                >
                                                    {item.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* SECTION BUKTI FOTO (BARU) */}
                                    {attendance.status === "hadir" && (
                                        <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-1">
                                                <Camera className="h-4 w-4 text-slate-600" /> Bukti Foto (Selfie di lokasi)
                                            </label>
                                            
                                            {!previewUrl ? (
                                                <div className="relative flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed border-slate-300 bg-white hover:bg-slate-50 hover:border-emerald-400 transition-all cursor-pointer group">
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                        <UploadCloud className="w-8 h-8 mb-2 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                                                        <p className="mb-1 text-sm text-slate-500 font-medium">Klik untuk upload foto</p>
                                                        <p className="text-xs text-slate-400">JPG, PNG (Max 5MB)</p>
                                                    </div>
                                                    <input 
                                                        type="file" 
                                                        accept="image/*"
                                                        onChange={handleFileChange}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                                    />
                                                </div>
                                            ) : (
                                                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-slate-200 group">
                                                    <img 
                                                        src={previewUrl} 
                                                        alt="Preview bukti" 
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <button
                                                            type="button"
                                                            onClick={handleRemoveFile}
                                                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                                            title="Hapus foto"
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                    <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                                        <ImageIcon className="w-3 h-3" />
                                                        {proofFile?.name.substring(0, 15)}...
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Catatan (opsional)</label>
                                        <textarea
                                            value={attendance.notes}
                                            onChange={(e) => setAttendance({ ...attendance, notes: e.target.value })}
                                            rows={2}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Tambahkan catatan singkat"
                                        />
                                    </div>

                                    {attendance.status === "tidak" && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Alasan tidak mengikuti kajian</label>
                                            <textarea
                                                value={attendance.reason ?? ""}
                                                onChange={(e) => setAttendance({ ...attendance, reason: e.target.value })}
                                                rows={3}
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                placeholder="Isi jika tidak bisa hadir"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Angket */}
                            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-5 h-fit">
                                <div className="flex items-center gap-3">
                                    <Star className="h-5 w-5 text-amber-500" />
                                    <h2 className="text-xl font-bold text-slate-900">Angket Kajian</h2>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Seberapa puas kamu?</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((score) => (
                                                <button
                                                    key={score}
                                                    type="button"
                                                    onClick={() => setSurvey({ ...survey, rating: score })}
                                                    className={`h-10 w-10 rounded-full border text-sm font-bold transition-all ${
                                                        survey.rating === score
                                                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-[0_8px_24px_-16px_rgba(16,185,129,0.6)]"
                                                            : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200"
                                                    }`}
                                                >
                                                    {score}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        {[
                                            { key: "clarity", label: "Materi mudah dipahami" },
                                            { key: "relevance", label: "Materi relevan dengan kebutuhan" },
                                        ].map((item) => (
                                            <div
                                                key={item.key}
                                                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                                            >
                                                <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                                    <ThumbsUp className="h-4 w-4 text-slate-600" /> {item.label}
                                                </span>
                                                <div className="flex gap-2">
                                                    {[{ value: "yes", label: "Ya" }, { value: "no", label: "Tidak" }].map((opt) => (
                                                        <button
                                                            key={opt.value}
                                                            type="button"
                                                            onClick={() => setSurvey({ ...survey, [item.key]: opt.value } as SurveyForm)}
                                                            className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
                                                                (survey as any)[item.key] === opt.value
                                                                    ? "bg-emerald-500 text-white shadow-[0_8px_24px_-16px_rgba(16,185,129,0.6)]"
                                                                    : "bg-white text-slate-700 border border-slate-200 hover:border-emerald-200"
                                                            }`}
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Saran atau kesan</label>
                                        <textarea
                                            value={survey.feedback}
                                            onChange={(e) => setSurvey({ ...survey, feedback: e.target.value })}
                                            rows={4}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            placeholder="Tulis masukan untuk panitia/pemateri"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Submit */}
                            <div className="lg:col-span-2">
                                <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div>
                                        <p className="text-base font-semibold text-slate-900">Kirim absensi dan angket</p>
                                        <p className="text-sm text-slate-600">Pastikan data dan bukti foto sudah benar.</p>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !isAttendanceOpen}
                                        className="px-5 py-3 rounded-xl bg-linear-to-r from-emerald-500 to-cyan-500 text-white font-semibold shadow-lg hover:from-emerald-600 hover:to-cyan-600 transition-all disabled:opacity-60"
                                    >
                                        {isSubmitting ? "Mengirim..." : !isAttendanceOpen ? "Absensi ditutup" : "Kirim sekarang"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast((prev) => ({ ...prev, show: false }))}
            />
        </div>
    );
};

export default Absensi;