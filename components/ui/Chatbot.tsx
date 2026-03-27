"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Send,
  Sparkles,
  MessageCircle,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
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
const ChatbotButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const chatAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Welcome message on first open ───────────────────────────────────────
  useEffect(() => {
    if (isOpen && messages.length === 0) {
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
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, messages.length]);

  // ── Auto-scroll ─────────────────────────────────────────────────────────
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // ── Detect scroll position for "scroll down" button ─────────────────────
  const handleScroll = () => {
    const el = chatAreaRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distanceFromBottom > 100);
  };

  // ── Send message ────────────────────────────────────────────────────────
  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isTyping) return;

    // Add user message
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

    try {
      // Build history (exclude the current message)
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
    setIsOpen(true); // triggers welcome message re-creation via useEffect
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 flex flex-col items-end gap-4">
      {/* ── Chat Panel ───────────────────────────────────────────────────── */}
      {isOpen && (
        <div className="w-[calc(100vw-32px)] md:w-[420px] h-[70vh] md:h-[600px] bg-gradient-to-b from-emerald-50 to-white rounded-4xl shadow-[0_16px_0_0_rgba(0,0,0,0.2)] border-4 border-emerald-500 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 zoom-in-95 duration-300 origin-bottom-right relative">
          {/* Corner Decorations */}
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-emerald-400 rounded-full border-4 border-white shadow-lg z-20" />
          <div className="absolute -bottom-3 -left-3 w-10 h-10 bg-teal-400 rounded-full border-3 border-white shadow-md z-20" />

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="bg-linear-to-r from-emerald-400 via-teal-400 to-cyan-400 p-6 flex items-center justify-between shrink-0 border-b-4 border-emerald-600 relative overflow-hidden shadow-[0_6px_0_0_rgba(0,0,0,0.1)]">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_2px,transparent_2px)] [background-size:12px_12px]" />

            <div className="flex items-center gap-4 relative z-10">
              <div className="relative group">
                <div className="w-16 h-16 rounded-3xl border-4 border-white bg-emerald-300 overflow-hidden shadow-[6px_6px_0_0_rgba(0,0,0,0.15)] transform hover:scale-110 transition-transform">
                  <img
                    src="/ciirma.webp"
                    alt="Ci Irma"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div
                  className="absolute -bottom-2 -right-2 w-6 h-6 bg-green-400 border-4 border-white rounded-full animate-bounce shadow-lg"
                  style={{ boxShadow: "0 0 0 3px rgba(34,197,94,0.2)" }}
                />
              </div>
              <div className="text-white">
                <h3
                  className="font-black text-2xl leading-none tracking-tight text-white drop-shadow-lg"
                  style={{ textShadow: "0 4px 0 rgba(0,0,0,0.2)" }}
                >
                  Ci Irma
                </h3>
                <span className="inline-block mt-2 px-3 py-1 bg-white/30 rounded-full text-xs font-black uppercase tracking-widest border-2 border-white/60 backdrop-blur-sm">
                  🌙 Asisten Islami
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 relative z-10">
              {/* Reset button */}
              <button
                onClick={handleReset}
                title="Mulai obrolan baru"
                className="p-2 bg-emerald-600/50 rounded-xl text-white border-2 border-emerald-400/50 hover:bg-emerald-600 transition-all active:scale-95"
              >
                <RotateCcw className="w-5 h-5 stroke-[3]" />
              </button>
              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 bg-emerald-600 rounded-xl text-white border-2 border-emerald-400 hover:bg-emerald-700 hover:border-emerald-500 transition-all active:scale-95 shadow-[0_4px_0_0_rgba(0,0,0,0.1)]"
              >
                <X className="w-6 h-6 stroke-[3]" />
              </button>
            </div>
          </div>

          {/* ── Chat Area ──────────────────────────────────────────────── */}
          <div
            ref={chatAreaRef}
            onScroll={handleScroll}
            className="flex-1 p-5 overflow-y-auto flex flex-col gap-5 bg-gradient-to-b from-emerald-50 to-cyan-50 relative scroll-smooth"
          >
            <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#000_1.5px,transparent_1.5px)] [background-size:20px_20px] pointer-events-none" />

            {/* Date separator */}
            {messages.length > 0 && (
              <div className="flex justify-center">
                <span className="text-[10px] font-black text-slate-400 bg-slate-100/80 px-3 py-1.5 rounded-full border-2 border-slate-200">
                  HARI INI
                </span>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg) =>
              msg.role === "model" ? (
                /* ── Bot Message ──────────────────────────────────────── */
                <div key={msg.id} className="flex items-end gap-3 group">
                  <div className="w-12 h-12 rounded-3xl bg-white border-3 border-emerald-400 p-1 shrink-0 shadow-[4px_4px_0_0_rgba(0,0,0,0.15)] group-hover:-translate-y-2 transition-transform">
                    <img
                      src="/ciirma.webp"
                      alt="Ci Irma"
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  </div>
                  <div className="flex flex-col gap-1 max-w-[75%]">
                    <div
                      className={`bg-white p-4 rounded-4xl rounded-bl-xl border-3 shadow-[6px_6px_0_0_rgba(16,185,129,0.2)] text-slate-700 text-sm font-bold leading-relaxed ${
                        msg.status === "error"
                          ? "border-red-300 bg-red-50"
                          : "border-emerald-400"
                      }`}
                    >
                      <div className="prose prose-sm prose-emerald max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_strong]:text-emerald-700 [&_a]:text-emerald-600 [&_a]:underline">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold ml-2">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              ) : (
                /* ── User Message ─────────────────────────────────────── */
                <div key={msg.id} className="flex items-end justify-end gap-2">
                  <div className="flex flex-col gap-1 max-w-[75%] items-end">
                    <div className="bg-linear-to-br from-emerald-400 to-teal-500 p-4 rounded-4xl rounded-br-xl border-3 border-emerald-600 shadow-[6px_6px_0_0_rgba(5,150,105,0.3)] text-white text-sm font-bold leading-relaxed">
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold mr-2">
                      ✓ {formatTime(msg.timestamp)}
                    </span>
                  </div>
                </div>
              ),
            )}

            {/* ── Typing Indicator ──────────────────────────────────── */}
            {isTyping && (
              <div className="flex items-end gap-3">
                <div className="w-12 h-12 rounded-3xl bg-white border-3 border-emerald-400 p-1 shrink-0 shadow-[4px_4px_0_0_rgba(0,0,0,0.15)]">
                  <img
                    src="/ciirma.webp"
                    alt="Ci Irma"
                    className="w-full h-full object-cover rounded-2xl"
                  />
                </div>
                <div className="bg-white px-5 py-4 rounded-4xl rounded-bl-xl border-3 border-emerald-400 shadow-[6px_6px_0_0_rgba(16,185,129,0.2)] w-fit">
                  <div className="flex gap-2 items-center">
                    <span className="w-3 h-3 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s] border-2 border-emerald-500" />
                    <span className="w-3 h-3 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s] border-2 border-emerald-500" />
                    <span className="w-3 h-3 bg-emerald-400 rounded-full animate-bounce border-2 border-emerald-500" />
                    <span className="ml-2 text-xs text-slate-400 font-bold">
                      Ci Irma sedang mengetik...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── Scroll-to-bottom button ──────────────────────────────── */}
          {showScrollBtn && (
            <button
              onClick={() => scrollToBottom()}
              className="absolute bottom-36 right-6 z-30 p-2 bg-white border-3 border-emerald-400 rounded-full shadow-lg hover:bg-emerald-50 transition-all active:scale-90"
            >
              <ChevronDown className="w-5 h-5 text-emerald-600 stroke-[3]" />
            </button>
          )}

          {/* ── Input Area ───────────────────────────────────────────── */}
          <div className="p-5 bg-white border-t-4 border-emerald-200">
            {/* Quick Suggestions */}
            {messages.length <= 1 && (
              <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                {QUICK_SUGGESTIONS.map((text) => (
                  <button
                    key={text}
                    onClick={() => sendMessage(text)}
                    disabled={isTyping}
                    className="shrink-0 whitespace-nowrap px-5 py-2.5 bg-white border-3 border-emerald-300 rounded-full text-xs font-black text-emerald-700 hover:bg-emerald-100 hover:border-emerald-500 hover:text-emerald-800 hover:shadow-[4px_4px_0_0_rgba(16,185,129,0.3)] active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {text}
                  </button>
                ))}
              </div>
            )}

            {/* Input Field */}
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-50 p-2 rounded-3xl border-3 border-slate-200 focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100 transition-all flex items-center shadow-[2px_2px_0_0_rgba(0,0,0,0.05)]">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isTyping ? "Ci Irma sedang menjawab..." : "Ketik pesan..."
                  }
                  disabled={isTyping}
                  className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-700 placeholder:text-slate-400 placeholder:font-bold px-4 py-2.5 disabled:cursor-not-allowed"
                />
              </div>

              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isTyping}
                className="p-3.5 bg-linear-to-br from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white rounded-3xl shadow-[0_6px_0_0_#047857] active:translate-y-1 active:shadow-none transition-all border-3 border-emerald-600 flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:shadow-[0_6px_0_0_#047857]"
              >
                <Send className="w-5 h-5 stroke-[3] group-hover:-rotate-12 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Toggle Button ─────────────────────────────────────────── */}
      <div className="group relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            relative h-16 w-16 md:h-20 md:w-20 rounded-3xl flex items-center justify-center transition-all duration-300
            border-4 
            ${
              isOpen
                ? "bg-slate-100 border-slate-300 rotate-12 shadow-[0_0_0_0_rgba(0,0,0,0)] translate-y-2"
                : "bg-gradient-to-br from-emerald-400 to-teal-500 border-white hover:scale-105 shadow-[0_8px_0_0_rgba(0,0,0,0.15)] hover:shadow-[0_12px_0_0_rgba(0,0,0,0.15)] hover:-translate-y-1"
            }
          `}
        >
          {isOpen ? (
            <X className="w-8 h-8 text-slate-400 stroke-[3]" />
          ) : (
            <>
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl overflow-hidden border-2 border-white/30">
                <img
                  src="/ciirma.webp"
                  alt="Ci Irma"
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Sparkle Decoration */}
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-400 rounded-full border-4 border-white shadow-sm flex items-center justify-center animate-bounce">
                <Sparkles className="w-4 h-4 text-emerald-700 fill-emerald-700" />
              </div>
            </>
          )}
        </button>

        {/* Tooltip */}
        {!isOpen && (
          <div className="hidden md:block absolute bottom-full right-0 mb-4 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none origin-bottom-right group-hover:-translate-y-2">
            <div className="relative bg-white text-slate-800 px-5 py-3 rounded-2xl border-4 border-emerald-500 shadow-[4px_4px_0_0_rgba(0,0,0,0.1)]">
              <p className="text-sm font-black whitespace-nowrap flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-500 fill-emerald-100" />
                Chat Ci Irma yuk! 🌙
              </p>
              <div className="absolute -bottom-3 right-8 w-5 h-5 bg-white border-r-4 border-b-4 border-emerald-500 rotate-45" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatbotButton;
