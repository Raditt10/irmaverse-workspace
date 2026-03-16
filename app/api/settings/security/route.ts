import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET — Fetch security info for the current user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        password: true,
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 },
      );
    }

    const googleAccount = user.accounts.find((a) => a.provider === "google");

    return NextResponse.json({
      email: user.email,
      hasPassword: !!user.password,
      hasGoogle: !!googleAccount,
      googleEmail: googleAccount
        ? user.email // same email, since we use allowDangerousEmailAccountLinking
        : null,
    });
  } catch (error) {
    console.error("Security info error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 });
  }
}
