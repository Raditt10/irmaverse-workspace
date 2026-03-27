"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Sparkles,
  RotateCcw,
  ChevronDown,
  Bot,
  User,
  Zap,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/ui/Sidebar";
import DashboardHeader from "@/components/ui/Header";
import { QUICK_SUGGESTIONS, WELCOME_MESSAGE } from "@/lib/ai-prompt";

// ── Types ───────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: Date;
  status?: "sending" | "sent" | "error";
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Component ───────────────────────────────────────────────────────────────
export default function AIAssistantPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      if (typeof window !== "undefined") {
        window.location.href = "/auth";
      }
    },
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const chatAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Welcome message on mount ──────────────────────────────────────────
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: generateId(),
          role: "model",
          content: WELCOME_MESSAGE,
          timestamp: new Date(),
          status: "sent",
        },
      ]);
    }
  }, [messages.length]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── Auto-scroll ─────────────────────────────────────────────────────────
  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      bottomRef.current?.scrollIntoView({ behavior });
    },
    []
  );

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // ── Detect scroll position ────────────────────────────────────────────
  const handleScroll = () => {
    const el = chatAreaRef.current;
    if (!el) return;
    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distanceFromBottom > 100);
  };

  // ── Send message ────────────────────────────────────────────────────────
  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isTyping) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content,
      timestamp: new Date(),
      status: "sent",
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    try {
      const history = messages
        .filter((m) => m.status !== "error")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mendapatkan respons");
      }

      const botMsg: ChatMessage = {
        id: generateId(),
        role: "model",
        content: data.reply,
        timestamp: new Date(data.timestamp),
        status: "sent",
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: unknown) {
      const errorText =
        err instanceof Error
          ? err.message
          : "Maaf, terjadi kesalahan. Coba lagi ya 🤲";

      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "model",
          content: errorText,
          timestamp: new Date(),
          status: "error",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleReset = () => {
    setMessages([]);
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  if (status === "loading") return null;

  const userName = session?.user?.name?.split(" ")[0] || "User";

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 flex flex-col h-[calc(100vh-5rem)] max-w-[1600px] mx-auto w-full">
          {/* ── Page Header ──────────────────────────────────────────── */}
          <div className="shrink-0 px-4 md:px-6 lg:px-8 py-4 md:py-5 border-b-2 border-slate-100 bg-white/80 backdrop-blur-sm z-10 relative shadow-[0_4px_10px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 md:gap-4">
                  <div className="relative">
                  <div className="w-11 h-11 md:w-12 md:h-12 rounded-full overflow-hidden flex items-center justify-center shadow-[0_4px_0_0_rgba(0,0,0,0.15)] border-3 border-emerald-400 bg-white">
                    <img src="/ci_irma.webp" alt="Ci Irma" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 border-2 border-white rounded-full animate-pulse" />
                </div>
                <div>
                  <h1 className="text-lg md:text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    Ci Irma
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                      <Sparkles className="w-3 h-3" />
                      AI Assistant
                    </span>
                  </h1>
                  <p className="text-xs md:text-sm text-slate-400 font-bold">
                    Asisten Islami cerdas untuk membantumu
                  </p>
                </div>
              </div>

              <button
                onClick={handleReset}
                title="Mulai obrolan baru"
                className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-white border-2 border-slate-200 rounded-xl text-slate-500 hover:border-emerald-400 hover:text-emerald-600 hover:shadow-[3px_3px_0_0_#34d399] active:translate-y-0.5 active:shadow-none transition-all text-xs md:text-sm font-bold"
              >
                <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden md:inline">Obrolan Baru</span>
              </button>
            </div>
          </div>

          {/* ── Chat Area ────────────────────────────────────────────── */}
          <div className="flex-1 overflow-hidden relative">
            <div
              ref={chatAreaRef}
              onScroll={handleScroll}
              className="absolute inset-0 overflow-y-auto px-4 md:px-6 lg:px-8 py-6 space-y-6 scroll-smooth bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50"
            >
              {/* Date separator */}
              {messages.length > 0 && (
                <div className="flex justify-center">
                  <span className="text-[10px] font-black text-slate-400 bg-white px-4 py-1.5 rounded-full border-2 border-slate-100 shadow-sm">
                    HARI INI
                  </span>
                </div>
              )}

              {/* Messages */}
              {messages.map((msg) =>
                msg.role === "model" ? (
                  /* ── AI Message ───────────────────────────────────────── */
                  <div
                    key={msg.id}
                    className="flex items-start gap-3 md:gap-4 group max-w-3xl"
                  >
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-emerald-400 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform bg-white">
                      <img src="/ci_irma.webp" alt="Ci Irma" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-600">
                          Ci Irma
                        </span>
                        <span className="text-[10px] text-slate-300 font-bold">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                      <div
                        className={`p-4 md:p-5 rounded-2xl rounded-tl-md text-sm font-medium leading-relaxed ${
                          msg.status === "error"
                            ? "bg-red-50 border-2 border-red-200 text-red-700"
                            : "bg-white border-2 border-slate-100 text-slate-700 shadow-[0_2px_0_0_#f1f5f9]"
                        }`}
                      >
                        <div className="prose prose-sm prose-emerald max-w-none [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_strong]:text-emerald-700 [&_a]:text-emerald-600 [&_a]:underline [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_blockquote]:border-l-emerald-400 [&_blockquote]:bg-emerald-50/50 [&_blockquote]:py-0.5 [&_blockquote]:px-3">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── User Message ──────────────────────────────────────── */
                  <div
                    key={msg.id}
                    className="flex items-start gap-3 md:gap-4 justify-end group max-w-3xl ml-auto"
                  >
                    <div className="flex flex-col gap-1.5 items-end flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-300 font-bold">
                          {formatTime(msg.timestamp)}
                        </span>
                        <span className="text-xs font-black text-slate-600">
                          {userName}
                        </span>
                      </div>
                      <div className="bg-linear-to-br from-emerald-500 to-teal-600 p-4 md:p-5 rounded-2xl rounded-tr-md text-white text-sm font-medium leading-relaxed shadow-[0_2px_0_0_#047857] border border-emerald-600">
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0 shadow-sm border border-emerald-300/50 group-hover:scale-105 transition-transform">
                      <User className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                  </div>
                )
              )}

              {/* ── Typing Indicator ──────────────────────────────────── */}
              {isTyping && (
                <div className="flex items-start gap-3 md:gap-4 max-w-3xl">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-emerald-400 flex items-center justify-center shrink-0 shadow-sm bg-white">
                    <img src="/ci_irma.webp" alt="Ci Irma" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-black text-slate-600">
                      Ci Irma
                    </span>
                    <div className="bg-white px-5 py-4 rounded-2xl rounded-tl-md border-2 border-slate-100 shadow-[0_2px_0_0_#f1f5f9] w-fit">
                      <div className="flex gap-1.5 items-center">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" />
                        <span className="ml-2 text-xs text-slate-400 font-bold">
                          Ci Irma sedang mengetik...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* ── Scroll-to-bottom button ────────────────────────────── */}
            {showScrollBtn && (
              <div className="absolute bottom-6 right-8 z-30">
                <button
                  onClick={() => scrollToBottom()}
                  className="p-2.5 bg-white border-2 border-slate-200 rounded-full shadow-lg hover:border-emerald-400 hover:shadow-[0_4px_12px_rgba(16,185,129,0.15)] transition-all active:scale-90"
                >
                  <ChevronDown className="w-5 h-5 text-slate-500 stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>

          {/* ── Input Area ───────────────────────────────────────────── */}
          <div className="shrink-0 px-4 md:px-6 lg:px-8 py-4 md:py-5 border-t-2 border-slate-100 bg-white/95 backdrop-blur-xl z-20 relative drop-shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
            {/* Quick Suggestions */}
            {messages.length <= 1 && (
              <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide max-w-3xl mx-auto">
                {QUICK_SUGGESTIONS.map((text) => (
                  <button
                    key={text}
                    onClick={() => sendMessage(text)}
                    disabled={isTyping}
                    className="shrink-0 whitespace-nowrap px-4 py-2 bg-white border-2 border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 hover:shadow-[3px_3px_0_0_rgba(16,185,129,0.2)] active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {text}
                  </button>
                ))}
              </div>
            )}

            {/* Input Field */}
            <div className="flex items-end gap-3 max-w-3xl mx-auto">
              <div className="flex-1 bg-white p-1.5 rounded-2xl border-2 border-slate-200 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-50 transition-all flex items-end shadow-[0_2px_0_0_#f1f5f9]">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isTyping ? "Ci Irma sedang mengetik..." : "Ketik pesan..."
                  }
                  disabled={isTyping}
                  rows={1}
                  className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-medium px-3 py-2.5 disabled:cursor-not-allowed resize-none max-h-30"
                />
              </div>

              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isTyping}
                className="p-3.5 bg-linear-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl shadow-[0_4px_0_0_#047857] active:translate-y-1 active:shadow-none transition-all border border-emerald-600 flex items-center justify-center group disabled:opacity-40 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:shadow-[0_4px_0_0_#047857]"
              >
                <Send className="w-5 h-5 stroke-[2.5] group-hover:-rotate-12 transition-transform" />
              </button>
            </div>

            <p className="text-center text-[10px] text-slate-300 font-medium mt-3 max-w-3xl mx-auto">
              Powered by Google Gemini AI • Respons bisa saja tidak akurat
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
