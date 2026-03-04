import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        instructor: {
          select: { id: true, name: true, avatar: true, email: true },
        },
        materials: {
          include: {
            users: {
              select: { name: true },
            },
            courseenrollment: {
              select: { id: true, userId: true },
            },
          },
          orderBy: { date: "asc" },
        },
        enrollments: {
          select: { id: true, userId: true, enrolledAt: true },
        },
      },
    });

    if (!program) {
      return NextResponse.json(
        { error: "Program tidak ditemukan" },
        { status: 404 },
      );
    }

    const materialIds = program.materials.map((m) => m.id);

    let userProgress = {
      completed: 0,
      total: materialIds.length,
      percentage: 0,
    };
    const isEnrolled = program.enrollments.some((e) => e.userId === user.id);

    if (materialIds.length > 0) {
      const attendanceCount = await prisma.attendance.count({
        where: {
          userId: user.id,
          materialId: { in: materialIds },
          status: "hadir",
        },
      });

      userProgress = {
        completed: attendanceCount,
        total: materialIds.length,
        percentage: Math.round((attendanceCount / materialIds.length) * 100),
      };
    }

    const GRADE_LABEL: Record<string, string> = {
      X: "Kelas 10",
      XI: "Kelas 11",
      XII: "Kelas 12",
    };

    const CATEGORY_LABEL: Record<string, string> = {
      Wajib: "Program Wajib",
      Extra: "Program Ekstra",
      NextLevel: "Program Next Level",
      Susulan: "Program Susulan",
    };

    // Per-material attendance for this user
    const userAttendance =
      materialIds.length > 0
        ? await prisma.attendance.findMany({
            where: { userId: user.id, materialId: { in: materialIds } },
            select: { materialId: true, status: true },
          })
        : [];

    const attendanceMap = new Map(
      userAttendance.map((a) => [a.materialId, a.status]),
    );

    const formattedMaterials = program.materials.map((m, idx) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      date: m.date,
      startedAt: m.startedAt,
      instructor: m.users?.name || program.instructor?.name || "TBA",
      thumbnailUrl: m.thumbnailUrl,
      order: idx + 1,
      isCompleted: attendanceMap.get(m.id) === "hadir",
      attendanceStatus: attendanceMap.get(m.id) || null,
      enrollmentCount: m.courseenrollment?.length || 0,
    }));

    const result = {
      id: program.id,
      title: program.title,
      description: program.description,
      duration: program.duration || "Belum ditentukan",
      level: GRADE_LABEL[program.grade] || program.grade,
      category: CATEGORY_LABEL[program.category] || program.category,
      image: program.thumbnailUrl,
      instructor: {
        id: program.instructor?.id,
        name: program.instructor?.name || "Instruktur IRMA",
        avatar: program.instructor?.avatar,
        email: program.instructor?.email,
      },
      syllabus: (program.syllabus as string[]) || [],
      requirements: (program.requirements as string[]) || [],
      benefits: (program.benefits as string[]) || [],
      materials: formattedMaterials,
      enrollmentCount: program.enrollments.length,
      isEnrolled,
      progress: userProgress,
      createdAt: program.createdAt,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching program detail:", error);
    return NextResponse.json(
      { error: "Gagal memuat detail program" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 },
      );
    }

    if (session.user.role !== "instruktur" && session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Hanya instruktur atau admin yang bisa mengubah program" },
        { status: 403 },
      );
    }

    const existing = await prisma.program.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Program tidak ditemukan" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      grade,
      category,
      thumbnailUrl,
      duration,
      syllabus,
      requirements,
      benefits,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Judul program wajib diisi" },
        { status: 400 },
      );
    }

    const CATEGORY_MAP: Record<string, string> = {
      "Program Wajib": "Wajib",
      Wajib: "Wajib",
      "Program Ekstra": "Extra",
      Extra: "Extra",
      "Program Next Level": "NextLevel",
      NextLevel: "NextLevel",
      Susulan: "Susulan",
    };
    const GRADE_MAP: Record<string, string> = {
      Semua: "X",
      "Kelas 10": "X",
      "Kelas 11": "XI",
      "Kelas 12": "XII",
      X: "X",
      XI: "XI",
      XII: "XII",
    };

    const updated = await prisma.program.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description || null,
        grade: (GRADE_MAP[grade] || "X") as any,
        category: (CATEGORY_MAP[category] || "Wajib") as any,
        thumbnailUrl: thumbnailUrl || null,
        duration: duration || null,
        syllabus: Array.isArray(syllabus) ? syllabus : [],
        requirements: Array.isArray(requirements) ? requirements : [],
        benefits: Array.isArray(benefits) ? benefits : [],
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating program:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui program" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 },
      );
    }
    if (session.user.role !== "instruktur" && session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Tidak memiliki akses" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const program = await prisma.program.findUnique({ where: { id } });
    if (!program) {
      return NextResponse.json(
        { error: "Program tidak ditemukan" },
        { status: 404 },
      );
    }

    // Unlink materials, then delete program (enrollments cascade)
    await prisma.material.updateMany({
      where: { programId: id },
      data: { programId: null },
    });
    await prisma.program.delete({ where: { id } });

    return NextResponse.json(
      { message: "Program berhasil dihapus" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting program:", error);
    return NextResponse.json(
      { error: "Gagal menghapus program" },
      { status: 500 },
    );
  }
}
