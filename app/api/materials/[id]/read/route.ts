import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// POST /api/materials/[id]/read — Dinonaktifkan (material_read bukan sumber XP lagi)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      alreadyRead: true,
      message: "Fitur XP membaca materi telah dinonaktifkan",
    });
  } catch (error) {
    console.error("[MATERIAL_READ] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
