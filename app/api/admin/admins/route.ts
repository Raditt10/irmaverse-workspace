import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { recordActivity } from "@/lib/activity";

async function checkSuperAdmin() {
  const session = await auth();
  if (!session || session.user.role?.toLowerCase() !== "super_admin") {
    return null;
  }
  return session;
}

// GET all admins
export async function GET(req: NextRequest) {
  try {
    if (!(await checkSuperAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const search = req.nextUrl.searchParams.get("search") || "";

    const whereClause: any = {
      role: "admin",
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const admins = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        notelp: true,
        address: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch jabatan via raw query or if it exists in the model
    const adminsWithJabatan = await Promise.all(admins.map(async (admin: any) => {
      let jabatanValue = null;
      try {
        const raw: any[] = await prisma.$queryRaw`SELECT jabatan FROM users WHERE id = ${admin.id}`;
        jabatanValue = raw[0]?.jabatan || null;
      } catch (e) {
        // ignore if column missing
      }
      return { ...admin, jabatan: jabatanValue };
    }));

    return NextResponse.json(adminsWithJabatan);
  } catch (error) {
    console.error("[ADMIN_ADMINS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST create new admin
export async function POST(req: NextRequest) {
  try {
    if (!(await checkSuperAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, password, notelp, address, jabatan } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nama, email, dan password wajib diisi" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "admin",
        notelp: notelp || null,
        address: address || null,
      },
    });

    // Update jabatan via raw query
    if (jabatan) {
      try {
        await prisma.$executeRaw`UPDATE users SET jabatan = ${jabatan} WHERE id = ${user.id}`;
      } catch (e) {
        console.error("Failed to update jabatan", e);
      }
    }

    // Log Activity
    await recordActivity({
      userId: (await auth())?.user?.id || "",
      type: "admin_admin_managed" as any,
      title: "Membuat Admin Baru",
      description: `Superadmin membuat akun admin baru: ${name}`,
      metadata: { targetUserId: user.id }
    });

    return NextResponse.json({ id: user.id, message: "Admin berhasil dibuat" }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_ADMINS_POST]", error);
    return NextResponse.json({ error: "Gagal membuat admin" }, { status: 500 });
  }
}

// PUT update admin
export async function PUT(req: NextRequest) {
  try {
    if (!(await checkSuperAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, email, password, notelp, address, jabatan } = body;

    if (!id) {
      return NextResponse.json({ error: "ID admin wajib diisi" }, { status: 400 });
    }

    const existingAdmin = await prisma.user.findUnique({ where: { id } });
    if (!existingAdmin) {
      return NextResponse.json({ error: "Admin tidak ditemukan" }, { status: 404 });
    }

    // Check if new email is already taken by another user
    if (email && email !== existingAdmin.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } });
      if (emailTaken) {
        return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
      }
    }

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (notelp !== undefined) data.notelp = notelp || null;
    if (address !== undefined) data.address = address || null;
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    await prisma.user.update({ where: { id }, data });

    // Update jabatan via raw query
    if (jabatan !== undefined) {
      try {
        await prisma.$executeRaw`UPDATE users SET jabatan = ${jabatan || null} WHERE id = ${id}`;
      } catch (e) {
        console.error("Failed to update jabatan", e);
      }
    }

    // Log Activity
    await recordActivity({
      userId: (await auth())?.user?.id || "",
      type: "admin_admin_managed" as any,
      title: "Memperbarui Admin",
      description: `Superadmin memperbarui akun admin: ${name || email}`,
      metadata: { targetUserId: id }
    });

    return NextResponse.json({ message: "Admin berhasil diperbarui" });
  } catch (error) {
    console.error("[ADMIN_ADMINS_PUT]", error);
    return NextResponse.json({ error: "Gagal memperbarui admin" }, { status: 500 });
  }
}

// DELETE admin
export async function DELETE(req: NextRequest) {
  try {
    if (!(await checkSuperAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID admin wajib diisi" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: "Admin tidak ditemukan" }, { status: 404 });
    }

    // Prevent deleting super_admin
    if ((target.role as string).toLowerCase() === "super_admin") {
      return NextResponse.json({ error: "Tidak dapat menghapus Super Admin" }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });

    // Log Activity
    await recordActivity({
      userId: (await auth())?.user?.id || "",
      type: "admin_admin_managed" as any,
      title: "Menghapus Admin",
      description: `Superadmin menghapus akun admin: ${target.name || target.email}`,
      metadata: { targetUserId: id }
    });

    return NextResponse.json({ message: "Admin berhasil dihapus" });
  } catch (error) {
    console.error("[ADMIN_ADMINS_DELETE]", error);
    return NextResponse.json({ error: "Gagal menghapus admin" }, { status: 500 });
  }
}


