import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { grantXp } from "@/lib/gamification";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { materialId, attendanceData, surveyData } = body;

    if (!materialId) {
      return NextResponse.json(
        { error: "Material ID is required" },
        { status: 400 },
      );
    }

    // Get user from database
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if attendance is open for this material using raw query since Prisma client generation was blocked
    const materialData = await prisma.$queryRaw<
      any[]
    >`SELECT isAttendanceOpen FROM material WHERE id = ${materialId}`;
    const isAttendanceOpen =
      materialData.length > 0
        ? materialData[0].isAttendanceOpen !== 0 &&
          materialData[0].isAttendanceOpen !== false
        : true;

    if (!isAttendanceOpen) {
      return NextResponse.json(
        {
          error: "Maaf, Absensi pada kajian ini telah ditutup oleh instruktur",
        },
        { status: 403 },
      );
    }

    // Check if user already attended
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId: user.id,
        materialId: materialId,
      },
    });

    if (existingAttendance) {
      return NextResponse.json(
        {
          message: "Already attended",
          attendedAt: existingAttendance.createdAt,
        },
        { status: 200 },
      );
    }

    // Create new attendance record with form data using raw query
    const attendanceId = `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    // Default values mapping to prevent undefined issues in SQL
    const status = attendanceData?.status || "hadir";
    const sessionName = attendanceData?.session || null;
    const date = attendanceData?.date || null;
    const time = attendanceData?.time || null;
    const location = attendanceData?.location || null;
    const notes = attendanceData?.notes || null;
    const reason = attendanceData?.reason || null;
    const instructorArrival = attendanceData?.instructorArrival || null;
    const startTime = attendanceData?.startTime || null;
    const endTime = attendanceData?.endTime || null;

    // Survey mapping
    const rating = surveyData?.rating || null;
    const clarity = surveyData?.clarity || null;
    const relevance = surveyData?.relevance || null;
    const feedback = surveyData?.feedback || null;

    const attendance = await prisma.attendance.create({
      data: {
        id: attendanceId,
        userId: user.id,
        materialId,
        status,
        session: sessionName,
        date,
        time,
        location,
        notes,
        reason,
        instructorArrival,
        startTime,
        endTime,
        rating,
        clarity,
        relevance,
        feedback,
        updatedAt: new Date(),
      },
    });

    // Ensure user is enrolled when they attend
    await prisma.courseenrollment.upsert({
      where: {
        materialId_userId: {
          materialId: materialId,
          userId: user.id,
        },
      },
      update: {},
      create: {
        id: `ce-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        materialId: materialId,
        userId: user.id,
        role: "user",
        enrolledAt: new Date(),
      },
    });

    // Grant XP for attendance (hanya role "user", ditangani oleh grantXp)
    try {
      const materialInfo = await prisma.material.findUnique({
        where: { id: materialId },
        select: { title: true },
      });
      await grantXp({
        userId: user.id,
        type: "attendance_marked",
        title: `Absensi: ${materialInfo?.title || "Kajian"}`,
        description: `Mengirimkan absensi untuk kajian "${materialInfo?.title || materialId}"`,
        metadata: { materialId, attendanceId: attendanceId },
      });
    } catch (e) {
      console.error("Gagal grant XP attendance:", e);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Attendance recorded successfully",
        attendance,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Attendance error DETAILS:", error);
    if (error instanceof Error) {
      console.error("Attendance error MESSAGE:", error.message);
      console.error("Attendance error STACK:", error.stack);
    }
    return NextResponse.json(
      {
        error: "Failed to record attendance",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const materialId = req.nextUrl.searchParams.get("materialId");
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (materialId) {
      // Check specific attendance
      const attendance = await prisma.attendance.findFirst({
        where: {
          userId: user.id,
          materialId: materialId,
        },
      });

      return NextResponse.json({
        isAttended: !!attendance,
        attendedAt: attendance?.createdAt || null,
      });
    } else {
      // Return all attendance for user (for dashboard)
      const allAttendance = await prisma.attendance.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });

      // Fetch related material titles separately (attendance has no Prisma relation to material)
      const materialIds = [...new Set(allAttendance.map((a) => a.materialId))];
      const materials = await prisma.material.findMany({
        where: { id: { in: materialIds } },
        select: { id: true, title: true },
      });
      const materialMap = new Map(materials.map((m) => [m.id, m]));

      // Map to expected dynamic format
      const formatted = allAttendance.map((att) => ({
        id: att.id,
        materialId: att.materialId,
        materialTitle: materialMap.get(att.materialId)?.title || "Kajian",
        instructorName: "TBA",
        attendedAt: att.createdAt,
        status: att.status,
      }));

      return NextResponse.json(formatted);
    }
  } catch (error) {
    console.error("Get attendance error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 },
    );
  }
}
