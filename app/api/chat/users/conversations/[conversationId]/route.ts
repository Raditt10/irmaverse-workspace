import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ensureUserChatTables } from "@/lib/user-chat";

// DELETE - Delete user-to-user conversation and all messages
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;
    await ensureUserChatTables();

    const rows = (await prisma.$queryRawUnsafe(
      `
        SELECT id
        FROM user_chat_conversations
        WHERE id = ? AND (user1Id = ? OR user2Id = ?)
        LIMIT 1
      `,
      conversationId,
      session.user.id,
      session.user.id,
    )) as Array<{ id: string }>;

    if (!rows[0]) {
      return NextResponse.json(
        { error: "Conversation not found or unauthorized" },
        { status: 404 },
      );
    }

    await prisma.$executeRawUnsafe(
      `DELETE FROM user_chat_conversations WHERE id = ?`,
      conversationId,
    );

    return NextResponse.json({ message: "Conversation deleted successfully" });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 },
    );
  }
}
