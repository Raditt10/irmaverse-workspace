import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST — Delete account permanently
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { password, confirmation } = await req.json();

    if (confirmation !== "HAPUS AKUN SAYA") {
      return NextResponse.json(
        { error: 'Ketik "HAPUS AKUN SAYA" untuk konfirmasi' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 },
      );
    }

    // Admin cannot delete their own account
    if (user.role === "admin") {
      return NextResponse.json(
        { error: "Admin tidak dapat menghapus akun sendiri" },
        { status: 403 },
      );
    }

    // If user has password, verify it
    if (user.password) {
      if (!password) {
        return NextResponse.json(
          { error: "Masukkan password untuk konfirmasi" },
          { status: 400 },
        );
      }
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return NextResponse.json({ error: "Password salah" }, { status: 400 });
      }
    }

    // Delete user — Cascade will handle related records
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    return NextResponse.json({
      message: "Akun berhasil dihapus",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menghapus akun" },
      { status: 500 },
    );
  }
}
