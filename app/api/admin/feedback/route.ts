import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  ensureFeedbackReportsTable,
  FEEDBACK_STATUSES,
  FEEDBACK_TYPES,
} from "@/lib/feedback-reports";

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

    const status = req.nextUrl.searchParams.get("status");
    const type = req.nextUrl.searchParams.get("type");
    const q = req.nextUrl.searchParams.get("q");

    let whereSql = "WHERE 1=1";
    const params: any[] = [];

    if (status && FEEDBACK_STATUSES.includes(status as any)) {
      whereSql += " AND fr.status = ?";
      params.push(status);
    }

    if (type && FEEDBACK_TYPES.includes(type as any)) {
      whereSql += " AND fr.type = ?";
      params.push(type);
    }

    if (q && q.trim()) {
      whereSql +=
        " AND (fr.title LIKE ? OR fr.description LIKE ? OR u.name LIKE ? OR u.email LIKE ?)";
      const pattern = `%${q.trim()}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    const rows: any[] = await prisma.$queryRawUnsafe(
      `
      SELECT
        fr.id,
        fr.userId,
        fr.type,
        fr.title,
        fr.description,
        fr.status,
        fr.adminNote,
        fr.createdAt,
        fr.updatedAt,
        u.name as userName,
        u.email as userEmail,
        u.role as userRole
      FROM user_feedback_reports fr
      JOIN users u ON u.id = fr.userId
      ${whereSql}
      ORDER BY
        CASE fr.status
          WHEN 'open' THEN 0
          WHEN 'in_review' THEN 1
          WHEN 'done' THEN 2
          WHEN 'rejected' THEN 3
          ELSE 4
        END,
        fr.createdAt DESC
      `,
      ...params,
    );

    return NextResponse.json({ reports: rows });
  } catch (error) {
    console.error("[GET /api/admin/feedback]", error);
    return NextResponse.json(
      { error: "Gagal mengambil laporan user" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminSession = await checkAdmin();
    if (!adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureFeedbackReportsTable();

    const body = await req.json();
    const { id, status, adminNote } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID laporan wajib diisi" },
        { status: 400 },
      );
    }

    if (!status || !FEEDBACK_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Status tidak valid. Gunakan: ${FEEDBACK_STATUSES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    await prisma.$executeRawUnsafe(
      `
      UPDATE user_feedback_reports
      SET status = ?, adminNote = ?, updatedAt = NOW(3)
      WHERE id = ?
      `,
      status,
      adminNote?.trim() || null,
      id,
    );

    return NextResponse.json({
      success: true,
      message: "Status laporan berhasil diperbarui",
    });
  } catch (error) {
    console.error("[PATCH /api/admin/feedback]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui laporan" },
      { status: 500 },
    );
  }
}
