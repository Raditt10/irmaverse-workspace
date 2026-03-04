import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { NextResponse, NextRequest } from "next/server";

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

    // Check if user exists
    const User = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!User) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!id) {
      return NextResponse.json(
        { error: "Missing material id" },
        { status: 400 },
      );
    }

    // Fetch single material by id with related data
    const material = await (prisma as any).material.findUnique({
      where: { id: id },
      include: {
        users: {
          select: {
            name: true,
            email: true,
          },
        },
        courseenrollment: {
          where: { userId: session.user.id },
          select: { id: true },
        },
        material_material_parentIdTomaterial: {
          select: {
            id: true,
            title: true,
          },
        },
        program: {
          select: {
            id: true,
            title: true,
          },
        },
        materialinvite: {
          include: {
            users_materialinvite_userIdTousers: {
              select: {
                email: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!material) {
      return NextResponse.json(
        { error: "Materi tidak ditemukan" },
        { status: 404 },
      );
    }

    const isPrivileged = User.role === "instruktur" || User.role === "admin";

    // Access control: non-privileged users must be enrolled (courseenrollment)
    // OR have an accepted invitation to view this material
    if (!isPrivileged) {
      const hasEnrollment = (material as any).courseenrollment?.length > 0;
      const hasAcceptedInvite = ((material as any).materialinvite || []).some(
        (inv: any) => inv.status === "accepted",
      );
      if (!hasEnrollment && !hasAcceptedInvite) {
        return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
      }
    }

    const CATEGORY_LABEL = {
      Wajib: "Program Wajib",
      Extra: "Program Ekstra",
      NextLevel: "Program Next Level",
      Susulan: "Program Susulan",
    } as const;

    const GRADE_LABEL: Record<string, string> = {
      X: "Kelas 10",
      XI: "Kelas 11",
      XII: "Kelas 12",
      x: "Kelas 10",
      xi: "Kelas 11",
      xii: "Kelas 12",
    };

    const m = material as any; // Cast to any to bypass stale linting issues
    const result = {
      id: m.id,
      title: m.title,
      description: m.description,
      date: m.date,
      instructor: m.users?.name || null,
      instructorEmail: m.users?.email || null,
      category:
        CATEGORY_LABEL[m.category as keyof typeof CATEGORY_LABEL] || m.category,
      grade: GRADE_LABEL[m.grade as keyof typeof GRADE_LABEL] || m.grade,
      startedAt: m.startedAt,
      thumbnailUrl: m.thumbnailUrl,
      content: m.content,
      link: m.link,
      materialType: m.materialType,
      isJoined:
        m.courseenrollment?.length > 0 ||
        (m.materialinvite || []).some((inv: any) => inv.status === "accepted"),
      parent: m.material_material_parentIdTomaterial
        ? {
            id: m.material_material_parentIdTomaterial.id,
            title: m.material_material_parentIdTomaterial.title,
          }
        : null,
      program: m.program
        ? {
            id: m.program.id,
            title: m.program.title,
          }
        : null,
      // For editing: flat email list of all invited users
      invites: (m.materialinvite || [])
        .map(
          (inv: any) => inv.users_materialinvite_userIdTousers?.email || null,
        )
        .filter(Boolean),
      // For instructor view: rich invite status data
      inviteDetails: isPrivileged
        ? (m.materialinvite || []).map((inv: any) => ({
            id: inv.id,
            email: inv.users_materialinvite_userIdTousers?.email || null,
            name: inv.users_materialinvite_userIdTousers?.name || null,
            avatar: inv.users_materialinvite_userIdTousers?.avatar || null,
            status: inv.status,
            createdAt: inv.createdAt,
          }))
        : undefined,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching material by id:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch material",
      },
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

    const { id } = await params;

    const material = await (prisma as any).material.findUnique({
      where: { id },
      select: { instructorId: true },
    });

    if (!material) {
      return NextResponse.json(
        { error: "Kajian tidak ditemukan" },
        { status: 404 },
      );
    }

    // Authorization removal as per previous request
    if (session.user.role !== "instruktur" && session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Hanya instruktur atau admin yang bisa menghapus kajian" },
        { status: 403 },
      );
    }

    await (prisma as any).material.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Kajian berhasil dihapus" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting material:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Gagal menghapus kajian",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
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

    const { id } = await params;
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

    const material = await (prisma as any).material.findUnique({
      where: { id },
      select: { instructorId: true },
    });

    if (!material) {
      return NextResponse.json(
        { error: "Kajian tidak ditemukan" },
        { status: 404 },
      );
    }

    // Authorization removal
    if (session.user.role !== "instruktur" && session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Hanya instruktur atau admin yang bisa mengedit kajian" },
        { status: 403 },
      );
    }

    const CATEGORY_MAP: Record<string, string> = {
      "Program Wajib": "Wajib",
      "Program Ekstra": "Extra",
      "Program Next Level": "NextLevel",
      "Program Susulan": "Susulan",
    };

    const GRADE_MAP: Record<string, string> = {
      Semua: "X",
      "Kelas 10": "X",
      "Kelas 11": "XI",
      "Kelas 12": "XII",
    };

    const mappedCategory = CATEGORY_MAP[category] || "Wajib";
    const mappedGrade = GRADE_MAP[grade] || "X";

    const updatedMaterial = await (prisma as any).material.update({
      where: { id: id },
      data: {
        title,
        description,
        date: new Date(date),
        startedAt: time || null,
        grade: mappedGrade as any,
        thumbnailUrl: thumbnailUrl || null,
        programId: programId || null,
        materialType: materialType || null,
        content: materialContent || null,
        link: materialLink || null,
        updatedAt: new Date(),
      } as any,
      include: {
        users: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(updatedMaterial, { status: 200 });
  } catch (error) {
    console.error("Error updating material:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Gagal mengedit kajian",
      },
      { status: 500 },
    );
  }
}
