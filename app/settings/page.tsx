"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import Loading from "@/components/ui/Loading";
import {
  Settings,
  Shield,
  Sliders,
  Eye,
  EyeOff,
  Link2,
  Unlink,
  KeyRound,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  Info,
} from "lucide-react";

/* ─── Types ─── */
interface SecurityInfo {
  email: string;
  hasPassword: boolean;
  hasGoogle: boolean;
  googleEmail: string | null;
}

/* ─── Password Input ─── */
const PasswordField = ({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="text-sm font-bold text-slate-600 block ml-1"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full py-3 px-4 pr-12 rounded-2xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none focus:shadow-[0_4px_0_0_#10b981] transition-all font-bold text-slate-700 placeholder:font-medium placeholder:text-slate-400 text-sm"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 p-1.5 rounded-xl hover:bg-emerald-50 transition-colors"
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};

/* ─── Toast ─── */
const Toast = ({
  msg,
  type,
  onClose,
}: {
  msg: string;
  type: "success" | "error";
  onClose: () => void;
}) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border-2 shadow-lg text-sm font-bold animate-in slide-in-from-right-5 fade-in-0 duration-300 ${
        type === "success"
          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
          : "bg-red-50 border-red-200 text-red-700"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 className="h-5 w-5 shrink-0" />
      ) : (
        <XCircle className="h-5 w-5 shrink-0" />
      )}
      <span>{msg}</span>
    </div>
  );
};

