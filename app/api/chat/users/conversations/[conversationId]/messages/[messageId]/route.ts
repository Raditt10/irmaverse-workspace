import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ensureUserChatTables } from "@/lib/user-chat";

// PATCH - Edit a message
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId } = await params;
    const { content } = await request.json();

    await ensureUserChatTables();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 },
      );
    }

    const messageRows = (await prisma.$queryRawUnsafe(
      `
        SELECT id, senderId, conversationId
        FROM user_chat_messages
        WHERE id = ?
        LIMIT 1
      `,
      messageId,
    )) as Array<{ id: string; senderId: string; conversationId: string }>;

    const message = messageRows[0];

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Verify user is the sender
    if (message.senderId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only edit your own messages" },
        { status: 403 },
      );
    }

    await prisma.$executeRawUnsafe(
      `
        UPDATE user_chat_messages
        SET content = ?, isEdited = 1, editedAt = NOW(3)
        WHERE id = ?
      `,
      content,
      messageId,
    );

    const updatedRows = (await prisma.$queryRawUnsafe(
      `
        SELECT m.id, m.content, m.senderId, m.isEdited, m.editedAt,
               u.id AS senderUserId, u.name AS senderName
        FROM user_chat_messages m
        LEFT JOIN users u ON u.id = m.senderId
        WHERE m.id = ?
        LIMIT 1
      `,
      messageId,
    )) as Array<{
      id: string;
      content: string;
      senderId: string;
      isEdited: number | boolean;
      editedAt: Date | null;
      senderUserId: string | null;
      senderName: string | null;
    }>;

    const updatedMessage = updatedRows[0];

    return NextResponse.json({
      id: updatedMessage.id,
      content: updatedMessage.content,
      senderId: updatedMessage.senderId,
      sender: {
        id: updatedMessage.senderUserId || updatedMessage.senderId,
        name: updatedMessage.senderName || "Unknown",
      },
      isEdited: Boolean(updatedMessage.isEdited),
      editedAt: updatedMessage.editedAt,
    });
  } catch (error: any) {
    console.error("Error editing message:", error);
    return NextResponse.json(
      { error: "Failed to edit message" },
      { status: 500 },
    );
  }
}

// DELETE - Delete a message (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId } = await params;

    await ensureUserChatTables();

    const messageRows = (await prisma.$queryRawUnsafe(
      `
        SELECT id, senderId
        FROM user_chat_messages
        WHERE id = ?
        LIMIT 1
      `,
      messageId,
    )) as Array<{ id: string; senderId: string }>;

    const message = messageRows[0];

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Verify user is the sender
    if (message.senderId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only delete your own messages" },
        { status: 403 },
      );
    }

    await prisma.$executeRawUnsafe(
      `
        UPDATE user_chat_messages
        SET isDeleted = 1, deletedAt = NOW(3)
        WHERE id = ?
      `,
      messageId,
    );

    return NextResponse.json({
      id: messageId,
      isDeleted: true,
      deletedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 },
    );
  }
}
