import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { recordActivity } from "@/lib/activity";

async function checkAdmin() {
  const session = await auth();
  const role = session?.user?.role?.toLowerCase();
  if (!session || (role !== "admin" && role !== "super_admin")) {
    return null;
  }
  return session;
}

// GET all instructors
export async function GET(req: NextRequest) {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const search = req.nextUrl.searchParams.get("search") || "";

    const instructors = await prisma.users.findMany({
      where: {
        role: "instruktur",
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { email: { contains: search } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bidangKeahlian: true,
        pengalaman: true,
        bio: true,
        notelp: true,
        createdAt: true,
        material: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Compute stats
    const result = await Promise.all(
      instructors.map(async (inst) => {
        const materialIds = inst.material.map((m) => m.id);
        let avgRating = 0;
        if (materialIds.length > 0) {
          const ratingResult = await prisma.attendance.aggregate({
            where: {
              materialId: { in: materialIds },
              rating: { not: null },
            },
            _avg: { rating: true },
          });
          avgRating = ratingResult._avg.rating ?? 0;
        }

        const { material, ...rest } = inst;
        return {
          ...rest,
          kajianCount: material.length,
          rating: Math.round(avgRating * 10) / 10,
        };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ADMIN_INSTRUCTORS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST create new instructor
export async function POST(req: NextRequest) {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, password, bidangKeahlian, pengalaman, bio, notelp } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nama, email, dan password wajib diisi" }, { status: 400 });
    }

    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        name,
        email,
        password: hashedPassword,
        role: "instruktur",
        bidangKeahlian: bidangKeahlian || null,
        pengalaman: pengalaman || null,
        bio: bio || null,
        notelp: notelp || null,
        updatedAt: new Date(),
      },
    });

    // Log Activity
    await recordActivity({
      userId: (await auth())?.user?.id || "",
      type: "admin_user_managed" as any,
      title: "Membuat Akun Instruktur",
      description: `Admin membuat akun instruktur baru: ${name}`,
      metadata: { targetUserId: user.id }
    });

    return NextResponse.json({ id: user.id, message: "Instruktur berhasil dibuat" }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_INSTRUCTORS_POST]", error);
    return NextResponse.json({ error: "Gagal membuat instruktur" }, { status: 500 });
  }
}

// PUT update instructor
export async function PUT(req: NextRequest) {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, email, password, bidangKeahlian, pengalaman, bio, notelp } = body;

    if (!id) {
      return NextResponse.json({ error: "ID instruktur wajib diisi" }, { status: 400 });
    }

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (bidangKeahlian !== undefined) data.bidangKeahlian = bidangKeahlian || null;
    if (pengalaman !== undefined) data.pengalaman = pengalaman || null;
    if (bio !== undefined) data.bio = bio || null;
    if (notelp !== undefined) data.notelp = notelp || null;
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    await prisma.users.update({ 
      where: { id }, 
      data: {
        ...data,
        updatedAt: new Date(),
      } 
    });

    // Log Activity
    await recordActivity({
      userId: (await auth())?.user?.id || "",
      type: "admin_user_managed" as any,
      title: "Memperbarui Akun Instruktur",
      description: `Admin memperbarui informasi akun instruktur: ${name || id}`,
      metadata: { targetUserId: id }
    });

    return NextResponse.json({ message: "Instruktur berhasil diperbarui" });
  } catch (error) {
    console.error("[ADMIN_INSTRUCTORS_PUT]", error);
    return NextResponse.json({ error: "Gagal memperbarui instruktur" }, { status: 500 });
  }
}

// DELETE instructor
export async function DELETE(req: NextRequest) {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID instruktur wajib diisi" }, { status: 400 });
    }

    await prisma.users.delete({ where: { id } });

    // Log Activity
    await recordActivity({
      userId: (await auth())?.user?.id || "",
      type: "admin_user_managed" as any,
      title: "Menghapus Akun Instruktur",
      description: `Admin menghapus akun instruktur ID: ${id}`,
      metadata: { targetUserId: id }
    });

    return NextResponse.json({ message: "Instruktur berhasil dihapus" });
  } catch (error) {
    console.error("[ADMIN_INSTRUCTORS_DELETE]", error);
    return NextResponse.json({ error: "Gagal menghapus instruktur" }, { status: 500 });
  }
}
