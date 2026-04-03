import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { recordActivity } from "@/lib/activity";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email as string },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isPrivileged =
      user.role === "instruktur" ||
      user.role === "admin" ||
      user.role === "super_admin";

    const programs = await prisma.programs.findMany({
      include: {
        users: {
          select: { id: true, name: true, avatar: true },
        },
        material: {
          select: { 
            id: true, 
            title: true, 
            kajianOrder: true, 
            instructorId: true
          },
        },
        program_enrollments: {
          select: { id: true, userId: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const userAttendances = await prisma.attendance.findMany({
      where: { userId: user.id },
      select: { materialId: true },
    });
    const attendedMaterialIds = new Set(
      userAttendances.map((a) => a.materialId),
    );

    // Fetch all attendances and invites for materials in these programs to get attendeeEmails
    const allMaterialIds = programs.flatMap(p => p.material?.map((m: any) => m.id) || []);
    
    const allAttendances = await prisma.attendance.findMany({
      where: { materialId: { in: allMaterialIds } },
      select: { materialId: true, userId: true },
    });

    const allInvites = await prisma.materialinvite.findMany({
      where: { materialId: { in: allMaterialIds } },
      select: { materialId: true, userId: true },
    });

    const allParticipantRecords = [...allAttendances, ...allInvites];

    // Fetch user emails for those attendees
    const attendeeUserIds = Array.from(new Set(allParticipantRecords.map(a => a.userId)));
    const attendeeUsers = await prisma.users.findMany({
      where: { id: { in: attendeeUserIds } },
      select: { id: true, email: true },
    });
    const userEmailMap = new Map(attendeeUsers.map(u => [u.id, u.email]));

    // Map materialId to an array of emails
    const materialAttendeesMap: Record<string, string[]> = {};
    for (const a of allParticipantRecords) {
      if (!materialAttendeesMap[a.materialId]) {
        materialAttendeesMap[a.materialId] = [];
      }
      const email = userEmailMap.get(a.userId);
      if (email && !materialAttendeesMap[a.materialId].includes(email)) {
        materialAttendeesMap[a.materialId].push(email);
      }
    }

    const GRADE_LABEL: Record<string, string> = {
      X: "Kelas 10",
      XI: "Kelas 11",
      XII: "Kelas 12",
    };

    const CATEGORY_LABEL: Record<string, string> = {
      Wajib: "Program Wajib",
      Extra: "Program Ekstra",
      NextLevel: "Program Susulan",
      Susulan: "Program Susulan",
    };

    // Pre-compute completion status for all programs (needed for lock logic)
    const programCompletionMap = new Map<string, boolean>();
    const programResults: any[] = [];

    for (const p of programs) {
      const filteredMaterials = (p.material || []).filter((m: any) =>
        user.role === "instruktur" ? m.instructorId === user.id : true,
      );

      let isCompleted = false;
      let attendanceCount = 0;
      if (filteredMaterials.length > 0) {
        attendanceCount = filteredMaterials.filter((m: any) => attendedMaterialIds.has(m.id)).length;
      }

      const totalKajianTarget = p.totalKajian > 0 ? p.totalKajian : filteredMaterials.length;

      if (p.totalKajian > 0) {
        const hasAllMaterials = filteredMaterials.length >= p.totalKajian;
        isCompleted = hasAllMaterials && (attendanceCount >= p.totalKajian);
      } else {
        isCompleted =
          filteredMaterials.length > 0 &&
          (attendanceCount >= filteredMaterials.length);
      }

      programCompletionMap.set(p.id, isCompleted);
    }

    // Semua user bisa melihat semua program kurikulum
    const result = programs.map((p: any) => {
      const isEnrolled = p.program_enrollments?.some(
        (e: any) => e.userId === user.id,
      );

      const filteredMaterials = (p.material || []).filter((m: any) =>
        user.role === "instruktur" ? m.instructorId === user.id : true,
      );

      const isCompleted = programCompletionMap.get(p.id) || false;
      let attendanceCount = 0;
      if (filteredMaterials.length > 0) {
        attendanceCount = filteredMaterials.filter((m: any) => attendedMaterialIds.has(m.id)).length;
      }
      
      const totalKajianTarget = p.totalKajian > 0 ? p.totalKajian : filteredMaterials.length;
      let progressPercentage = 0;

      if (totalKajianTarget > 0) {
        progressPercentage = Math.round((attendanceCount / totalKajianTarget) * 100);
        progressPercentage = Math.min(progressPercentage, 100);
      }

      const progress = {
        completed: attendanceCount,
        total: totalKajianTarget,
        percentage: progressPercentage,
      };

      // Sequential lock logic: check if prerequisite stage is completed
      let isLocked = false;
      let prerequisiteProgram: string | null = null;
      if (p.stageOrder && p.stageOrder > 1 && !isPrivileged) {
        // Find the prerequisite program (same grade + category, stageOrder = current - 1)
        const prereq = programs.find(
          (other: any) =>
            other.grade === p.grade &&
            other.category === p.category &&
            other.stageOrder === p.stageOrder - 1,
        );
        if (prereq) {
          const prereqCompleted = programCompletionMap.get(prereq.id) || false;
          if (!prereqCompleted) {
            isLocked = true;
            prerequisiteProgram = prereq.title;
          }
        }
      }

      // Count how many staged programs exist in same grade+category
      const totalStages = p.stageOrder
        ? programs.filter(
            (other: any) =>
              other.grade === p.grade &&
              other.category === p.category &&
              other.stageOrder != null,
          ).length
        : 0;

      return {
        id: p.id,
        title: p.title,
        description: p.description,
        duration: p.duration || "Belum ditentukan",
        level: GRADE_LABEL[p.grade] || p.grade,
        category: CATEGORY_LABEL[p.category] || p.category,
        thumbnail: p.thumbnailUrl,
        instructor: p.users?.name || "Instruktur IRMA",
        instructorAvatar: p.users?.avatar,
        materialCount: filteredMaterials.length,
        totalKajian: p.totalKajian,
        stageOrder: p.stageOrder || null,
        totalStages,
        isLocked,
        prerequisiteProgram,
        usedKajianOrders: filteredMaterials
          .map((m: any) => m.kajianOrder)
          .filter((order: any) => order !== null && order !== undefined),
        usedKajianDetails: filteredMaterials
          .filter((m: any) => m.kajianOrder !== null && m.kajianOrder !== undefined)
          .map((m: any) => ({
            order: m.kajianOrder,
            title: m.title,
            materialId: m.id,
            attendeeEmails: materialAttendeesMap[m.id] || [],
          })),
        enrollmentCount: p.program_enrollments?.length || 0,
        isEnrolled,
        isCompleted,
        progress,
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

    if (
      session.user.role !== "instruktur" &&
      session.user.role !== "admin" &&
      session.user.role !== "super_admin"
    ) {
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
      totalKajian,
      stageOrder,
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
      "Program Next Level": "Susulan",
      "Program Susulan": "Susulan",
      NextLevel: "Susulan",
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

    const program = await prisma.programs.create({
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
        totalKajian: totalKajian ? parseInt(totalKajian, 10) : 0,
        stageOrder: stageOrder ? parseInt(stageOrder, 10) : null,
        updatedAt: new Date(),
        id: crypto.randomUUID(),
      },
    });

    // Log Activity for Admin/Superadmin
    const userRole = session.user.role?.toLowerCase();
    if (userRole === "admin" || userRole === "super_admin") {
      await recordActivity({
        userId: session.user.id,
        type: "admin_program_managed" as any,
        title: "Membuat Program Kurikulum",
        description: `Admin membuat program baru: ${program.title}`,
        metadata: { programId: program.id },
      });
    }

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
