import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - Fetch all instructors for chat
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all instructors
      const instructors = await prisma.users.findMany({
        where: {
          role: "instruktur",
        },
        select: {
          id: true,
          name: true,
          email: true,
          bidangKeahlian: true,
          pengalaman: true,
          avatar: true,
        },
        orderBy: { name: "asc" },
      });

    // Get existing conversations for this user
    const userConversations = await prisma.chat_conversations.findMany({
      where: { userId: session.user.id },
      select: { instructorId: true },
    });

    const conversationInstructorIds = new Set(
      userConversations.map((c) => c.instructorId)
    );

    // Mark which instructors already have conversations
    const instructorsWithConversationStatus = instructors.map((instructor) => ({
      ...instructor,
      hasConversation: conversationInstructorIds.has(instructor.id),
    }));

    return NextResponse.json(instructorsWithConversationStatus);
  } catch (error: any) {
    console.error("Error fetching instructors:", error);
    return NextResponse.json(
      { error: "Failed to fetch instructors" },
      { status: 500 }
    );
  }
}
