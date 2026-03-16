import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - Fetch messages for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;

    // Verify user is part of this conversation
    const conversation = await prisma.chat_conversations.findFirst({
      where: {
        id: conversationId,
        OR: [
          { userId: session.user.id },
          { instructorId: session.user.id },
        ],
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Get pagination params
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Fetch messages
    const messages = await prisma.chat_messages.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    // Mark unread messages as read
    await prisma.chat_messages.updateMany({
      where: {
        conversationId,
        isRead: false,
        senderId: { not: session.user.id },
      },
      data: { 
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      messages,
      nextCursor: messages.length === limit ? messages[messages.length - 1]?.id : null,
    });
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST - Send a new message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;
    const userRole = session.user.role;

    if (userRole === "admin" || userRole === "super_admin") {
      return NextResponse.json({ error: "Monitoring mode: Admins cannot send messages" }, { status: 403 });
    }

    const body = await request.json();
    const { content, attachmentUrl, attachmentType } = body;

    if ((!content || !content.trim()) && !attachmentUrl) {
      return NextResponse.json(
        { error: "Message content or attachment is required" },
        { status: 400 }
      );
    }

    // Verify user is part of this conversation
    const conversation = await prisma.chat_conversations.findFirst({
      where: {
        id: conversationId,
        OR: [
          { userId: session.user.id },
          { instructorId: session.user.id },
        ],
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Create message
    const message = await prisma.chat_messages.create({
      data: {
        conversationId,
        senderId: session.user.id,
        content: content?.trim() || "",
        attachmentUrl,
        attachmentType,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Update conversation timestamp
    await prisma.chat_conversations.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error: any) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
