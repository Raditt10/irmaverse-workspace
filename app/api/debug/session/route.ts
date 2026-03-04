import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();

    console.log("[DEBUG-SESSION] Session:", session);

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          error: "No session or email",
          session: session,
        },
        { status: 401 },
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    console.log(
      "[DEBUG-SESSION] Looking for user with email:",
      session.user.email,
    );
    console.log("[DEBUG-SESSION] Found user:", user?.id, user?.email);

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found in database",
          lookingFor: session.user.email,
          sessionData: session.user,
        },
        { status: 404 },
      );
    }

    // Get invitations for this user
    const invitations = await prisma.materialinvite.findMany({
      where: {
        userId: user.id,
        status: "pending",
      },
      include: {
        material: true,
        users_materialinvite_instructorIdTousers: true,
      },
    });

    console.log("[DEBUG-SESSION] Found invitations:", invitations.length);

    return NextResponse.json({
      success: true,
      session: {
        email: session.user.email,
        id: session.user.id,
        name: session.user.name,
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      invitationCount: invitations.length,
      invitations: invitations,
    });
  } catch (error) {
    console.error("[DEBUG-SESSION] Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
