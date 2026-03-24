import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  ensureFeedbackReportsTable,
  FEEDBACK_TYPES,
} from "@/lib/feedback-reports";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureFeedbackReportsTable();

    const role = session.user.role?.toLowerCase();
    const isAdmin = role === "admin" || role === "super_admin";

    const status = req.nextUrl.searchParams.get("status");
    const type = req.nextUrl.searchParams.get("type");

    let whereSql = "WHERE fr.userId = ?";
    const params: any[] = [session.user.id];

    if (isAdmin) {
      whereSql = "WHERE 1=1";
      params.length = 0;
    }

    if (status) {
      whereSql += " AND fr.status = ?";
      params.push(status);
    }

    if (type) {
      whereSql += " AND fr.type = ?";
      params.push(type);
    }

    const rows: any[] = await prisma.$queryRawUnsafe(
      `
      SELECT
        fr.id,
        fr.userId,
        fr.type,
        fr.title,
        fr.description,
        fr.screenshotUrl,
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
      ORDER BY fr.createdAt DESC
      `,
      ...params,
    );

    return NextResponse.json({
      reports: rows,
    });
  } catch (error) {
    console.error("[GET /api/feedback]", error);
    return NextResponse.json(
      { error: "Gagal mengambil laporan" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role?.toLowerCase();
    if (role !== "user") {
      return NextResponse.json(
        { error: "Hanya anggota yang dapat mengirim laporan dari halaman ini" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { type, title, description, screenshotUrl } = body;

    if (!type || !FEEDBACK_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Tipe laporan tidak valid" },
        { status: 400 },
      );
    }

    if (!title || title.trim().length < 5) {
      return NextResponse.json(
        { error: "Judul minimal 5 karakter" },
        { status: 400 },
      );
    }

    if (!description || description.trim().length < 15) {
      return NextResponse.json(
        { error: "Deskripsi minimal 15 karakter" },
        { status: 400 },
      );
    }

    if (
      screenshotUrl &&
      (typeof screenshotUrl !== "string" || screenshotUrl.length > 500)
    ) {
      return NextResponse.json(
        { error: "Format screenshot tidak valid" },
        { status: 400 },
      );
    }

    await ensureFeedbackReportsTable();

    const id = crypto.randomUUID();

    await prisma.$executeRawUnsafe(
      `
      INSERT INTO user_feedback_reports
        (id, userId, type, title, description, screenshotUrl, status, createdAt, updatedAt)
      VALUES
        (?, ?, ?, ?, ?, ?, 'open', NOW(3), NOW(3))
      `,
      id,
      session.user.id,
      type,
      title.trim(),
      description.trim(),
      screenshotUrl?.trim() || null,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Laporan berhasil dikirim",
        id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/feedback]", error);
    return NextResponse.json(
      { error: "Gagal mengirim laporan" },
      { status: 500 },
    );
  }
}
