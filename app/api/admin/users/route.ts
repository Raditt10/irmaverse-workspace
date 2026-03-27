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

// GET all users (non-instruktur)
export async function GET(req: NextRequest) {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const search = req.nextUrl.searchParams.get("search") || "";

    const whereClause: any = {
      role: "user",
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const users = await prisma.users.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        notelp: true,
        address: true,
        bio: true,
        createdAt: true,
        points: true,
        level: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch jabatan via raw query since prisma client may not be regenerated yet
    let jabatanMap: Record<string, string> = {};
    try {
      const raw: any[] = await prisma.$queryRaw`SELECT id, jabatan FROM users WHERE jabatan IS NOT NULL`;
      for (const r of raw) {
        jabatanMap[r.id] = r.jabatan;
      }
    } catch (e) {
      // jabatan column may not exist yet, ignore
    }

    const result = users.map((u: any) => ({
      ...u,
      jabatan: jabatanMap[u.id] || null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ADMIN_USERS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST create new user
export async function POST(req: NextRequest) {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, password, role, jabatan, notelp, address } = body;

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
        role: role || "user",
        notelp: notelp || null,
        address: address || null,
        updatedAt: new Date(),
      },
    });

    // Set jabatan via raw query
    if (jabatan) {
      await prisma.$executeRaw`UPDATE users SET jabatan = ${jabatan} WHERE id = ${user.id}`;
    }

    // Log Activity
    await recordActivity({
      userId: (await auth())?.user?.id || "",
      type: "admin_user_managed" as any,
      title: "Membuat Akun Baru",
      description: `Admin membuat akun baru dengan nama: ${name} (${role || "user"})`,
      metadata: { targetUserId: user.id, targetName: name, targetRole: role || "user" }
    });

    return NextResponse.json({ id: user.id, message: "Akun berhasil dibuat" }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_USERS_POST]", error);
    return NextResponse.json({ error: "Gagal membuat akun" }, { status: 500 });
  }
}

// PUT update user
export async function PUT(req: NextRequest) {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, email, password, role, jabatan, notelp, address } = body;

    if (!id) {
      return NextResponse.json({ error: "ID user wajib diisi" }, { status: 400 });
    }

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (role !== undefined) data.role = role;
    if (notelp !== undefined) data.notelp = notelp || null;
    if (address !== undefined) data.address = address || null;
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

    // Update jabatan via raw query
    if (jabatan !== undefined) {
      const jabatanValue = jabatan || null;
      await prisma.$executeRaw`UPDATE users SET jabatan = ${jabatanValue} WHERE id = ${id}`;
    }

    // Log Activity
    await recordActivity({
      userId: (await auth())?.user?.id || "",
      type: "admin_user_managed" as any,
      title: "Memperbarui Akun",
      description: `Admin memperbarui informasi akun: ${name || email}`,
      metadata: { targetUserId: id, updates: Object.keys(data) }
    });

    return NextResponse.json({ message: "Akun berhasil diperbarui" });
  } catch (error) {
    console.error("[ADMIN_USERS_PUT]", error);
    return NextResponse.json({ error: "Gagal memperbarui akun" }, { status: 500 });
  }
}

// DELETE user
export async function DELETE(req: NextRequest) {
  try {
    if (!(await checkAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID user wajib diisi" }, { status: 400 });
    }

    // Get info for logging before deletion
    const targetUser = await prisma.users.findUnique({ where: { id }, select: { name: true, email: true } });

    await prisma.users.delete({ where: { id } });

    // Log Activity
    await recordActivity({
      userId: (await auth())?.user?.id || "",
      type: "admin_user_managed" as any,
      title: "Menghapus Akun",
      description: `Admin menghapus akun: ${targetUser?.name || targetUser?.email || id}`,
      metadata: { targetUserId: id }
    });

    return NextResponse.json({ message: "Akun berhasil dihapus" });
  } catch (error) {
    console.error("[ADMIN_USERS_DELETE]", error);
    return NextResponse.json({ error: "Gagal menghapus akun" }, { status: 500 });
  }
}
