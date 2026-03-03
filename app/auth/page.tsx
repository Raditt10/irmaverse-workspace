"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Tabs, TabsContent } from "@radix-ui/react-tabs";
import { AuthTabsList } from "./_components/TabsListAuth";
import { Loader2, Eye, EyeOff, LogIn, UserPlus, Sparkles, ArrowRight } from "lucide-react"; 

// --- SUB-COMPONENT: Password Input ---
const PasswordInput = ({ id, name, placeholder, required = false, minLength = 0 }: any) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative group">
      <input
        id={id}
        name={name}
        type={isVisible ? "text" : "password"}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="w-full py-4 px-5 pr-12 rounded-2xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none focus:shadow-[0_4px_0_0_#10b981] transition-all font-bold text-slate-700 placeholder:font-medium placeholder:text-slate-400"
      />
      <button
        type="button"
        onClick={() => setIsVisible(!isVisible)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors p-2 rounded-xl hover:bg-emerald-50 focus:outline-none"
        tabIndex={-1} 
      >
        {isVisible ? (
          <EyeOff className="h-5 w-5" strokeWidth={2.5} />
        ) : (
          <Eye className="h-5 w-5" strokeWidth={2.5} />
        )}
      </button>
    </div>
  );
};

// --- MAIN COMPONENT ---
const Auth = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccess("Registrasi berhasil! Silakan login.");
    }
  }, [searchParams]);

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("full-name") as string;
    const email = formData.get("signup-email") as string;
    const password = formData.get("signup-password") as string;
    const confirmPassword = formData.get("confirm-password") as string;

    if (password !== confirmPassword) {
      setError("Password tidak cocok");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Terjadi kesalahan saat registrasi");
        setIsLoading(false);
        return;
      }

      setSuccess("Registrasi berhasil! Silakan login.");
      (e.target as HTMLFormElement).reset();
      
      // Auto switch to signin tab logic would go here if managing tab state manually
      // For now we just show success message
    } catch (error) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("signin-email") as string;
    const password = formData.get("signin-password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email atau password salah");
        setIsLoading(false);
      } else if (result?.ok) {
        setSuccess("Login berhasil! Mengalihkan...");
        
        const response = await fetch("/api/users/profile");
        const userData = await response.json();
        
        let redirectUrl = "/overview";
        if (userData.role === "ADMIN") redirectUrl = "/admin";
        else if (userData.role === "INSTRUCTOR") redirectUrl = "/instructor";
        
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 500);
      }
    } catch (error) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      console.error("Login error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-center items-center bg-[#FDFBF7] overflow-x-hidden">
      
      {/* Background Decorations */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-0 right-0 w-full h-full opacity-[0.03] bg-[radial-gradient(#10b981_1.5px,transparent_1.5px)] bg-size-[24px_24px]"></div>
         <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-teal-200/30 rounded-full blur-3xl animate-pulse"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 w-full max-w-6xl items-center">
    
          {/* LEFT COLUMN: AUTH CARD */}
          <div className="relative w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
            
            {/* Main Card */}
            <div className="bg-white rounded-[2.5rem] border-2 border-slate-200 shadow-[0_8px_0_0_#cbd5e1] p-6 sm:p-8 md:p-10 relative overflow-hidden">
                
                {/* Header */}
                <div className="flex flex-col items-center gap-3 mb-8">
                    <div className="w-16 h-16 flex items-center justify-center rounded-2xl">
                        <img src="/logo.webp" alt="IRMA Logo" className="w-16 h-16 object-contain" />
                    </div>
                    <div className="text-center">
                        <h1 className="font-black text-2xl text-slate-800 tracking-tight">IRMA Verse</h1>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Platform Rohis Digital</p>
                    </div>
                </div>
            
                <Tabs defaultValue="signin" className="w-full">
                    <AuthTabsList />

                    {/* === FORM SIGN IN === */}
                    <TabsContent value="signin" className="animate-in fade-in-50 zoom-in-95 duration-300 focus-visible:outline-none">
                        <form onSubmit={handleSignIn} className="space-y-5">
                            {error && (
                                <div className="rounded-2xl bg-red-50 p-4 border-2 border-red-100 flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                                    <p className="text-sm text-red-600 font-bold">{error}</p>
                                </div>
                            )}
                            {success && (
                                <div className="rounded-2xl bg-emerald-50 p-4 border-2 border-emerald-100 flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                                    <p className="text-sm text-emerald-600 font-bold">{success}</p>
                                </div>
                            )}
                            
                            <div className="space-y-2">
                                <label htmlFor="signin-email" className="text-slate-700 font-bold text-sm ml-1 block">Email</label>
                                <input
                                    id="signin-email"
                                    name="signin-email"
                                    type="email"
                                    placeholder="contoh@sekolah.sch.id"
                                    required
                                    className="w-full py-4 px-5 rounded-2xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none focus:shadow-[0_4px_0_0_#10b981] transition-all font-bold text-slate-700 placeholder:font-medium placeholder:text-slate-400"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label htmlFor="signin-password" className="text-slate-700 font-bold text-sm">Kata Sandi</label>
                                    <a href="#" className="text-xs font-bold text-teal-500 hover:text-teal-600 hover:underline">Lupa sandi?</a>
                                </div>
                                <PasswordInput 
                                    id="signin-password"
                                    name="signin-password"
                                    placeholder="••••••••"
                                    required={true}
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black text-base border-2 border-emerald-600 border-b-4 hover:bg-emerald-600 hover:border-b-4 active:border-b-2 active:translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 mt-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" strokeWidth={3} />
                                        <span>Memproses...</span>
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="w-5 h-5" strokeWidth={3} />
                                        <span>Masuk Sekarang</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </TabsContent>

                    {/* === FORM SIGN UP === */}
                    <TabsContent value="signup" className="animate-in fade-in-50 zoom-in-95 duration-300 focus-visible:outline-none">
                        <form onSubmit={handleSignUp} className="space-y-5">
                            {error && (
                                <div className="rounded-2xl bg-red-50 p-4 border-2 border-red-100 flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                                    <p className="text-sm text-red-600 font-bold">{error}</p>
                                </div>
                            )}
                            
                            <div className="space-y-2">
                                <label htmlFor="full-name" className="text-slate-700 font-bold text-sm ml-1 block">Nama Lengkap</label>
                                <input
                                    id="full-name"
                                    name="full-name"
                                    type="text"
                                    placeholder="Nama Lengkap"
                                    required
                                    className="w-full py-4 px-5 rounded-2xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none focus:shadow-[0_4px_0_0_#10b981] transition-all font-bold text-slate-700 placeholder:font-medium placeholder:text-slate-400"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="signup-email" className="text-slate-700 font-bold text-sm ml-1 block">Email</label>
                                <input
                                    id="signup-email"
                                    name="signup-email"
                                    type="email"
                                    placeholder="nama@email.com"
                                    required
                                    className="w-full py-4 px-5 rounded-2xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 focus:outline-none focus:shadow-[0_4px_0_0_#10b981] transition-all font-bold text-slate-700 placeholder:font-medium placeholder:text-slate-400"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="signup-password" className="text-slate-700 font-bold text-sm ml-1 block">Kata Sandi</label>
                                <PasswordInput 
                                    id="signup-password"
                                    name="signup-password"
                                    placeholder="Minimal 6 karakter"
                                    required={true}
                                    minLength={6}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="confirm-password" className="text-slate-700 font-bold text-sm ml-1 block">Konfirmasi Kata Sandi</label>
                                <PasswordInput 
                                    id="confirm-password"
                                    name="confirm-password"
                                    placeholder="Ulangi kata sandi"
                                    required={true}
                                    minLength={6}
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 rounded-2xl bg-teal-500 text-white font-black text-base border-2 border-teal-600 border-b-4 hover:bg-teal-600 hover:border-b-4 active:border-b-2 active:translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-teal-200 mt-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" strokeWidth={3} />
                                        <span>Memproses...</span>
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-5 h-5" strokeWidth={3} />
                                        <span>Buat Akun</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </TabsContent>
                </Tabs>
            </div>
          </div>

          {/* RIGHT COLUMN: ILLUSTRATION (Desktop) */}
          <div className="hidden lg:flex flex-col justify-center items-start px-6">
            <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-xl relative overflow-hidden mb-8 transform hover:scale-[1.02] transition-transform duration-500">
               {/* Decorative Shapes */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100 rounded-full -mr-16 -mt-16"></div>
               <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-100 rounded-full -ml-12 -mb-12"></div>
               
               {/* Illustration Placeholder (SVG Code) */}
               <div className="relative z-10 flex justify-center mb-6">
                  <svg width="280" height="180" viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M40 140H240" stroke="#E2E8F0" strokeWidth="4" strokeLinecap="round"/>
                    {/* Character/Icon placeholder style */}
                    <rect x="100" y="40" width="80" height="100" rx="20" fill="white" stroke="#0F766E" strokeWidth="4"/>
                    <path d="M120 70H160" stroke="#0F766E" strokeWidth="4" strokeLinecap="round"/>
                    <path d="M120 90H150" stroke="#0F766E" strokeWidth="4" strokeLinecap="round"/>
                    <circle cx="190" cy="130" r="25" fill="#FCD34D" stroke="#0F766E" strokeWidth="4"/>
                    <path d="M180 130L185 135L195 125" stroke="#0F766E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="70" cy="60" r="15" fill="#34D399" opacity="0.5"/>
                    <circle cx="230" cy="50" r="10" fill="#2DD4BF" opacity="0.5"/>
                  </svg>
               </div>

               <div className="text-center relative z-10">
                  <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 text-xs font-black uppercase tracking-wider rounded-lg mb-3">
                    Komunitas Islami SMKN 13 Bandung
                  </span>
                  <h3 className="text-3xl font-black text-slate-800 mb-3 leading-tight">
                    Belajar Agama Jadi <br/>
                    <span className="text-teal-500">Lebih Seru!</span>
                  </h3>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    Gabung bersama teman-teman IRMA lainnya. Kelola kajian, ikut kuis, dan pantau progresmu dalam satu aplikasi.
                  </p>
               </div>
            </div>
            
            <div className="flex items-center gap-4 text-slate-400 font-bold text-sm mx-auto">
                <span>© 2026 Syntax13</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <a href="#" className="hover:text-teal-600 transition-colors">Bantuan</a>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <a href="#" className="hover:text-teal-600 transition-colors">Privasi</a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    }>
      <Auth />
    </Suspense>
  );
}