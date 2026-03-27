import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// DELETE — Unlink Google account (only if user has a password)
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: {
        password: true,
        accounts: {
          where: { provider: "google" },
          select: { id: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 },
      );
    }

    if (user.accounts.length === 0) {
      return NextResponse.json(
        { error: "Akun Google tidak terhubung" },
        { status: 400 },
      );
    }

    // Must have a password to unlink Google (otherwise they'd be locked out)
    if (!user.password) {
      return NextResponse.json(
        {
          error:
            "Buat password terlebih dahulu sebelum melepas akun Google, agar kamu tetap bisa login.",
        },
        { status: 400 },
      );
    }

    await prisma.accounts.deleteMany({
      where: {
        userId: session.user.id,
        provider: "google",
      },
    });

    return NextResponse.json({
      message: "Akun Google berhasil dilepas",
    });
  } catch (error) {
    console.error("Unlink Google error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
