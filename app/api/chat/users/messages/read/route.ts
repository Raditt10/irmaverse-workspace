import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ensureUserChatTables } from "@/lib/user-chat";

// POST - Mark user chat messages as read
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageIds } = await req.json();

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json(
        { error: "messageIds array required" },
        { status: 400 }
      );
    }

    await ensureUserChatTables();

    // The messages we want to mark are those where sender is NOT the current user
    const idsString = messageIds.map(() => '?').join(',');
    
    // We update all provided message IDs if we are not the sender
    const query = `
      UPDATE user_chat_messages 
      SET isRead = 1, readAt = NOW(3) 
      WHERE id IN (${idsString}) AND senderId <> ?
    `;
    
    await prisma.$executeRawUnsafe(query, ...messageIds, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking user messages as read:", error);
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 }
    );
  }
}
