import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  ensureUserChatTables,
  hasMutualFollow,
  normalizeUserPair,
} from "@/lib/user-chat";

// GET - Fetch user-to-user conversations for current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    await ensureUserChatTables();

    const conversations = (await prisma.$queryRawUnsafe(
      `
        SELECT id, user1Id, user2Id, createdAt, updatedAt
        FROM user_chat_conversations
        WHERE user1Id = ? OR user2Id = ?
        ORDER BY updatedAt DESC
      `,
      userId,
      userId,
    )) as Array<{
      id: string;
      user1Id: string;
      user2Id: string;
      createdAt: Date;
      updatedAt: Date;
    }>;

    const otherUserIds = Array.from(
      new Set(
        conversations.map((c) =>
          c.user1Id === userId ? c.user2Id : c.user1Id,
        ),
      ),
    );

    const otherUsers = otherUserIds.length
      ? await prisma.users.findMany({
          where: { id: { in: otherUserIds } },
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            lastSeen: true,
          },
        })
      : [];

    const userMap = new Map(otherUsers.map((u) => [u.id, u]));

    const mappedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId =
          conv.user1Id === userId ? conv.user2Id : conv.user1Id;
        const otherUser = userMap.get(otherUserId) || null;

        const [lastRows, unreadRows] = await Promise.all([
          prisma.$queryRawUnsafe(
            `
              SELECT m.id, m.content, m.senderId, m.createdAt, m.isRead,
                     m.attachmentUrl, m.attachmentType,
                     u.name AS senderName
              FROM user_chat_messages m
              LEFT JOIN users u ON u.id = m.senderId
              WHERE m.conversationId = ?
              ORDER BY m.createdAt DESC
              LIMIT 1
            `,
            conv.id,
          ) as Promise<
            Array<{
              id: string;
              content: string;
              senderId: string;
              createdAt: Date;
              isRead: number | boolean;
              attachmentUrl: string | null;
              attachmentType: string | null;
              senderName: string | null;
            }>
          >,
          prisma.$queryRawUnsafe(
            `
              SELECT COUNT(*) AS unreadCount
              FROM user_chat_messages
              WHERE conversationId = ? AND isRead = 0 AND senderId <> ?
            `,
            conv.id,
            userId,
          ) as Promise<Array<{ unreadCount: bigint | number }>>,
        ]);

        const lastMessage = lastRows[0];
        const unreadCountRaw = unreadRows[0]?.unreadCount ?? 0;
        const lastPreview = lastMessage
          ? lastMessage.content?.trim() ||
            (lastMessage.attachmentType === "image"
              ? "📷 Gambar"
              : lastMessage.attachmentUrl
                ? "📎 Lampiran"
                : "")
          : "";

        return {
          id: conv.id,
          otherUser,
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                content: lastPreview,
                senderId: lastMessage.senderId,
                senderName: lastMessage.senderName || "Unknown",
                createdAt: lastMessage.createdAt,
                isRead: Boolean(lastMessage.isRead),
              }
            : null,
          unreadCount: Number(unreadCountRaw),
          updatedAt: conv.updatedAt,
        };
      }),
    );

    return NextResponse.json(mappedConversations);
  } catch (error: any) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 },
    );
  }
}

// POST - Create or get a conversation with another user
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { otherUserId } = await request.json();

    await ensureUserChatTables();

    if (!otherUserId) {
      return NextResponse.json(
        { error: "otherUserId is required" },
        { status: 400 },
      );
    }

    if (otherUserId === userId) {
      return NextResponse.json(
        { error: "Cannot chat with yourself" },
        { status: 400 },
      );
    }

    const isMutual = await hasMutualFollow(userId, otherUserId);
    if (!isMutual) {
      return NextResponse.json(
        { error: "Users must be mutually following to chat" },
        { status: 403 },
      );
    }

    const pair = normalizeUserPair(userId, otherUserId);

    const existing = (await prisma.$queryRawUnsafe(
      `
        SELECT id, user1Id, user2Id, createdAt, updatedAt
        FROM user_chat_conversations
        WHERE user1Id = ? AND user2Id = ?
        LIMIT 1
      `,
      pair.user1Id,
      pair.user2Id,
    )) as Array<{
      id: string;
      user1Id: string;
      user2Id: string;
      createdAt: Date;
      updatedAt: Date;
    }>;

    let conversation = existing[0];

    if (!conversation) {
      const id = crypto.randomUUID();
      await prisma.$executeRawUnsafe(
        `
          INSERT INTO user_chat_conversations (id, user1Id, user2Id, createdAt, updatedAt)
          VALUES (?, ?, ?, NOW(3), NOW(3))
        `,
        id,
        pair.user1Id,
        pair.user2Id,
      );

      conversation = {
        id,
        user1Id: pair.user1Id,
        user2Id: pair.user2Id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return NextResponse.json(
      {
        id: conversation.id,
        user1Id: conversation.user1Id,
        user2Id: conversation.user2Id,
        createdAt: conversation.createdAt,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 },
    );
  }
}
