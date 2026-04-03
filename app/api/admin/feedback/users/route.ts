import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ensureFeedbackReportsTable } from "@/lib/feedback-reports";

async function checkAdmin() {
  const session = await auth();
  const role = session?.user?.role?.toLowerCase();
  if (!session?.user?.id || (role !== "admin" && role !== "super_admin")) {
    return null;
  }
  return session;
}

export async function GET(req: NextRequest) {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureFeedbackReportsTable();

    const users: any[] = await prisma.$queryRawUnsafe(`
      SELECT DISTINCT
        fr.userId,
        u.name,
        u.email,
        u.avatar
      FROM user_feedback_reports fr
      JOIN users u ON u.id = fr.userId
      ORDER BY u.name ASC
    `);

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[GET /api/admin/feedback/users]", error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar user pelapor" },
      { status: 500 },
    );
  }
}
