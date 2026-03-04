import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
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
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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

    // Create new attendance record with form data
    const attendance = await prisma.attendance.create({
      data: {
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        userId: user.id,
        materialId: materialId,
        status: attendanceData?.status || "hadir",
        session: attendanceData?.session,
        date: attendanceData?.date,
        time: attendanceData?.time,
        location: attendanceData?.location,
        notes: attendanceData?.notes,
        reason: attendanceData?.reason,
        instructorArrival: attendanceData?.instructorArrival,
        startTime: attendanceData?.startTime,
        endTime: attendanceData?.endTime,
        rating: surveyData?.rating,
        clarity: surveyData?.clarity,
        relevance: surveyData?.relevance,
        feedback: surveyData?.feedback,
        createdAt: new Date(),
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

    return NextResponse.json(
      {
        success: true,
        message: "Attendance recorded successfully",
        attendance,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Attendance error:", error);
    return NextResponse.json(
      { error: "Failed to record attendance" },
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
    const user = await prisma.user.findUnique({
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
