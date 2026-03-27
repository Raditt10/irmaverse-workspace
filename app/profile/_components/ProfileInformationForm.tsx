"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Phone,
  Edit2,
  Save,
  X,
  Camera,
  Check,
  AlertCircle,
  Shield,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ImageCropDialog from "./ImageCropDialog";
import Toast from "@/components/ui/Toast";
import Loading from "@/components/ui/Loading";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  notelp: string;
  address: string;
  bio: string;
  createdAt: string;
  avatar?: string;
}

const ProfileInformationForm = ({ stats, level, rank, levelTitle }: any) => {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // State Data User
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editedUser, setEditedUser] = useState<UserProfile | null>(null);

  // State Image Crop
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State Notifikasi (Toast)
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  } | null>(null);

  const avatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=Fatimah";

  // Timer: Hilang otomatis dalam 3 detik
  useEffect(() => {
    if (toast?.show) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/users/profile");
        if (!response.ok) {
          throw new Error("Gagal memuat data pengguna");
        }
        const data = await response.json();
        setUser(data.user);
        setEditedUser(data.user);
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.email) {
      fetchUserData();
    }
  }, [session?.user?.email]);

  // --- HANDLE SAVE TEXT INFO ---
  const handleSave = async () => {
    if (!editedUser) return;

    try {
      setIsSaving(true);

      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editedUser.name || "",
          notelp: editedUser.notelp || "",
          address: editedUser.address || "",
          bio: editedUser.bio || "",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Gagal menyimpan data");
      }

      const data = await response.json();
      setUser(data.user);
      setEditedUser(data.user);
      setIsEditing(false);

      setToast({
        show: true,
        message: "Informasi profile berhasil diperbarui!",
        type: "success",
      });
    } catch (err) {
      console.error("Error saving user:", err);
      setToast({
        show: true,
        message:
          err instanceof Error ? err.message : "Gagal memperbarui informasi",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setEditedUser(user);
    }
    setIsEditing(false);
  };

  // --- HANDLE AVATAR UPLOAD ---
  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setToast({
        show: true,
        message: "Format harus JPG, PNG, atau WebP",
        type: "error",
      });
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setToast({
        show: true,
        message: "Ukuran file maksimal 5MB",
        type: "error",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedImage(result);
      setShowCropDialog(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    try {
      setIsUploadingAvatar(true);

      const formData = new FormData();
      formData.append("avatar", croppedImageBlob, "avatar.jpg");

      const response = await fetch("/api/users/avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Gagal mengupload avatar");
      }

      const data = await response.json();

      if (user) {
        const updatedUser = { ...user, avatar: data.avatarUrl };
        setUser(updatedUser);
        setEditedUser(updatedUser);
      }

      setShowCropDialog(false);
      setSelectedImage(null);

      setToast({
        show: true,
        message: "Foto profile berhasil diubah!",
        type: "success",
      });
    } catch (err) {
      console.error("Error uploading avatar:", err);
      setToast({
        show: true,
        message: "Gagal mengubah foto profile",
        type: "error",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCloseCropDialog = () => {
    setShowCropDialog(false);
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center justify-center h-64">
          <Loading text="Memuat data pengguna..." />
        </div>
      </div>
    );
  }

  if (!user || !editedUser) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500 font-bold">Gagal memuat data pengguna</p>
        </div>
      </div>
    );
  }

  const joinDate = new Date(user.createdAt).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="rounded-2xl bg-white p-0 relative">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Informasi Profile</h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all shadow-emerald-200 hover:shadow-emerald-300 shadow-lg active:translate-y-px"
            disabled={isLoading}
          >
            <Edit2 className="h-4 w-4" />
            Edit Profile
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSave}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all shadow-emerald-200 hover:shadow-emerald-300 shadow-lg active:translate-y-px"
              disabled={isSaving}
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              onClick={handleCancel}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-all active:translate-y-px"
              disabled={isSaving}
            >
              <X className="h-4 w-4" />
              Batal
            </button>
          </div>
        )}
      </div>

      {/* --- AVATAR SECTION (DIPERBAIKI UNTUK MOBILE) --- */}
      {/* Gunakan 'flex-col items-center' untuk mobile agar foto di tengah, dan 'sm:flex-row' untuk desktop */}
      <div className="flex flex-col items-center sm:flex-row sm:items-center gap-6 mb-8">
        {/* Wrapper Foto: Relative agar tombol kamera menempel pada wrapper ini */}
        <div className="relative shrink-0">
          <Avatar className="h-28 w-28 sm:h-32 sm:w-32 border-4 border-white shadow-xl ring-2 ring-slate-100">
            <AvatarImage
              src={user.avatar || avatarUrl}
              alt={user.name}
              className="object-cover"
            />
            <AvatarFallback className="bg-linear-to-br from-emerald-500 to-cyan-500 text-white text-3xl font-bold">
              {user.name?.substring(0, 2).toUpperCase() || "??"}
            </AvatarFallback>
          </Avatar>

          {/* Tombol Kamera: Posisi absolute relatif terhadap wrapper foto di atas */}
          {isEditing && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={handleAvatarClick}
                className="absolute -bottom-2 -right-2 p-2.5 rounded-full bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 transition-all hover:scale-110 active:scale-95 z-10 cursor-pointer border-4 border-white"
                disabled={isUploadingAvatar}
              >
                <Camera className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Text Info: Center di mobile, Left di desktop */}
        <div className="space-y-2 w-full text-center sm:text-left">
          <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
            {user.name}
          </h3>
          <p className="text-slate-500 font-medium text-sm md:text-base">
            {user.email}
          </p>

          {/* Badge Container: Center di mobile, Start di desktop */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            {session?.user?.role === "user" && (
              <>
                <span className="px-3 py-1 rounded-full bg-linear-to-r from-emerald-400 to-cyan-500 text-white text-xs font-bold shadow-sm">
                  Level {level}
                </span>
                <span className="px-3 py-1 rounded-full bg-linear-to-r from-amber-400 to-orange-500 text-white text-xs font-bold shadow-sm">
                  {levelTitle || "Pemula"}
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-xs font-bold">
                  Peringkat #{rank || "-"}
                </span>
              </>
            )}
            
            {session?.user?.role === "instruktur" && (
              <span className="px-3 py-1 rounded-full bg-linear-to-r from-emerald-400 to-teal-500 text-white text-xs font-bold shadow-sm">
                Instruktur
              </span>
            )}

            {session?.user?.role === "admin" && (
              <span className="px-3 py-1 rounded-full bg-linear-to-r from-emerald-400 to-teal-500 text-white text-xs font-bold shadow-sm">
                Admin
              </span>
            )}

            {session?.user?.role === "super_admin" && (
              <span className="px-3 py-1 rounded-full bg-linear-to-r from-emerald-400 to-teal-500 text-white text-xs font-bold shadow-sm flex items-center gap-1">
                <Shield className="h-3 w-3" /> Super Admin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <User className="h-4 w-4 text-emerald-500" />
              Nama Lengkap
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedUser.name ?? ""}
                onChange={(e) =>
                  setEditedUser({ ...editedUser, name: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-200 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all font-medium text-slate-700"
                disabled={isSaving}
              />
            ) : (
              <p className="px-4 py-3 rounded-xl bg-slate-50 text-slate-700 font-medium border-2 border-transparent">
                {user.name}
              </p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <Mail className="h-4 w-4 text-emerald-500" />
              Email
            </label>
            <p className="px-4 py-3 rounded-xl bg-slate-50 text-slate-500 font-medium border-2 border-transparent select-none cursor-not-allowed opacity-80">
              {user.email}
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <Phone className="h-4 w-4 text-emerald-500" />
              Nomor Telepon
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={editedUser.notelp ?? ""}
                onChange={(e) =>
                  setEditedUser({ ...editedUser, notelp: e.target.value || "" })
                }
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-200 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all font-medium text-slate-700"
                disabled={isSaving}
              />
            ) : (
              <p className="px-4 py-3 rounded-xl bg-slate-50 text-slate-700 font-medium border-2 border-transparent">
                {user.notelp || "-"}
              </p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
              <MapPin className="h-4 w-4 text-emerald-500" />
              Lokasi / Alamat
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedUser.address ?? ""}
                onChange={(e) =>
                  setEditedUser({
                    ...editedUser,
                    address: e.target.value || "",
                  })
                }
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-200 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all font-medium text-slate-700"
                disabled={isSaving}
              />
            ) : (
              <p className="px-4 py-3 rounded-xl bg-slate-50 text-slate-700 font-medium border-2 border-transparent">
                {user.address || "-"}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
            <User className="h-4 w-4 text-emerald-500" />
            Bio
          </label>
          {isEditing ? (
            <textarea
              value={editedUser.bio ?? ""}
              onChange={(e) =>
                setEditedUser({ ...editedUser, bio: e.target.value || "" })
              }
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border-2 border-slate-200 focus:outline-none focus:border-emerald-400 focus:bg-white transition-all font-medium text-slate-700 resize-none"
              disabled={isSaving}
            />
          ) : (
            <p className="px-4 py-3 rounded-xl bg-slate-50 text-slate-700 font-medium border-2 border-transparent min-h-[100px]">
              {user.bio || "-"}
            </p>
          )}
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
            <Calendar className="h-4 w-4 text-emerald-500" />
            Bergabung Sejak
          </label>
          <p className="px-4 py-3 rounded-xl bg-slate-50 text-slate-700 font-medium border-2 border-transparent">
            {joinDate}
          </p>
        </div>
      </div>

      {/* Crop Dialog */}
      {showCropDialog && selectedImage && (
        <ImageCropDialog
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
          onClose={handleCloseCropDialog}
        />
      )}

      {/* --- TOAST NOTIFICATION --- */}
      {toast && (
        <Toast
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ProfileInformationForm;
