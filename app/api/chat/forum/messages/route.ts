import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const INITIAL_LOAD = 100;
const PAGE_SIZE = 50;

/**
 * GET /api/chat/forum/messages
 * - No params: returns last 100 messages (chronological order) + hasMore flag
 * - ?before=<ISO-timestamp>: returns 50 messages before that timestamp
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const before = searchParams.get("before"); // ISO timestamp of the oldest loaded message

  try {
    if (before) {
      // ── Load older messages (pagination) ──────────────────────────────────
      const beforeDate = new Date(before);

      const messages = await prisma.forum_messages.findMany({
        where: { createdAt: { lt: beforeDate } },
        orderBy: { createdAt: "desc" },
        take: PAGE_SIZE + 1, // +1 to detect whether there are more
        include: {
          sender: {
            select: { id: true, name: true, avatar: true, role: true },
          },
        },
      });

      const hasMore = messages.length > PAGE_SIZE;
      const displayed = messages.slice(0, PAGE_SIZE).reverse(); // chronological

      return NextResponse.json({
        messages: displayed.map(mapMessage),
        hasMore,
      });
    } else {
      // ── Initial load: last 100 messages ───────────────────────────────────
      const messages = await prisma.forum_messages.findMany({
        orderBy: { createdAt: "desc" },
        take: INITIAL_LOAD + 1,
        include: {
          sender: {
            select: { id: true, name: true, avatar: true, role: true },
          },
        },
      });

      const hasMore = messages.length > INITIAL_LOAD;
      const displayed = messages.slice(0, INITIAL_LOAD).reverse();

      return NextResponse.json({
        messages: displayed.map(mapMessage),
        hasMore,
        info: { name: "Forum Diskusi IRMA13" },
      });
    }
  } catch (error) {
    console.error("[Forum Messages GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/chat/forum/messages
 * Body: { content: string }
 * Saves the message to the database and returns the saved message object.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const content: string = (body.content ?? "").trim();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 },
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "Message too long (max 2000 chars)" },
        { status: 400 },
      );
    }

    const message = await prisma.forum_messages.create({
      data: { content, senderId: session.user.id },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true, role: true },
        },
      },
    });

    return NextResponse.json(mapMessage(message), { status: 201 });
  } catch (error) {
    console.error("[Forum Messages POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// ── Helper ──────────────────────────────────────────────────────────────────
function mapMessage(msg: {
  id: string;
  content: string;
  senderId: string;
  createdAt: Date;
  sender: {
    id: string;
    name: string | null;
    avatar: string | null;
    role: string;
  };
}) {
  return {
    id: msg.id,
    content: msg.content,
    senderId: msg.senderId,
    createdAt: msg.createdAt.toISOString(),
    sender: {
      id: msg.sender.id,
      name: msg.sender.name ?? "Anonim",
      avatar: msg.sender.avatar ?? null,
      role: msg.sender.role,
    },
  };
}