/* ═══════════════════════════════════════════ */
/*             SETTINGS PAGE                  */
/* ═══════════════════════════════════════════ */
export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"general" | "security">(
    "security",
  );
  const [secInfo, setSecInfo] = useState<SecurityInfo | null>(null);
  const [loadingSec, setLoadingSec] = useState(true);

  // Toast
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  // Password states
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // Set password (Google users)
  const [firstPwValue, setFirstPwValue] = useState("");
  const [firstPwConfirm, setFirstPwConfirm] = useState("");
  const [firstPwLoading, setFirstPwLoading] = useState(false);

  // Delete account
  const [delPw, setDelPw] = useState("");
  const [delConfirm, setDelConfirm] = useState("");
  const [delLoading, setDelLoading] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // Unlink Google
  const [unlinkLoading, setUnlinkLoading] = useState(false);

  const fetchSecurity = useCallback(async () => {
    setLoadingSec(true);
    try {
      const res = await fetch("/api/settings/security");
      if (res.ok) {
        setSecInfo(await res.json());
      }
    } catch {
      // ignore
    }
    setLoadingSec(false);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
      return;
    }
    if (status === "authenticated") {
      fetchSecurity();
    }
  }, [status, router, fetchSecurity]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Loading text="Memuat pengaturan..." size="lg" />
      </div>
    );
  }

  /* ─── Handlers ─── */

  // Change password
  const handleChangePassword = async () => {
    if (!newPw || !confirmPw || !currentPw) {
      setToast({ msg: "Semua kolom wajib diisi", type: "error" });
      return;
    }
    if (newPw !== confirmPw) {
      setToast({ msg: "Password baru tidak cocok", type: "error" });
      return;
    }
    if (newPw.length < 6) {
      setToast({ msg: "Password baru minimal 6 karakter", type: "error" });
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch("/api/settings/security/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPw,
          newPassword: newPw,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ msg: data.error, type: "error" });
      } else {
        setToast({ msg: "Password berhasil diubah!", type: "success" });
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
      }
    } catch {
      setToast({ msg: "Terjadi kesalahan", type: "error" });
    }
    setPwLoading(false);
  };

  // Set first password (Google users)
  const handleSetPassword = async () => {
    if (!firstPwValue || !firstPwConfirm) {
      setToast({ msg: "Semua kolom wajib diisi", type: "error" });
      return;
    }
    if (firstPwValue !== firstPwConfirm) {
      setToast({ msg: "Password tidak cocok", type: "error" });
      return;
    }
    if (firstPwValue.length < 6) {
      setToast({ msg: "Password minimal 6 karakter", type: "error" });
      return;
    }
    setFirstPwLoading(true);
    try {
      const res = await fetch("/api/settings/security/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: firstPwValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ msg: data.error, type: "error" });
      } else {
        setToast({
          msg: "Password berhasil dibuat! Kamu sekarang bisa login dengan email & password.",
          type: "success",
        });
        setFirstPwValue("");
        setFirstPwConfirm("");
        fetchSecurity();
      }
    } catch {
      setToast({ msg: "Terjadi kesalahan", type: "error" });
    }
    setFirstPwLoading(false);
  };

  // Link Google
  const handleLinkGoogle = () => {
    signIn("google", { callbackUrl: "/settings" });
  };

  // Unlink Google
  const handleUnlinkGoogle = async () => {
    setUnlinkLoading(true);
    try {
      const res = await fetch("/api/settings/security/google", {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ msg: data.error, type: "error" });
      } else {
        setToast({ msg: "Akun Google berhasil dilepas", type: "success" });
        fetchSecurity();
      }
    } catch {
      setToast({ msg: "Terjadi kesalahan", type: "error" });
    }
    setUnlinkLoading(false);
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (delConfirm !== "HAPUS AKUN SAYA") {
      setToast({
        msg: 'Ketik "HAPUS AKUN SAYA" untuk konfirmasi',
        type: "error",
      });
      return;
    }
    if (secInfo?.hasPassword && !delPw) {
      setToast({ msg: "Masukkan password untuk konfirmasi", type: "error" });
      return;
    }
    setDelLoading(true);
    try {
      const res = await fetch("/api/settings/security/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: delPw, confirmation: delConfirm }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ msg: data.error, type: "error" });
      } else {
        setToast({
          msg: "Akun berhasil dihapus. Kamu akan dialihkan...",
          type: "success",
        });
        setTimeout(() => signOut({ callbackUrl: "/auth" }), 1500);
      }
    } catch {
      setToast({ msg: "Terjadi kesalahan", type: "error" });
    }
    setDelLoading(false);
  };

  /* ─── Tab definitions ─── */
  const tabs = [
    { id: "general" as const, label: "Umum", icon: Sliders },
    { id: "security" as const, label: "Keamanan Akun", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans">
      <DashboardHeader />
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="flex flex-1">
        <div className="hidden lg:block h-[calc(100vh-80px)] sticky top-20">
          <Sidebar />
        </div>
        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-8 max-w-5xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center border-2 border-slate-200 shadow-[0_4px_0_0_#cbd5e1]">
              <Settings className="h-7 w-7 text-slate-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                Pengaturan
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Kelola preferensi dan keamanan akunmu
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 p-1.5 bg-white border-2 border-slate-200 rounded-2xl shadow-[0_4px_0_0_#cbd5e1] w-fit">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeTab === t.id
                    ? "bg-emerald-500 text-white shadow-md"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>

          {/* ═══ GENERAL TAB ═══ */}
          {activeTab === "general" && (
            <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-8 shadow-[0_6px_0_0_#cbd5e1]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                  <Sliders className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800">
                    Pengaturan Umum
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Preferensi dan tampilan
                  </p>
                </div>
              </div>
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-slate-200">
                  <Sliders className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-black text-slate-400 mb-2">
                  Segera Hadir
                </h3>
                <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto">
                  Fitur pengaturan umum seperti tema, notifikasi, dan bahasa
                  akan tersedia di pembaruan mendatang.
                </p>
              </div>
            </div>
          )}

          {/* ═══ SECURITY TAB ═══ */}
          {activeTab === "security" && (
            <div className="space-y-6">
              {loadingSec ? (
                <div className="flex justify-center py-16">
                  <Loading text="Memuat keamanan akun..." />
                </div>
              ) : secInfo ? (
                <>
                  {/* ── Info Card ── */}
                  <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 shadow-[0_6px_0_0_#cbd5e1]">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                        <Shield className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-800">
                          Keamanan Akun
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                          Metode login & keamanan
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Email */}
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Email
                        </p>
                        <p className="font-black text-slate-700 text-sm truncate">
                          {secInfo.email}
                        </p>
                      </div>
                      {/* Auth methods */}
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Metode Login
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {secInfo.hasPassword && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold">
                              <KeyRound className="h-3 w-3" /> Email & Password
                            </span>
                          )}
                          {secInfo.hasGoogle && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold">
                              <svg className="h-3 w-3" viewBox="0 0 24 24">
                                <path
                                  fill="currentColor"
                                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                />
                                <path
                                  fill="currentColor"
                                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                  fill="currentColor"
                                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                  fill="currentColor"
                                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                              </svg>
                              Google
                            </span>
                          )}
                          {!secInfo.hasPassword && !secInfo.hasGoogle && (
                            <span className="text-xs text-slate-400 font-medium">
                              Tidak ada
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Google Account Section ── */}
                  <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 shadow-[0_6px_0_0_#cbd5e1]">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center border border-red-100">
                        <svg
                          className="h-6 w-6 text-red-500"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-slate-800">
                          Akun Google
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                          Hubungkan atau lepas akun Google
                        </p>
                      </div>
                    </div>

                    {secInfo.hasGoogle ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                          <div>
                            <p className="font-bold text-emerald-700 text-sm">
                              Google Terhubung
                            </p>
                            <p className="text-xs text-emerald-600 font-medium">
                              Kamu bisa login menggunakan Google
                            </p>
                          </div>
                        </div>
                        {secInfo.hasPassword ? (
                          <button
                            onClick={handleUnlinkGoogle}
                            disabled={unlinkLoading}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-red-200 text-red-600 font-bold text-sm rounded-2xl hover:bg-red-50 hover:border-red-300 transition-all disabled:opacity-60"
                          >
                            {unlinkLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Unlink className="h-4 w-4" />
                            )}
                            Lepas Akun Google
                          </button>
                        ) : (
                          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-2xl border border-amber-200">
                            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700 font-medium">
                              Buat password terlebih dahulu (di bagian bawah)
                              sebelum melepas akun Google, agar kamu tetap bisa
                              login.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                          <Info className="h-5 w-5 text-slate-400 shrink-0" />
                          <p className="text-sm text-slate-600 font-medium">
                            Hubungkan akun Google untuk login lebih cepat
                          </p>
                        </div>
                        <button
                          onClick={handleLinkGoogle}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-slate-200 text-slate-700 font-bold text-sm rounded-2xl hover:bg-slate-50 hover:border-emerald-300 hover:text-emerald-700 transition-all shadow-sm"
                        >
                          <Link2 className="h-4 w-4" />
                          Hubungkan Google
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ── Password Section ── */}
                  <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-6 shadow-[0_6px_0_0_#cbd5e1]">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                        <KeyRound className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-slate-800">
                          {secInfo.hasPassword
                            ? "Ubah Password"
                            : "Buat Password"}
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                          {secInfo.hasPassword
                            ? "Ganti kata sandi akunmu"
                            : "Buat password untuk bisa login dengan email & password"}
                        </p>
                      </div>
                    </div>

                    {secInfo.hasPassword ? (
                      <div className="space-y-4 max-w-md">
                        <PasswordField
                          id="cur-pw"
                          label="Password Saat Ini"
                          value={currentPw}
                          onChange={setCurrentPw}
                          placeholder="Masukkan password lama"
                        />
                        <PasswordField
                          id="new-pw"
                          label="Password Baru"
                          value={newPw}
                          onChange={setNewPw}
                          placeholder="Minimal 6 karakter"
                        />
                        <PasswordField
                          id="conf-pw"
                          label="Konfirmasi Password Baru"
                          value={confirmPw}
                          onChange={setConfirmPw}
                          placeholder="Ulangi password baru"
                        />
                        <button
                          onClick={handleChangePassword}
                          disabled={pwLoading}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-bold text-sm rounded-2xl hover:bg-emerald-600 border-b-4 border-emerald-700 hover:border-b-2 transition-all disabled:opacity-60"
                        >
                          {pwLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <KeyRound className="h-4 w-4" />
                          )}
                          Ubah Password
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4 max-w-md">
                        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-2xl border border-blue-200">
                          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                          <p className="text-xs text-blue-700 font-medium">
                            Kamu mendaftar menggunakan Google. Buat password
                            agar bisa login dengan email &amp; password juga.
                          </p>
                        </div>
                        <PasswordField
                          id="set-pw"
                          label="Password Baru"
                          value={firstPwValue}
                          onChange={setFirstPwValue}
                          placeholder="Minimal 6 karakter"
                        />
                        <PasswordField
                          id="set-pw-conf"
                          label="Konfirmasi Password"
                          value={firstPwConfirm}
                          onChange={setFirstPwConfirm}
                          placeholder="Ulangi password"
                        />
                        <button
                          onClick={handleSetPassword}
                          disabled={firstPwLoading}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-bold text-sm rounded-2xl hover:bg-blue-600 border-b-4 border-blue-700 hover:border-b-2 transition-all disabled:opacity-60"
                        >
                          {firstPwLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <KeyRound className="h-4 w-4" />
                          )}
                          Buat Password
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ── Danger Zone: Delete Account ── */}
                  <div className="bg-white border-2 border-red-200 rounded-[2rem] p-6 shadow-[0_6px_0_0_#fca5a5]">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center border border-red-100">
                        <Trash2 className="h-6 w-6 text-red-500" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-red-700">
                          Zona Berbahaya
                        </h2>
                        <p className="text-xs text-red-400 font-medium">
                          Hapus akun secara permanen
                        </p>
                      </div>
                    </div>

                    {!showDelete ? (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">
                          Menghapus akun akan menghapus semua data kamu secara
                          permanen termasuk profil, aktivitas, dan progres
                          belajar.{" "}
                          <span className="font-black text-red-600">
                            Tindakan ini tidak dapat dibatalkan.
                          </span>
                        </p>
                        <button
                          onClick={() => setShowDelete(true)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-red-200 text-red-600 font-bold text-sm rounded-2xl hover:bg-red-50 hover:border-red-300 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                          Saya Ingin Menghapus Akun
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4 max-w-md">
                        <div className="flex items-start gap-2 p-4 bg-red-50 rounded-2xl border border-red-200">
                          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold text-red-700 text-sm mb-1">
                              Apakah kamu yakin?
                            </p>
                            <p className="text-xs text-red-600 font-medium">
                              Semua data termasuk progres, badge, dan statistik
                              akan dihapus permanen.
                            </p>
                          </div>
                        </div>

                        {secInfo.hasPassword && (
                          <PasswordField
                            id="del-pw"
                            label="Konfirmasi Password"
                            value={delPw}
                            onChange={setDelPw}
                            placeholder="Masukkan passwordmu"
                          />
                        )}

                        <div className="space-y-1.5">
                          <label
                            htmlFor="del-confirm"
                            className="text-sm font-bold text-red-600 block ml-1"
                          >
                            Ketik{" "}
                            <span className="font-black bg-red-100 px-1.5 py-0.5 rounded">
                              HAPUS AKUN SAYA
                            </span>{" "}
                            untuk konfirmasi
                          </label>
                          <input
                            id="del-confirm"
                            type="text"
                            value={delConfirm}
                            onChange={(e) => setDelConfirm(e.target.value)}
                            placeholder="HAPUS AKUN SAYA"
                            className="w-full py-3 px-4 rounded-2xl border-2 border-red-200 bg-red-50 focus:bg-white focus:border-red-500 focus:outline-none transition-all font-bold text-red-700 placeholder:font-medium placeholder:text-red-300 text-sm"
                          />
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setShowDelete(false);
                              setDelPw("");
                              setDelConfirm("");
                            }}
                            className="px-5 py-2.5 bg-slate-100 text-slate-600 font-bold text-sm rounded-2xl hover:bg-slate-200 transition-all border-2 border-slate-200"
                          >
                            Batal
                          </button>
                          <button
                            onClick={handleDeleteAccount}
                            disabled={
                              delLoading || delConfirm !== "HAPUS AKUN SAYA"
                            }
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white font-bold text-sm rounded-2xl hover:bg-red-600 border-b-4 border-red-700 hover:border-b-2 transition-all disabled:opacity-60"
                          >
                            {delLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Hapus Akun Permanen
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-8 shadow-[0_6px_0_0_#cbd5e1] text-center">
                  <p className="text-slate-500 font-bold">
                    Gagal memuat data keamanan akun.
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
