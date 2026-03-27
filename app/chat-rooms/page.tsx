"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  Suspense,
} from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import { Textarea } from "@/components/ui/textarea";
import Loading from "@/components/ui/Loading";
import Toast from "@/components/ui/Toast";
import PageBanner from "@/components/ui/PageBanner";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSocket } from "@/lib/socket";
import {
  formatMessageDate,
  formatTimeOnly,
  playNotificationSound,
} from "@/lib/chat-utils";
import {
  Send,
  Menu,
  Users,
  MessageSquare,
  Globe2,
  ChevronDown,
  Loader2,
  Shield,
  Maximize2,
  Minimize2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface GroupMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatar?: string | null;
    role?: string;
  };
}

interface TypingUser {
  userId: string;
  name: string;
}

// ── Main Component ────────────────────────────────────────────────────────────

const GlobalForumPage = () => {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/auth");
    },
  });
  
  const role = session?.user?.role?.toLowerCase();

  const { socket, isConnected, onlineUsers } = useSocket();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isDesktopChatFullscreen, setIsDesktopChatFullscreen] = useState(false);

  // ── Message state ─────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // ── Pagination state ──────────────────────────────────────────────────────
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const oldestCreatedAt = useRef<string | null>(null); // timestamp cursor

  // ── Forum-specific realtime state ─────────────────────────────────────────
  const [forumOnlineCount, setForumOnlineCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  // ── Scroll state ──────────────────────────────────────────────────────────
  const messagesRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // ── Typing refs ───────────────────────────────────────────────────────────
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // ── Toast helper ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (toast?.show) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // ── Scroll helpers ────────────────────────────────────────────────────────
  const scrollToBottom = useCallback((smooth = false) => {
    const el = messagesRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  const checkScrollPosition = useCallback(() => {
    const el = messagesRef.current;
    if (!el) return;
    const threshold = 150;
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    isAtBottomRef.current = atBottom;
    setShowScrollBtn(!atBottom);
  }, []);

  // ── Initial data fetch ────────────────────────────────────────────────────
  const fetchInitialMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/forum/messages");
      if (res.ok) {
        const data = await res.json();
        const msgs: GroupMessage[] = data.messages ?? [];
        setMessages(msgs);
        setHasMore(data.hasMore ?? false);
        if (msgs.length > 0) {
          oldestCreatedAt.current = msgs[0].createdAt;
        }
      }
    } catch (err) {
      console.error("Error fetching forum messages:", err);
      setToast({ show: true, message: "Gagal memuat pesan forum", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchInitialMessages();
    }
  }, [status, fetchInitialMessages]);

  // Scroll to bottom once initial messages load
  useEffect(() => {
    if (!loading) {
      scrollToBottom(false);
    }
  }, [loading, scrollToBottom]);

  // ── Load older messages (infinite scroll upward) ──────────────────────────
  const loadOlderMessages = useCallback(async () => {
    if (!hasMore || isLoadingMore || !oldestCreatedAt.current) return;
    setIsLoadingMore(true);

    const container = messagesRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;

    try {
      const res = await fetch(
        `/api/chat/forum/messages?before=${encodeURIComponent(oldestCreatedAt.current)}`,
      );
      if (res.ok) {
        const data = await res.json();
        const older: GroupMessage[] = data.messages ?? [];
        if (older.length > 0) {
          setMessages((prev) => [...older, ...prev]);
          setHasMore(data.hasMore ?? false);
          oldestCreatedAt.current = older[0].createdAt;

          // Restore scroll position so the view doesn't jump
          requestAnimationFrame(() => {
            if (container) {
              container.scrollTop = container.scrollHeight - prevScrollHeight;
            }
          });
        } else {
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error("Error loading older messages:", err);
      setToast({ show: true, message: "Gagal memuat pesan lama", type: "error" });
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore]);

  // ── Scroll event handler ──────────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    checkScrollPosition();
    const el = messagesRef.current;
    if (!el) return;
    if (el.scrollTop < 80 && hasMore && !isLoadingMore) {
      loadOlderMessages();
    }
  }, [checkScrollPosition, hasMore, isLoadingMore, loadOlderMessages]);

  // ── Auto-scroll when new messages arrive ──────────────────────────────────
  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom(false);
    }
  }, [messages, scrollToBottom]);

  // ── Forum socket events ───────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !session?.user?.id) return;

    // Join the public forum room
    socket.emit("forum:join", {
      userId: session.user.id,
      name: session.user.name ?? "Anonim",
    });

    // ── Incoming message ──────────────────────────────────────────────────
    const handleNewMessage = (data: GroupMessage) => {
      setMessages((prev) => {
        // Deduplicate by id
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
      if (data.senderId !== session.user.id) {
        playNotificationSound();
      }
    };

    // ── Online count from forum room ──────────────────────────────────────
    const handleParticipantUpdate = (count: number) => {
      setForumOnlineCount(count);
    };

    // ── Typing list ───────────────────────────────────────────────────────
    const handleTypingUpdate = (users: TypingUser[]) => {
      setTypingUsers(users);
    };

    socket.on("forum:message:receive", handleNewMessage);
    socket.on("forum:participants:update", handleParticipantUpdate);
    socket.on("forum:typing:update", handleTypingUpdate);

    return () => {
      socket.emit("forum:leave", { userId: session.user.id });
      socket.off("forum:message:receive", handleNewMessage);
      socket.off("forum:participants:update", handleParticipantUpdate);
      socket.off("forum:typing:update", handleTypingUpdate);
    };
  }, [socket, session?.user?.id, session?.user?.name]);

  // ── Typing indicator helpers ──────────────────────────────────────────────
  const stopTyping = useCallback(() => {
    if (!isTypingRef.current || !socket || !session?.user?.id) return;
    isTypingRef.current = false;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit("forum:typing:stop", { userId: session.user.id });
  }, [socket, session?.user?.id]);

  const handleDraftChange = useCallback(
    (value: string) => {
      setMessageDraft(value);

      if (!socket || !session?.user?.id) return;

      if (value.trim()) {
        if (!isTypingRef.current) {
          isTypingRef.current = true;
          socket.emit("forum:typing:start", {
            userId: session.user.id,
            userName: session.user.name ?? "Anonim",
          });
        }
        // Debounce: auto-stop typing after 2 s of inactivity
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(stopTyping, 2000);
      } else {
        stopTyping();
      }
    },
    [socket, session?.user?.id, session?.user?.name, stopTyping],
  );

  // ── Typing label helper ───────────────────────────────────────────────────
  const typingLabel = (() => {
    const others = typingUsers.filter((u) => u.userId !== session?.user?.id);
    if (others.length === 0) return null;
    if (others.length === 1) return `${others[0].name} sedang mengetik…`;
    return `${others.length} orang sedang mengetik…`;
  })();

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    const content = messageDraft.trim();
    if (!content || !session?.user || isSending) return;

    // Stop typing indicator immediately
    stopTyping();
    setMessageDraft("");
    setIsSending(true);
    isAtBottomRef.current = true; // always scroll down after sending

    try {
      const res = await fetch("/api/chat/forum/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const savedMsg: GroupMessage = await res.json();
        // Tell the server to broadcast to all room members (incl. sender)
        socket?.emit("forum:message:send", { message: savedMsg });
      } else {
        setToast({
          show: true,
          message: "Gagal mengirim pesan",
          type: "error",
        });
        setMessageDraft(content); // restore draft on failure
      }
    } catch {
      setToast({ show: true, message: "Gagal mengirim pesan", type: "error" });
      setMessageDraft(content);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ── Render loading ────────────────────────────────────────────────────────
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Loading text="Masuk ke forum…" />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-dvh bg-[#FDFBF7] flex flex-col overflow-hidden">
      {/* Main header – hidden when fullscreen */}
      <div
        className={`${isDesktopChatFullscreen ? "hidden" : "hidden lg:block"} shrink-0`}
      >
        <DashboardHeader />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`${isDesktopChatFullscreen ? "hidden" : "block"} h-full shrink-0`}
        >
          <Sidebar />
        </div>

        <main
          className={`w-full flex-1 flex flex-col ${isDesktopChatFullscreen ? "p-0" : "p-0 lg:p-6"} overflow-hidden relative transition-all`}
        >
          {/* Page title (desktop only) */}
          <PageBanner
            title="Forum Diskusi"
            description="Grup Ngobrol Santai & Belajar Bersama dengan kawan kawan di IRMA Verse"
            icon={MessageSquare}
            tag="Forum"
            tagIcon={MessageSquare}
            className={isDesktopChatFullscreen ? "hidden" : "hidden lg:flex mb-4 shrink-0"}
          />

          {/* Chat container */}
          <div
            className={`
              flex flex-col flex-1 bg-slate-50 w-full h-full overflow-hidden transition-all duration-300
              ${
                isDesktopChatFullscreen
                  ? "rounded-none border-0 shadow-none"
                  : "lg:rounded-4xl lg:border-4 border-slate-200 lg:shadow-[0_8px_0_0_#cbd5e1]"
              }
            `}
          >
            {/* ── Forum header bar ──────────────────────────────────────── */}
            <div className="flex items-center justify-between px-3 lg:px-4 py-3 bg-white border-b-2 border-slate-100 shadow-sm z-20 shrink-0">
              <div className="flex items-center gap-3">
                {/* Mobile menu toggle */}
                <button
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent("open-mobile-sidebar"))
                  }
                  className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 hover:text-teal-600 rounded-xl transition-colors"
                >
                  <Menu className="h-6 w-6" strokeWidth={2.5} />
                </button>

                <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-2 ring-slate-100 bg-teal-100 text-teal-500">
                  <AvatarFallback className="font-black bg-teal-100">
                    <Globe2 className="h-5 w-5 text-teal-500" />
                  </AvatarFallback>
                </Avatar>

                <div>
                  <h3 className="font-black text-slate-800 text-base leading-tight line-clamp-1">
                    Forum Diskusi IRMA13
                  </h3>
                  <div className="flex items-center gap-3 mt-0.5">
                    {/* Forum room participant count */}
                    <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Users className="h-3 w-3 text-teal-500" />
                      <span>{forumOnlineCount} di forum</span>
                    </p>
                    {/* Global online count */}
                    <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                      <span>{onlineUsers.size} online</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Fullscreen toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDesktopChatFullscreen((v) => !v)}
                  className="hidden lg:inline-flex p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-teal-600 transition-colors"
                  title={
                    isDesktopChatFullscreen
                      ? "Keluar Fullscreen"
                      : "Layar Penuh"
                  }
                >
                  {isDesktopChatFullscreen ? (
                    <Minimize2 className="h-5 w-5" strokeWidth={2.5} />
                  ) : (
                    <Maximize2 className="h-5 w-5" strokeWidth={2.5} />
                  )}
                </button>
              </div>
            </div>

            {/* ── Messages area ──────────────────────────────────────────── */}
            <div className="relative flex-1 overflow-hidden">
              <div
                ref={messagesRef}
                onScroll={handleScroll}
                className="h-full overflow-y-auto p-4 space-y-1 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-100/50"
              >
                {/* Load more spinner / end indicator */}
                <div className="flex justify-center py-2 shrink-0">
                  {isLoadingMore ? (
                    <span className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-white/80 border border-slate-200 px-3 py-1 rounded-full shadow-sm">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Memuat pesan lama…
                    </span>
                  ) : !hasMore && messages.length > 0 ? (
                    <span className="text-[10px] font-black text-slate-400 bg-white/80 border border-slate-200 px-3 py-1 rounded-full uppercase tracking-wider shadow-sm backdrop-blur-sm">
                      Awal percakapan
                    </span>
                  ) : null}
                </div>

                {/* Empty state */}
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-50 pt-16">
                    <MessageSquare className="h-16 w-16 text-slate-300 mb-2" />
                    <p className="text-sm font-bold text-slate-400">
                      Belum ada obrolan. Jadilah yang pertama!
                    </p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isMe = message.senderId === session?.user?.id;
                    const showDate =
                      index === 0 ||
                      new Date(message.createdAt).toDateString() !==
                        new Date(messages[index - 1].createdAt).toDateString();
                    const showAvatar =
                      !isMe &&
                      (index === 0 ||
                        messages[index - 1].senderId !== message.senderId ||
                        showDate);

                    return (
                      <React.Fragment key={message.id}>
                        {/* Date separator */}
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <span className="text-[10px] font-black text-slate-400 bg-white/80 border border-slate-200 px-3 py-1 rounded-full uppercase tracking-wider shadow-sm backdrop-blur-sm">
                              {formatMessageDate(message.createdAt)}
                            </span>
                          </div>
                        )}

                        <div
                          className={`flex w-full ${isMe ? "justify-end" : "justify-start"} group gap-2`}
                        >
                          {/* Avatar (other users) */}
                          {!isMe && (
                            <div className="w-8 shrink-0 flex items-end">
                              {showAvatar && (
                                <Avatar className="h-8 w-8 border border-slate-200 shadow-sm">
                                  <AvatarImage
                                    src={
                                      message.sender.avatar ??
                                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(message.sender.name)}`
                                    }
                                    alt={message.sender.name}
                                  />
                                  <AvatarFallback>
                                    {message.sender.name
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          )}

                          <div
                            className={`max-w-[80%] sm:max-w-[70%] flex flex-col ${isMe ? "items-end" : "items-start"}`}
                          >
                            {/* Sender name & role badge */}
                            {!isMe && showAvatar && (
                              <span className="text-[11px] font-black text-slate-500 mb-1 ml-1 flex items-center gap-1.5">
                                {message.sender.name}
                                {message.sender.role === "instruktur" && (
                                  <span className="bg-teal-100 text-teal-600 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide border border-teal-200">
                                    Instruktur
                                  </span>
                                )}
                                {(message.sender.role === "admin" || message.sender.role === "super_admin") && (
                                  <span className="bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide border border-violet-200">
                                    {message.sender.role === "super_admin" ? "Super Admin" : "Admin"}
                                  </span>
                                )}
                              </span>
                            )}

                            {/* Bubble */}
                            <div
                              className={`
                                relative px-4 py-2.5 rounded-2xl shadow-sm border-2 text-sm md:text-base
                                ${
                                  isMe
                                    ? "bg-teal-500 border-teal-600 text-white rounded-br-sm shadow-[2px_3px_0_0_#0f766e]"
                                    : "bg-white border-slate-200 text-slate-800 rounded-bl-sm shadow-[2px_3px_0_0_#cbd5e1]"
                                }
                              `}
                            >
                              <p className="whitespace-pre-wrap leading-relaxed wrap-break-word">
                                {message.content}
                              </p>
                            </div>

                            {/* Timestamp */}
                            <div className="flex items-center gap-1 mt-0.5 px-1 opacity-60">
                              <span className="text-[10px] font-bold text-slate-500">
                                {formatTimeOnly(message.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
              </div>

              {/* Scroll-to-bottom button */}
              {showScrollBtn && (
                <button
                  onClick={() => {
                    isAtBottomRef.current = true;
                    scrollToBottom(true);
                    setShowScrollBtn(false);
                  }}
                  className="absolute bottom-4 right-4 z-10 p-2.5 bg-teal-500 text-white rounded-full shadow-lg hover:bg-teal-600 active:scale-95 transition-all animate-bounce border-2 border-teal-600"
                  title="Gulir ke bawah"
                >
                  <ChevronDown className="h-5 w-5" strokeWidth={3} />
                </button>
              )}
            </div>

            {/* ── Typing indicator ──────────────────────────────────────── */}
            {typingLabel && (
              <div className="px-4 py-1.5 bg-white border-t border-slate-100 shrink-0">
                <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  {/* Animated dots */}
                  <span className="flex gap-0.5 items-center">
                    <span
                      className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </span>
                  {typingLabel}
                </p>
              </div>
            )}

            {/* ── Input area / Monitor Mode indicator ────────────────────────────── */}
            <div className="p-3 lg:p-4 bg-white border-t-2 border-slate-100 z-20 shrink-0">
              {role === "admin" || role === "super_admin" ? (
                <div className="flex items-center justify-center p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                  <div className="flex items-center gap-3 text-slate-400">
                    <Shield className="h-5 w-5" />
                    <p className="text-sm font-bold uppercase tracking-widest">Mode Pemantauan: {role === "super_admin" ? "Super Admin" : "Admin"} tidak dapat mengirim pesan</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-end gap-2 bg-slate-50 p-2 rounded-3xl border-2 border-slate-200 focus-within:border-teal-400 focus-within:shadow-[0_0_0_2px_rgba(45,212,191,0.2)] transition-all">
                  <Textarea
                    value={messageDraft}
                    onChange={(e) => handleDraftChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Kirim pesan ke forum…"
                    className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 min-h-11 max-h-32 py-2.5 px-3 text-sm md:text-base font-medium text-slate-700 placeholder:text-slate-400 resize-none"
                    rows={1}
                    disabled={isSending}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageDraft.trim() || isSending}
                    className="p-2.5 bg-teal-500 text-white rounded-full hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_3px_0_0_#0f766e] active:translate-y-0.5 active:shadow-none transition-all shrink-0"
                  >
                    {isSending ? (
                      <Loader2 className="h-5 w-5 animate-spin" strokeWidth={3} />
                    ) : (
                      <Send className="h-5 w-5" strokeWidth={3} />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {toast && (
        <Toast
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default function GlobalForumWrapper() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-[#FDFBF7]">
          <Loading />
        </div>
      }
    >
      <GlobalForumPage />
    </Suspense>
  );
}
