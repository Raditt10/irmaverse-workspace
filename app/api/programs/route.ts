import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isPrivileged = user.role === "instruktur" || user.role === "admin";

    const programs = await prisma.program.findMany({
      include: {
        instructor: {
          select: { id: true, name: true, avatar: true },
        },
        materials: {
          select: { id: true },
        },
        enrollments: {
          select: { id: true, userId: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

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

    // For non-privileged users, only show programs they are enrolled in
    const filtered = isPrivileged
      ? programs
      : programs.filter((p) => p.enrollments.some((e) => e.userId === user.id));

    const result = filtered.map((p) => {
      const isEnrolled = p.enrollments.some((e) => e.userId === user.id);

      return {
        id: p.id,
        title: p.title,
        description: p.description,
        duration: p.duration || "Belum ditentukan",
        level: GRADE_LABEL[p.grade] || p.grade,
        category: CATEGORY_LABEL[p.category] || p.category,
        thumbnail: p.thumbnailUrl,
        instructor: p.instructor?.name || "Instruktur IRMA",
        instructorAvatar: p.instructor?.avatar,
        materialCount: p.materials.length,
        enrollmentCount: p.enrollments.length,
        isEnrolled,
        createdAt: p.createdAt,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching programs:", error);
    return NextResponse.json(
      { error: "Failed to fetch programs" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
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
        { error: "Hanya instruktur atau admin yang bisa membuat program" },
        { status: 403 },
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

    const mappedCategory = CATEGORY_MAP[category] || "Wajib";
    const mappedGrade = GRADE_MAP[grade] || "X";

    const program = await prisma.program.create({
      data: {
        title: title.trim(),
        description: description || null,
        grade: mappedGrade as any,
        category: mappedCategory as any,
        thumbnailUrl: thumbnailUrl || null,
        instructorId: session.user.id,
        duration: duration || null,
        syllabus: Array.isArray(syllabus) ? syllabus : [],
        requirements: Array.isArray(requirements) ? requirements : [],
        benefits: Array.isArray(benefits) ? benefits : [],
      },
    });

    return NextResponse.json(
      { id: program.id, message: "Program berhasil dibuat" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating program:", error);
    return NextResponse.json(
      { error: "Gagal membuat program" },
      { status: 500 },
    );
  }
}
