"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Bell,
  LogOut,
  Settings,
  User as UserIcon,
  Menu,
  TrendingUp,
  Check,
  X,
  BookOpen,
  Calendar,
  Info,
  Megaphone,
  Trophy,
  CheckCheck,
  Users,
} from "lucide-react";
import Toast from "@/components/ui/Toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/DropDown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SearchBar from "@/components/ui/SearchBar";
import {
  useNotifications,
  type NotificationData,
} from "@/lib/notification-provider";

export default function DashboardHeader() {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  const {
    notifications,
    unreadCount,
    loading,
    markAllAsRead,
    respondToInvitation,
  } = useNotifications();

  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      if (typeof window !== "undefined") {
        window.location.href = "/auth";
      }
    },
  });

  const handleBellClick = () => {
    setShowNotifications((prev) => !prev);
  };

  const handleInvitationResponse = async (
    id: string,
    action: "accepted" | "rejected",
    reason?: string,
  ) => {
    setRespondingId(id);
    try {
      await respondToInvitation(id, action, reason);
      
      const notif = notifications.find(n => n.id === id);
      // Extract kajian name from message "xxx mengundang Anda untuk bergabung ke kajian "Kajian Name""
      let kajianName = "kajian";
      if (notif?.message) {
        const match = notif.message.match(/"([^"]+)"/);
        if (match) kajianName = match[1];
      } else if (notif?.title) {
        kajianName = notif.title;
      }

      if (action === "accepted") {
        setToast({
          show: true,
          message: `Kamu berhasil masuk ke kajian "${kajianName}"`,
          type: "success"
        });
      } else {
        setToast({
          show: true,
          message: `Kamu menolak undangan ke kajian "${kajianName}"`,
          type: "error"
        });
      }

      setDecliningId(null);
      setDeclineReason("");
      
      // Auto-hide toast
      setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3000);
    } catch (error) {
      setToast({
        show: true,
        message: "Gagal memproses undangan",
        type: "error"
      });
      setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3000);
    } finally {
      setRespondingId(null);
    }
  };

  const handleNotificationClick = (notif: NotificationData) => {
    if (notif.actionUrl) {
      setShowNotifications(false);
      router.push(notif.actionUrl);
    }
  };

  const getNotificationIcon = (notif: NotificationData) => {
    if (notif.type === "invitation")
      return <BookOpen className="h-5 w-5 text-emerald-600" />;
    switch (notif.icon) {
      case "trophy":
        return <Trophy className="h-5 w-5 text-amber-500" />;
      case "calendar":
        return <Calendar className="h-5 w-5 text-blue-500" />;
      case "megaphone":
        return <Megaphone className="h-5 w-5 text-purple-500" />;
      default:
        return <Info className="h-5 w-5 text-slate-500" />;
    }
  };

  // Separate notifications by type for display
  // ACTIVE: Only pending/unread invitations
  const invitationNotifs = notifications.filter(
    (n) =>
      n.type === "invitation" && 
      n.status !== "accepted" && 
      n.status !== "rejected",
  );
  
  // HISTORY: All basic notifications + responded invitations
  const basicNotifs = notifications.filter(
    (n) =>
      n.type === "basic" || 
      n.status === "accepted" || 
      n.status === "rejected",
  );

  const userName = session?.user?.name || "User";
  const userAvatar = (session?.user as any)?.avatar;
  const displayAvatar =
    userAvatar ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`;
  const userEmail = session?.user?.email || "user@irmaverse.com";
  const userInitials = userName.substring(0, 2).toUpperCase();

  return (
    <div
      className="border-b-2 border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-40 font-sans"
    >
      <div className="flex items-center justify-between gap-2 sm:gap-4 h-20 px-3 sm:px-4 lg:px-8">
        {/* --- LEFT: LOGO --- */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink min-w-0">
          <button
            className="lg:hidden inline-flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 active:scale-95 transition-all shrink-0"
            onClick={() =>
              window.dispatchEvent(new Event("open-mobile-sidebar"))
            }
            aria-label="Buka menu"
          >
            <Menu className="h-5 w-5" strokeWidth={2.5} />
          </button>

          <img
            src="/logo.webp"
            alt="IRMA Verse"
            className="h-8 w-8 sm:h-10 sm:w-10 object-contain shrink-0"
          />

          <div className="min-w-0">
            <h2 className="text-xs sm:text-lg font-black text-emerald-600 leading-tight tracking-tight truncate">
              IRMA VERSE
            </h2>
            <p className="text-[8px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest leading-none mt-0.5 truncate">
              Platform resmi Irma13
            </p>
          </div>
        </div>

        {/* --- CENTER: SEARCH BAR --- */}
        <div className="hidden md:flex flex-1 max-w-lg mx-4">
          <div className="w-full">
            <SearchBar />
          </div>
        </div>

        {/* --- RIGHT: ACTIONS --- */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={handleBellClick}
              className="relative h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-white border-2 border-slate-200 shadow-[2px_2px_0_0_#cbd5e1] sm:shadow-[3px_3px_0_0_#cbd5e1] hover:border-emerald-400 hover:shadow-[3px_3px_0_0_#34d399] active:translate-y-0.5 active:shadow-none transition-all inline-flex items-center justify-center outline-none"
              aria-label="Lihat notifikasi"
            >
              <Bell
                className="h-5 w-5 text-slate-500 hover:text-emerald-600 transition-colors"
                strokeWidth={2.5}
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4.5 w-4.5 sm:h-5 sm:w-5 rounded-full bg-red-500 text-white text-[9px] sm:text-[10px] font-black flex items-center justify-center shadow-[2px_2px_0_0_#fff]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Notification Panel */}
            {showNotifications && (
              <>
                <div
                  className="fixed left-4 right-4 top-20 z-50 sm:absolute sm:right-0 sm:left-auto sm:top-full sm:mt-2 sm:w-105 sm:rounded-2xl flex flex-col bg-white rounded-2xl border-2 border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.15)] max-h-[80vh] sm:max-h-150 overflow-hidden sm:shadow-xl animate-in fade-in-0 zoom-in-95 sm:fade-in-0 sm:zoom-in-100 duration-200"
                >
                  {/* Header */}
                  <div className="bg-linear-to-r from-emerald-50 to-teal-50 border-b-2 border-emerald-100 px-5 py-4 flex items-center justify-between shrink-0">
                    <p className="font-black text-sm text-emerald-800 tracking-wide flex items-center gap-2">
                      <Bell className="h-4 w-4" /> NOTIFIKASI
                      {unreadCount > 0 && (
                        <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-black">
                          {unreadCount}
                        </span>
                      )}
                    </p>

                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                          title="Tandai semua sudah dibaca"
                        >
                          <CheckCheck className="h-3 w-3" /> Baca Semua
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="h-9 w-9 flex items-center justify-center bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border-2 border-slate-200 hover:border-red-200 shadow-sm active:scale-95 shrink-0"
                        aria-label="Tutup notifikasi"
                      >
                        <X className="h-5 w-5" strokeWidth={3} />
                      </button>
                    </div>
                  </div>

                  {/* Content - Scrollable */}
                  <div className="overflow-y-auto flex-1 p-3 space-y-3 bg-slate-50/50">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-10">
                        <div className="animate-spin h-8 w-8 border-4 border-emerald-400 border-t-transparent rounded-full mb-3"></div>
                        <p className="text-xs text-slate-500 font-bold">
                          Sedang memuat...
                        </p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="text-center py-10">
                        <div className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-3 border-2 border-slate-200 shadow-sm">
                          <Bell className="h-8 w-8 text-slate-300" />
                        </div>
                        <p className="text-slate-600 text-sm font-black">
                          Sepi banget...
                        </p>
                        <p className="text-slate-400 text-xs mt-1 font-medium">
                          Belum ada notifikasi baru untukmu.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Invitation Notifications */}
                        {invitationNotifs.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-400 px-2 uppercase tracking-wider">
                              Undangan
                            </p>
                            {invitationNotifs.map((notif) => (
                              <div
                                key={notif.id}
                                className={`border-2 rounded-2xl p-4 bg-white shadow-sm transition-colors ${notif.status === "unread" ? "border-emerald-300 bg-emerald-50/30" : "border-slate-100"}`}
                              >
                                <div className="flex items-start gap-3 mb-3">
                                  <div className="mt-0.5 p-2 bg-emerald-100 rounded-xl border border-emerald-200 shrink-0">
                                    <BookOpen className="h-4 w-4 text-emerald-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-black text-slate-800 text-sm">
                                      {notif.title}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                                      {notif.message}
                                    </p>
                                    {notif.sender && (
                                      <p className="text-[11px] text-slate-400 mt-1.5 font-bold flex items-center gap-1">
                                        Dari{" "}
                                        <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                          {notif.sender.name}
                                        </span>
                                      </p>
                                    )}
                                    <p className="text-[10px] text-slate-300 mt-1 font-medium flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(
                                        notif.createdAt,
                                      ).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                </div>
                                {decliningId === notif.id ? (
                                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <textarea
                                      value={declineReason}
                                      onChange={(e) =>
                                        setDeclineReason(e.target.value)
                                      }
                                      placeholder="Alasan menolak (Opsional)..."
                                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border-2 border-slate-100 text-xs font-bold text-slate-700 focus:border-emerald-200 focus:outline-none transition-all resize-none shadow-inner"
                                      rows={2}
                                      autoFocus
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() =>
                                          handleInvitationResponse(
                                            notif.id,
                                            "rejected",
                                            declineReason,
                                          )
                                        }
                                        disabled={respondingId === notif.id}
                                        className="flex-1 px-3 py-2 bg-rose-500 text-white font-bold text-[10px] rounded-lg border-b-2 border-rose-700 active:border-b-0 active:translate-y-px transition-all disabled:opacity-50"
                                      >
                                        Kirim & Tolak
                                      </button>
                                      <button
                                        onClick={() => {
                                          setDecliningId(null);
                                          setDeclineReason("");
                                        }}
                                        className="flex-1 px-3 py-2 bg-slate-100 text-slate-500 font-bold text-[10px] rounded-lg border-2 border-slate-200 hover:bg-slate-200 transition-all"
                                      >
                                        Batal
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() =>
                                        handleInvitationResponse(
                                          notif.id,
                                          "accepted",
                                        )
                                      }
                                      disabled={respondingId === notif.id}
                                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-500 text-white font-bold text-xs rounded-xl hover:bg-emerald-600 active:translate-y-0.5 transition-all border-b-4 border-emerald-700 active:border-b-0 shadow-lg shadow-emerald-200 disabled:opacity-50"
                                    >
                                      <Check className="h-4 w-4" /> Terima
                                    </button>
                                    <button
                                      onClick={() => setDecliningId(notif.id)}
                                      disabled={respondingId === notif.id}
                                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 active:translate-y-0.5 transition-all border-2 border-slate-200 border-b-4 active:border-b-2 disabled:opacity-50"
                                    >
                                      <X className="h-4 w-4" /> Tolak
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Divider */}
                        {invitationNotifs.length > 0 &&
                          basicNotifs.length > 0 && (
                            <div className="h-px bg-slate-200 my-2 mx-2" />
                          )}

                        {/* Basic / Responded Notifications */}
                        {basicNotifs.length > 0 && (
                          <div className="space-y-2 mt-4">
                            <p className="text-[10px] font-black text-slate-400 px-2 uppercase tracking-wider">
                              History 
                            </p>
                            {basicNotifs.map((notif) => (
                              <div
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif)}
                                className={`border-2 rounded-2xl p-4 bg-white shadow-sm transition-colors group ${
                                  notif.actionUrl
                                    ? "cursor-pointer hover:border-emerald-300"
                                    : ""
                                } ${notif.status === "unread" ? "border-emerald-200 bg-emerald-50/20" : "border-slate-100"} ${
                                  notif.status === "accepted"
                                    ? "border-green-200 bg-green-50/20"
                                    : ""
                                } ${notif.status === "rejected" ? "border-red-200 bg-red-50/20" : ""}`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5 p-2 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
                                    {getNotificationIcon(notif)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="font-black text-slate-800 text-sm truncate">
                                        {notif.title}
                                      </p>
                                      {notif.status === "unread" && (
                                        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"></span>
                                      )}
                                      {notif.status === "accepted" && (
                                        <span className="text-[9px] font-black text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full shrink-0">
                                          Diterima
                                        </span>
                                      )}
                                      {notif.status === "rejected" && (
                                        <span className="text-[9px] font-black text-red-500 bg-red-100 px-1.5 py-0.5 rounded-full shrink-0">
                                          Ditolak
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed line-clamp-2">
                                      {notif.message}
                                    </p>
                                    <p className="text-[10px] text-slate-300 mt-1.5 font-medium flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {new Date(
                                        notif.createdAt,
                                      ).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Notification Toast */}
          <Toast
            show={toast.show}
            message={toast.message}
            type={toast.type}
            onClose={() => setToast((prev) => ({ ...prev, show: false }))}
          />

          {/* Profile Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 h-11 pl-1.5 pr-4 rounded-xl bg-white border-2 border-slate-200 shadow-[3px_3px_0_0_#cbd5e1] hover:border-emerald-400 hover:shadow-[3px_3px_0_0_#34d399] active:translate-y-0.5 active:shadow-none transition-all outline-none group">
                <Avatar className="h-8 w-8 border-2 border-slate-200 group-hover:border-emerald-400 transition-colors">
                  <AvatarImage
                    src={displayAvatar}
                    alt={userName}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-linear-to-br from-emerald-400 to-teal-500 text-white text-xs font-black">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>

                <div className="hidden sm:flex flex-col items-start justify-center text-left">
                  <span className="text-xs font-black text-slate-700 leading-none group-hover:text-emerald-700 truncate max-w-25 mb-0.5">
                    {userName.split(" ")[0]}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 leading-none truncate max-w-30">
                    {userEmail}
                  </span>
                </div>

                <Settings className="h-4 w-4 text-slate-300 group-hover:text-emerald-400 transition-colors ml-1" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-60 mt-2 p-2 rounded-2xl border-2 border-slate-200 shadow-[4px_4px_0_0_#cbd5e1] bg-white"
            >
              <DropdownMenuLabel className="px-2 py-2 mb-2 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                    <AvatarImage
                      src={displayAvatar}
                      alt={userName}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-emerald-500 text-white font-black">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-black text-slate-800 truncate">
                      {userName}
                    </span>
                    <span className="text-xs font-medium text-slate-500 truncate">
                      {userEmail}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <div className="space-y-1">
                <DropdownMenuItem
                  onClick={() => router.push("/profile")}
                  className="cursor-pointer font-bold text-slate-600 focus:text-emerald-700 focus:bg-emerald-50 rounded-lg px-3 py-2.5 transition-colors"
                >
                  <UserIcon className="h-4 w-4 mr-2" strokeWidth={2.5} />
                  <span>Profile Saya</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => router.push("/level")}
                  className="cursor-pointer font-bold text-slate-600 focus:text-emerald-700 focus:bg-emerald-50 rounded-lg px-3 py-2.5 transition-colors"
                >
                  <TrendingUp className="h-4 w-4 mr-2" strokeWidth={2.5} />
                  <span>Level & Poin</span>
                </DropdownMenuItem>

                {/* --- MENU TEMANKU DITAMBAHKAN DI SINI --- */}
                <DropdownMenuItem
                  onClick={() => router.push("/friends")}
                  className="cursor-pointer font-bold text-slate-600 focus:text-emerald-700 focus:bg-emerald-50 rounded-lg px-3 py-2.5 transition-colors"
                >
                  <Users className="h-4 w-4 mr-2" strokeWidth={2.5} />
                  <span>Temanku</span>
                </DropdownMenuItem>
                {/* -------------------------------------- */}

                <DropdownMenuItem className="cursor-pointer font-bold text-slate-600 focus:text-emerald-700 focus:bg-emerald-50 rounded-lg px-3 py-2.5 transition-colors">
                  <Settings className="h-4 w-4 mr-2" strokeWidth={2.5} />
                  <span>Pengaturan</span>
                </DropdownMenuItem>
              </div>

              <div className="h-0.5 bg-slate-100 my-2 rounded-full" />

              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/auth" })}
                className="cursor-pointer font-bold text-rose-600 focus:text-rose-700 focus:bg-rose-50 rounded-lg px-3 py-2.5 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" strokeWidth={2.5} />
                <span>Keluar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* Mobile Search Bar - More compact */}
      <div className="md:hidden px-4 pb-3 pt-0 border-t border-slate-100 bg-white/50 backdrop-blur-sm">
        <div className="mt-3 scale-[0.98] origin-top">
          <SearchBar />
        </div>
      </div>
    </div>
  );
}