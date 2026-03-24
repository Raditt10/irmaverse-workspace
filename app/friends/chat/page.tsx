"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";
import BackButton from "@/components/ui/BackButton";
import Loading from "@/components/ui/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSocket } from "@/lib/socket";
import { isImageFile } from "@/lib/chat-utils";
import {
  ArrowLeft,
  MessageCircle,
  Send,
  Search,
  UserPlus,
  Users,
  Paperclip,
  X,
} from "lucide-react";

type MutualUser = {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  lastSeen: string;
  level: number;
};

type Conversation = {
  id: string;
  otherUser: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
    lastSeen: string;
  } | null;
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    createdAt: string;
    isRead: boolean;
  } | null;
  unreadCount: number;
  updatedAt: string;
};

type Message = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  sender: {
    id: string;
    name: string;
    avatar?: string | null;
  };
};

function FriendsChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const {
    socket,
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    typingUsers,
    onlineUsers,
  } = useSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [mutualUsers, setMutualUsers] = useState<MutualUser[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState("");
  const [newChatSearch, setNewChatSearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<File | null>(
    null,
  );
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  const messagesRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const role = (session?.user as any)?.role;

  const safeReadJson = useCallback(async (res: Response) => {
    const contentType = res.headers.get("content-type") || "";
    const raw = await res.text();

    if (contentType.includes("application/json")) {
      try {
        return raw ? JSON.parse(raw) : null;
      } catch {
        throw new Error("Respons server tidak valid (JSON rusak)");
      }
    }

    // Prevent client crash on HTML error pages (e.g. 500/502/lock page)
    const short = raw.slice(0, 120).replace(/\s+/g, " ").trim();
    throw new Error(
      `Respons server bukan JSON (${res.status}). ${short || "Tidak ada detail."}`,
    );
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.replace("/auth");
      return;
    }
    if (role !== "user") {
      router.replace("/overview");
    }
  }, [session, status, role, router]);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/users/conversations");
      if (!res.ok) return;
      const data = await safeReadJson(res);
      setConversations(data || []);
    } catch (error) {
      console.error("Error fetching user conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [safeReadJson]);

  const fetchMutualUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (newChatSearch.trim()) params.set("search", newChatSearch.trim());
      const res = await fetch(`/api/chat/users/mutuals?${params.toString()}`);
      if (!res.ok) return;
      const data = await safeReadJson(res);
      setMutualUsers(data || []);
    } catch (error) {
      console.error("Error fetching mutual users:", error);
    }
  }, [newChatSearch, safeReadJson]);

  const fetchMessages = useCallback(
    async (conversationId: string) => {
      setMessagesLoading(true);
      try {
        const res = await fetch(
          `/api/chat/users/conversations/${conversationId}/messages`,
        );
        if (!res.ok) return;
        const data = await safeReadJson(res);
        setMessages(data.messages || []);
      } catch (error) {
        console.error("Error fetching user messages:", error);
      } finally {
        setMessagesLoading(false);
      }
    },
    [safeReadJson],
  );

  const startConversationWith = useCallback(
    async (otherUserId: string) => {
      try {
        const res = await fetch("/api/chat/users/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ otherUserId }),
        });
        const data = await safeReadJson(res);
        if (!res.ok) {
          alert(data.error || "Gagal memulai chat");
          return;
        }
        await fetchConversations();
        setSelectedConversationId(data.id);
        setShowNewChat(false);
        if (window.innerWidth < 1024) setIsMobileChatOpen(true);
      } catch (error) {
        console.error("Error creating user conversation:", error);
        alert("Gagal memulai percakapan. Silakan coba lagi.");
      }
    },
    [fetchConversations, safeReadJson],
  );

  useEffect(() => {
    if (!session?.user?.id) return;
    fetchConversations();
    fetchMutualUsers();
  }, [session?.user?.id, fetchConversations, fetchMutualUsers]);

  useEffect(() => {
    if (!showNewChat) return;
    fetchMutualUsers();
  }, [showNewChat, fetchMutualUsers]);

  useEffect(() => {
    const targetUserId = searchParams.get("userId");
    if (!targetUserId || loading) return;

    const existing = conversations.find(
      (c) => c.otherUser?.id === targetUserId,
    );
    if (existing) {
      setSelectedConversationId(existing.id);
      if (window.innerWidth < 1024) setIsMobileChatOpen(true);
      return;
    }

    startConversationWith(targetUserId);
  }, [searchParams, conversations, startConversationWith, loading]);

  useEffect(() => {
    if (!selectedConversationId) return;
    joinConversation(selectedConversationId);
    fetchMessages(selectedConversationId);
    return () => leaveConversation(selectedConversationId);
  }, [
    selectedConversationId,
    joinConversation,
    leaveConversation,
    fetchMessages,
  ]);

  useEffect(() => {
    if (!socket) return;

    const onReceive = (data: any) => {
      if (data.senderId === session?.user?.id) return;

      // Always refresh conversation list so last message preview + unread badge
      // update in realtime, even when opening another conversation.
      fetchConversations();

      // Only refresh current message pane if incoming message belongs
      // to the active conversation.
      if (
        selectedConversationId &&
        data.conversationId === selectedConversationId
      ) {
        fetchMessages(selectedConversationId);
      }
    };

    socket.on("message:receive", onReceive);

    return () => {
      socket.off("message:receive", onReceive);
    };
  }, [
    socket,
    selectedConversationId,
    session?.user?.id,
    fetchMessages,
    fetchConversations,
  ]);

  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) || null,
    [conversations, selectedConversationId],
  );

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) => {
      const name = c.otherUser?.name?.toLowerCase() || "";
      const email = c.otherUser?.email?.toLowerCase() || "";
      return name.includes(q) || email.includes(q);
    });
  }, [conversations, search]);

  const currentTypers = useMemo(() => {
    if (!selectedConversationId) return [];
    return (typingUsers.get(selectedConversationId) || []).filter(
      (t) => t.userId !== session?.user?.id,
    );
  }, [typingUsers, selectedConversationId, session?.user?.id]);

  const onDraftChange = (value: string) => {
    setDraft(value);
    if (!selectedConversationId) return;

    startTyping(selectedConversationId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(selectedConversationId);
    }, 1200);
  };

  const handlePickAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Ukuran file maksimal 10MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedAttachment(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearAttachment = () => {
    setSelectedAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSend = async () => {
    if (!selectedConversationId || sending || uploadingAttachment) return;
    if (!draft.trim() && !selectedAttachment) return;

    const content = draft.trim();
    setSending(true);
    try {
      let attachmentUrl: string | undefined;
      let attachmentType: string | undefined;

      if (selectedAttachment) {
        setUploadingAttachment(true);
        const formData = new FormData();
        formData.append("file", selectedAttachment);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await safeReadJson(uploadRes);
        if (!uploadRes.ok) {
          alert(uploadData.error || "Gagal upload attachment");
          return;
        }
        attachmentUrl = uploadData.url;
        attachmentType = isImageFile(selectedAttachment.name)
          ? "image"
          : "file";
      }

      const res = await fetch(
        `/api/chat/users/conversations/${selectedConversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            attachmentUrl,
            attachmentType,
          }),
        },
      );
      const data = await safeReadJson(res);
      if (!res.ok) {
        alert(data.error || "Gagal mengirim pesan");
        return;
      }

      setMessages((prev) => [...prev, data]);
      setDraft("");
      setSelectedAttachment(null);
      stopTyping(selectedConversationId);

      if (selectedConversation?.otherUser?.id && session?.user?.id) {
        sendMessage({
          conversationId: selectedConversationId,
          senderId: session.user.id,
          recipientId: selectedConversation.otherUser.id,
          content: content || "[attachment]",
          senderName: session.user.name || "User",
        });
      }

      fetchConversations();
    } catch (error) {
      console.error("Error sending user message:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengirim pesan.",
      );
    } finally {
      setSending(false);
      setUploadingAttachment(false);
    }
  };

  if (status === "loading" || loading) {
    return <Loading fullScreen text="Memuat chat teman..." />;
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />

        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <BackButton onClick={() => router.push("/friends")} />
              <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <MessageCircle className="h-6 w-6 text-emerald-500" />
                Chat Teman
              </h1>
            </div>
            <button
              onClick={() => setShowNewChat(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-black border-2 border-emerald-600 shadow-[0_4px_0_0_#059669] hover:translate-y-0.5 transition-all flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" /> Chat Baru
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <section
              className={`bg-white rounded-3xl border-2 border-slate-200 shadow-[0_6px_0_0_#e2e8f0] p-4 lg:col-span-1 ${isMobileChatOpen ? "hidden lg:block" : "block"}`}
            >
              <div className="relative mb-3">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari teman..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-700 focus:border-emerald-400 outline-none"
                />
              </div>

              <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 font-bold text-sm">
                    Belum ada percakapan.
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const active = conv.id === selectedConversationId;
                    const isOnline = conv.otherUser?.id
                      ? onlineUsers.has(conv.otherUser.id)
                      : false;
                    return (
                      <button
                        key={conv.id}
                        onClick={() => {
                          setSelectedConversationId(conv.id);
                          setIsMobileChatOpen(true);
                        }}
                        className={`w-full text-left p-3 rounded-2xl border-2 transition-all ${
                          active
                            ? "bg-emerald-50 border-emerald-300"
                            : "bg-white border-slate-200 hover:border-emerald-200"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={conv.otherUser?.avatar || undefined}
                                alt={conv.otherUser?.name || "User"}
                              />
                              <AvatarFallback className="bg-emerald-500 text-white font-black">
                                {(conv.otherUser?.name || "U")
                                  .slice(0, 1)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${isOnline ? "bg-emerald-500" : "bg-slate-300"}`}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-black text-slate-800 truncate text-sm">
                              {conv.otherUser?.name || "Pengguna"}
                            </p>
                            <p className="text-xs text-slate-500 truncate font-medium">
                              {conv.lastMessage?.content || "Belum ada pesan"}
                            </p>
                          </div>
                          {conv.unreadCount > 0 && (
                            <span className="h-5 min-w-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </section>

            <section
              className={`bg-white rounded-3xl border-2 border-slate-200 shadow-[0_6px_0_0_#e2e8f0] p-4 lg:col-span-2 ${!isMobileChatOpen ? "hidden lg:flex" : "flex"} flex-col h-[75vh]`}
            >
              {!selectedConversation ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                  <Users className="h-12 w-12 mb-2" />
                  <p className="font-black">
                    Pilih percakapan untuk memulai chat.
                  </p>
                </div>
              ) : (
                <>
                  <div className="pb-3 mb-3 border-b-2 border-slate-100 flex items-center gap-3">
                    <button
                      onClick={() => setIsMobileChatOpen(false)}
                      className="lg:hidden p-2 rounded-lg border-2 border-slate-200"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={
                          selectedConversation.otherUser?.avatar || undefined
                        }
                        alt={selectedConversation.otherUser?.name || "User"}
                      />
                      <AvatarFallback className="bg-emerald-500 text-white font-black">
                        {(selectedConversation.otherUser?.name || "U")
                          .slice(0, 1)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-black text-slate-800 text-sm">
                        {selectedConversation.otherUser?.name || "Pengguna"}
                      </p>
                      <p className="text-xs font-bold text-slate-500">
                        {selectedConversation.otherUser?.id &&
                        onlineUsers.has(selectedConversation.otherUser.id)
                          ? "Online"
                          : "Offline"}
                      </p>
                    </div>
                  </div>

                  <div
                    ref={messagesRef}
                    className="flex-1 overflow-y-auto space-y-2 pr-1"
                  >
                    {messagesLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <Loading text="Memuat pesan..." />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-400 font-bold text-sm">
                        Belum ada pesan. Sapa temanmu dulu 👋
                      </div>
                    ) : (
                      messages.map((m) => {
                        const mine = m.senderId === session?.user?.id;
                        return (
                          <div
                            key={m.id}
                            className={`flex ${mine ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] px-3 py-2 rounded-2xl border-2 text-sm ${mine ? "bg-emerald-500 text-white border-emerald-600" : "bg-slate-50 text-slate-700 border-slate-200"}`}
                            >
                              {m.isDeleted ? (
                                <p className="whitespace-pre-wrap break-words">
                                  Pesan dihapus
                                </p>
                              ) : (
                                <>
                                  {m.attachmentUrl && (
                                    <div className="mb-2">
                                      {m.attachmentType === "image" ? (
                                        <a
                                          href={m.attachmentUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                        >
                                          <img
                                            src={m.attachmentUrl}
                                            alt="Attachment"
                                            className="max-h-64 rounded-xl border border-black/10"
                                          />
                                        </a>
                                      ) : (
                                        <a
                                          href={m.attachmentUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className={`underline font-bold ${mine ? "text-emerald-100" : "text-emerald-700"}`}
                                        >
                                          Buka attachment
                                        </a>
                                      )}
                                    </div>
                                  )}
                                  {m.content && (
                                    <p className="whitespace-pre-wrap break-words">
                                      {m.content}
                                    </p>
                                  )}
                                </>
                              )}
                              <p
                                className={`text-[10px] mt-1 font-bold ${mine ? "text-emerald-100" : "text-slate-400"}`}
                              >
                                {new Date(m.createdAt).toLocaleTimeString(
                                  "id-ID",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {currentTypers.length > 0 && (
                    <p className="text-xs text-slate-500 font-bold mt-2">
                      {currentTypers[0].userName} sedang mengetik...
                    </p>
                  )}

                  {selectedAttachment && (
                    <div className="mt-2 rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-700 truncate">
                          Attachment: {selectedAttachment.name}
                        </p>
                        <p className="text-[11px] font-bold text-slate-500">
                          {(selectedAttachment.size / 1024 / 1024).toFixed(2)}{" "}
                          MB
                        </p>
                      </div>
                      <button
                        onClick={clearAttachment}
                        className="p-1.5 rounded-lg border-2 border-rose-200 text-rose-600 hover:bg-rose-50"
                        type="button"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="pt-3 mt-3 border-t-2 border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-black hover:bg-slate-100"
                      title="Upload attachment"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                      onChange={handlePickAttachment}
                    />
                    <textarea
                      value={draft}
                      onChange={(e) => onDraftChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          onSend();
                        }
                      }}
                      rows={1}
                      placeholder="Tulis pesan..."
                      className="flex-1 resize-none rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 focus:border-emerald-400 outline-none"
                    />
                    <button
                      onClick={onSend}
                      disabled={
                        sending ||
                        uploadingAttachment ||
                        (!draft.trim() && !selectedAttachment)
                      }
                      className="px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-black border-2 border-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {uploadingAttachment ? "Upload..." : "Kirim"}
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>
        </main>
      </div>

      {showNewChat && (
        <div className="fixed inset-0 bg-black/35 z-[70] flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white border-2 border-slate-200 shadow-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-slate-800">Mulai Chat Baru</h3>
              <button
                onClick={() => setShowNewChat(false)}
                className="px-3 py-1 rounded-lg border-2 border-slate-200 font-bold text-sm"
              >
                Tutup
              </button>
            </div>
            <input
              value={newChatSearch}
              onChange={(e) => setNewChatSearch(e.target.value)}
              placeholder="Cari teman mutual..."
              className="w-full mb-3 rounded-xl border-2 border-slate-200 px-3 py-2 text-sm font-medium outline-none focus:border-emerald-400"
            />

            <div className="max-h-72 overflow-y-auto space-y-2">
              {mutualUsers.length === 0 ? (
                <div className="text-center py-8 text-slate-400 font-bold text-sm">
                  Belum ada teman mutual.
                </div>
              ) : (
                mutualUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => startConversationWith(u.id)}
                    className="w-full p-3 rounded-xl border-2 border-slate-200 hover:border-emerald-300 transition-all flex items-center gap-3"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={u.avatar || undefined}
                        alt={u.name || "User"}
                      />
                      <AvatarFallback className="bg-emerald-500 text-white font-black">
                        {(u.name || "U").slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left min-w-0">
                      <p className="font-black text-slate-800 text-sm truncate">
                        {u.name || "Pengguna"}
                      </p>
                      <p className="text-xs font-medium text-slate-500 truncate">
                        {u.email}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FriendsChatPage() {
  return (
    <Suspense fallback={<Loading fullScreen text="Memuat chat teman..." />}>
      <FriendsChatPageContent />
    </Suspense>
  );
}
