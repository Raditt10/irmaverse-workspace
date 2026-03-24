import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ensureUserChatTables } from "@/lib/user-chat";

// GET - Fetch messages for a user-to-user conversation
export async function GET(
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

    // Verify user is part of this conversation
    const conversation = (await prisma.$queryRawUnsafe(
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

    if (!conversation[0]) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    // Get pagination params
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "50");

    const messages = (await prisma.$queryRawUnsafe(
      `
        SELECT m.id, m.conversationId, m.senderId, m.content, m.isRead, m.readAt,
               m.attachmentUrl, m.attachmentType, m.isEdited, m.editedAt,
               m.isDeleted, m.deletedAt, m.createdAt,
               u.id AS senderUserId, u.name AS senderName, u.avatar AS senderAvatar
        FROM user_chat_messages m
        LEFT JOIN users u ON u.id = m.senderId
        WHERE m.conversationId = ?
        ORDER BY m.createdAt ASC
        LIMIT ?
      `,
      conversationId,
      limit,
    )) as Array<{
      id: string;
      conversationId: string;
      senderId: string;
      content: string;
      isRead: number | boolean;
      readAt: Date | null;
      attachmentUrl: string | null;
      attachmentType: string | null;
      isEdited: number | boolean;
      editedAt: Date | null;
      isDeleted: number | boolean;
      deletedAt: Date | null;
      createdAt: Date;
      senderUserId: string | null;
      senderName: string | null;
      senderAvatar: string | null;
    }>;

    const filteredMessages = cursor
      ? messages.filter((m) => m.id > cursor)
      : messages;

    // Mark unread messages as read
    await prisma.$executeRawUnsafe(
      `
        UPDATE user_chat_messages
        SET isRead = 1, readAt = NOW(3)
        WHERE conversationId = ? AND isRead = 0 AND senderId <> ?
      `,
      conversationId,
      session.user.id,
    );

    const mappedMessages = filteredMessages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      sender: {
        id: msg.senderUserId || msg.senderId,
        name: msg.senderName || "Unknown",
        avatar: msg.senderAvatar,
      },
      isRead: Boolean(msg.isRead),
      readAt: msg.readAt,
      attachmentUrl: msg.attachmentUrl,
      attachmentType: msg.attachmentType,
      isEdited: Boolean(msg.isEdited),
      editedAt: msg.editedAt,
      isDeleted: Boolean(msg.isDeleted),
      deletedAt: msg.deletedAt,
      createdAt: msg.createdAt,
    }));

    return NextResponse.json({
      messages: mappedMessages,
      nextCursor:
        mappedMessages.length === limit
          ? mappedMessages[mappedMessages.length - 1]?.id
          : null,
    });
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}

// POST - Send a new message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;
    const { content, attachmentUrl, attachmentType } = await request.json();
    await ensureUserChatTables();

    if (!content && !attachmentUrl) {
      return NextResponse.json(
        { error: "Message content or attachment is required" },
        { status: 400 },
      );
    }

    const conversationRows = (await prisma.$queryRawUnsafe(
      `
        SELECT id, user1Id, user2Id
        FROM user_chat_conversations
        WHERE id = ? AND (user1Id = ? OR user2Id = ?)
        LIMIT 1
      `,
      conversationId,
      session.user.id,
      session.user.id,
    )) as Array<{ id: string; user1Id: string; user2Id: string }>;

    const conversation = conversationRows[0];

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    const messageId = crypto.randomUUID();
    await prisma.$executeRawUnsafe(
      `
        INSERT INTO user_chat_messages (
          id, conversationId, senderId, content, attachmentUrl, attachmentType,
          isRead, isEdited, isDeleted, createdAt
        )
        VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, NOW(3))
      `,
      messageId,
      conversationId,
      session.user.id,
      content || "",
      attachmentUrl || null,
      attachmentType || null,
    );

    // Update conversation timestamp
    await prisma.$executeRawUnsafe(
      `UPDATE user_chat_conversations SET updatedAt = NOW(3) WHERE id = ?`,
      conversationId,
    );

    const messageRows = (await prisma.$queryRawUnsafe(
      `
        SELECT m.id, m.content, m.senderId, m.isRead, m.readAt,
               m.attachmentUrl, m.attachmentType, m.createdAt,
               u.id AS senderUserId, u.name AS senderName, u.avatar AS senderAvatar
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
      isRead: number | boolean;
      readAt: Date | null;
      attachmentUrl: string | null;
      attachmentType: string | null;
      createdAt: Date;
      senderUserId: string | null;
      senderName: string | null;
      senderAvatar: string | null;
    }>;

    const message = messageRows[0];

    return NextResponse.json(
      {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        sender: {
          id: message.senderUserId || message.senderId,
          name: message.senderName || "Unknown",
          avatar: message.senderAvatar,
        },
        isRead: Boolean(message.isRead),
        readAt: message.readAt,
        attachmentUrl: message.attachmentUrl,
        attachmentType: message.attachmentType,
        createdAt: message.createdAt,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}
