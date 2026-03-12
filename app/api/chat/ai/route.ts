import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { CI_IRMA_SYSTEM_PROMPT } from "@/lib/ai-prompt";

// ── Gemini Client (lazy singleton) ──────────────────────────────────────────
let _ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!_ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not set");
    _ai = new GoogleGenAI({ apiKey: key });
  }
  return _ai;
}

// ── Types ───────────────────────────────────────────────────────────────────
interface ChatMessage {
  role: "user" | "model";
  content: string;
}

interface RequestBody {
  message: string;
  history?: ChatMessage[];
}

// ── POST /api/chat/ai ───────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // 1. Parse & validate
    const body: RequestBody = await request.json();
    const { message, history = [] } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Pesan tidak boleh kosong" },
        { status: 400 },
      );
    }

    // 2. Build conversation history for Gemini
    //    Convert our {role, content} to Gemini's {role, parts} format
    const geminiHistory = history.map((msg) => ({
      role: msg.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: msg.content }],
    }));

    // 3. Call Gemini
    const ai = getAI();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: [
        // Inject history
        ...geminiHistory,
        // Current user message
        { role: "user", parts: [{ text: message }] },
      ],
      config: {
        systemInstruction: CI_IRMA_SYSTEM_PROMPT,
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });

    const reply = response.text ?? "";

    if (!reply) {
      return NextResponse.json(
        { error: "Ci Irma sedang tidak bisa merespons, coba lagi ya 🤲" },
        { status: 502 },
      );
    }

    // 4. Return response
    return NextResponse.json({
      reply,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("Error in Ci Irma AI:", error);

    // Handle specific Gemini errors
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    if (errMsg.includes("API key")) {
      return NextResponse.json(
        { error: "Konfigurasi AI belum lengkap" },
        { status: 500 },
      );
    }

    if (errMsg.includes("quota") || errMsg.includes("rate")) {
      return NextResponse.json(
        {
          error:
            "Ci Irma sedang banyak yang ajak ngobrol, coba lagi nanti ya~ 😊",
        },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { error: "Maaf, terjadi kesalahan. Coba lagi ya 🤲" },
      { status: 500 },
    );
  }
}
