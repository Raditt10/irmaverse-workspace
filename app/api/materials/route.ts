import prisma from "@/lib/prisma";
import { MaterialCategory, MaterialGrade, Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { NextResponse, NextRequest } from "next/server";
import { createBulkNotifications } from "@/lib/notifications";
import { emitNotificationsToUsers } from "@/lib/socket-emit";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const searchParams = req.nextUrl.searchParams;

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.email) {
      console.error("[GET /api/materials] Session user has no email");
      return NextResponse.json({ error: "Invalid session: email missing" }, { status: 400 });
    }

    // Check if user exists (using email for higher reliability with session)
    const User = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!User) {
      console.log("[GET /api/materials] User not found in database for email:", session.user.email);
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    console.log("[GET /api/materials] User role:", User.role, "ID:", User.id);

    const where: any = {};
    const categoryQuery = searchParams.get("category");
    const categories = (Prisma as any).material_category || {};
    if (
      categoryQuery &&
      Object.values(categories).includes(categoryQuery as any)
    ) {
      where.category = categoryQuery as any;
    }

    // If user is not instructor/admin, only show materials where they are enrolled or invited
    // Normalizing role check to include both 'instruktur' and 'instructor'
    const isPrivileged = User.role === "instruktur" || User.role === "admin";

    if (!isPrivileged) {
      where.OR = [
        {
          courseenrollment: {
            some: { userId: User.id },
          },
        },
        {
          materialinvite: {
            some: {
              userId: User.id,
              status: "accepted",
            },
          },
        },
      ];
    }

    console.log("[GET /api/materials] isPrivileged:", isPrivileged);

    const CATEGORY_LABEL: Record<MaterialCategory, string> = {
      Wajib: "Program Wajib",
      Extra: "Program Ekstra",
      NextLevel: "Program Next Level",
      Susulan: "Program Susulan",
    };

    const GRADE_LABEL: Record<MaterialGrade, string> = {
      X: "Kelas 10",
      XI: "Kelas 11",
      XII: "Kelas 12",
    };

    const materials = await prisma.material.findMany({
      where,
      include: {
        users: {
          select: {
            name: true,
          },
        },
        courseenrollment: {
          where: { userId: User.id },
          select: { id: true },
        },
        materialinvite: {
          where: { userId: User.id },
          select: { status: true },
        },
        program: {
          select: { id: true, title: true },
        },
      },
      orderBy: { date: "desc" },
    });

    // normalize ke format frontend
    const result = materials.map((m: any) => {
      const hasEnrollment = (m.courseenrollment || []).length > 0;
      // Only treat as joined if invite is accepted (not pending/rejected)
      const hasAcceptedInvite = (m.materialinvite || []).some(
        (inv: any) => inv.status === "accepted",
      );
      const isJoined = hasEnrollment || hasAcceptedInvite;

      return {
        id: m.id,
        title: m.title,
        description: m.description,
        date: m.date,
        instructor: m.users?.name || "TBA",
        category: CATEGORY_LABEL[m.category as keyof typeof CATEGORY_LABEL] || m.category,
        grade: GRADE_LABEL[m.grade as keyof typeof GRADE_LABEL] || m.grade,
        startedAt: m.startedAt,
        thumbnailUrl: m.thumbnailUrl,
        createdAt: m.createdAt,
        isJoined: isJoined,
        program: m.program
          ? { id: m.program.id, title: m.program.title }
          : null,
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching materials:", error);
    
    // Check for database connection errors specifically
    if (error?.message?.includes("Can't connect to MySQL server") || error?.code === 'P2002' || error?.code === 'P2021') {
      return NextResponse.json(
        { error: "Database connection failed. Please ensure Laragon/MySQL is running." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch materials",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Tidak terautentikasi" },
        { status: 401 },
      );
    }

    // Check if user is instructor or admin
    if (session.user.role !== "instruktur" && session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Hanya instruktur atau admin yang bisa membuat kajian" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      date,
      time,
      category,
      grade,
      thumbnailUrl,
      invites,
      programId,
      materialType,
      materialContent,
      materialLink,
    } = body;

    // Detailed validation
    if (!title || !title.toString().trim()) {
      return NextResponse.json(
        { error: "Judul kajian harus diisi" },
        { status: 400 },
      );
    }
    if (title.toString().trim().length < 3) {
      return NextResponse.json(
        { error: "Judul kajian minimal 3 karakter" },
        { status: 400 },
      );
    }
    if (!description || !description.toString().trim()) {
      return NextResponse.json(
        { error: "Deskripsi kajian harus diisi" },
        { status: 400 },
      );
    }
    if (description.toString().trim().length < 10) {
      return NextResponse.json(
        { error: "Deskripsi kajian minimal 10 karakter" },
        { status: 400 },
      );
    }
    if (!date) {
      return NextResponse.json(
        { error: "Tanggal kajian harus dipilih" },
        { status: 400 },
      );
    }
    if (!time) {
      return NextResponse.json(
        { error: "Jam kajian harus dipilih" },
        { status: 400 },
      );
    }

    // Validate minimum 1 invited member
    if (!invites || !Array.isArray(invites) || invites.length === 0) {
      return NextResponse.json(
        { error: "Minimal 1 anggota harus diundang ke dalam kajian" },
        { status: 400 },
      );
    }

    // Map category from label to enum
    const CATEGORY_MAP: Record<string, any> = {
      // Changed CourseCategory to any
      "Program Wajib": "Wajib",
      "Program Ekstra": "Extra",
      "Program Next Level": "NextLevel",
      "Program Susulan": "Susulan",
    };

    // Map grade from label to enum (default to X if Semua/All)
    const GRADE_MAP: Record<string, string> = {
      Semua: "X",
      "Kelas 10": "X",
      "Kelas 11": "XI",
      "Kelas 12": "XII",
    };

    const mappedCategory = CATEGORY_MAP[category] || "Wajib";
    const mappedGrade = GRADE_MAP[grade] || "X";

    // Create material
    // Temporary workaround: manually provide ID since prisma generate is blocked by file lock
    const material = await prisma.material.create({
      data: {
        id: `cl${Math.random().toString(36).substring(2, 11)}`,
        title,
        description,
        date: new Date(date),
        startedAt: time || null,
        category: mappedCategory as MaterialCategory,
        grade: mappedGrade as MaterialGrade,
        thumbnailUrl: thumbnailUrl || null,
        instructorId: session.user.id,
        programId: programId || null,
        materialType: materialType || null,
        content: materialContent || null,
        link: materialLink || null,
        updatedAt: new Date(),
      } as any,
    });

    // Resolve invited users by email and create MaterialInvite + Notification
    const generateToken = () =>
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    const invitedUsersDb = await prisma.user.findMany({
      where: { email: { in: invites } },
      select: { id: true, email: true },
    });

    if (invitedUsersDb.length > 0) {
      const inviteData = invitedUsersDb.map((u) => ({
        id: `cl${Math.random().toString(36).substring(2, 11)}`,
        materialId: material.id,
        instructorId: session.user.id,
        userId: u.id,
        token: generateToken(),
        status: "pending" as any,
        updatedAt: new Date(),
      }));

      await prisma.materialInvite.createMany({ data: inviteData });

      // Fetch instructor name for notification message
      const instructor = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true },
      });

      // Create notification records
      const notifications = await createBulkNotifications(
        inviteData.map((inv) => ({
          userId: inv.userId,
          type: "invitation" as const,
          title: "Undangan Kajian Baru",
          message: `${instructor?.name || "Instruktur"} mengundang Anda untuk bergabung ke kajian "${material.title}"`,
          icon: "book",
          resourceType: "material",
          resourceId: material.id,
          actionUrl: `/materials/${material.id}`,
          inviteToken: inv.token,
          senderId: session.user.id,
        })),
      );

      // Push real-time notifications via WebSocket
      await emitNotificationsToUsers(
        notifications.map((n) => ({ userId: n.userId, notification: n })),
      );
    }

    return NextResponse.json(
      { id: material.id, message: "Kajian berhasil dibuat" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating material:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Gagal membuat kajian",
      },
      { status: 500 },
    );
  }
}
