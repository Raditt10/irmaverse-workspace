import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - Fetch conversations for current user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    let conversations;

    if (userRole === "instruktur") {
      // Instruktur: get all conversations where they are the instructor
      conversations = await prisma.chat_conversations.findMany({
        where: { instructorId: userId },
        include: {
          users_chat_conversations_userIdTousers: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          chat_messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          _count: {
            select: {
              chat_messages: {
                where: {
                  isRead: false,
                  senderId: { not: userId },
                },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      return NextResponse.json(
        conversations.map((conv) => ({
          id: conv.id,
          participant: conv.users_chat_conversations_userIdTousers,
          lastMessage: conv.chat_messages[0] || null,
          unreadCount: conv._count.chat_messages,
          updatedAt: conv.updatedAt,
        }))
      );
    } else {
      // User: get all conversations where they are the user
      conversations = await prisma.chat_conversations.findMany({
        where: { userId },
        include: {
          users_chat_conversations_instructorIdTousers: {
            select: {
              id: true,
              name: true,
              email: true,
              bidangKeahlian: true,
              avatar: true,
            },
          },
          chat_messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          _count: {
            select: {
              chat_messages: {
                where: {
                  isRead: false,
                  senderId: { not: userId },
                },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      return NextResponse.json(
        conversations.map((conv) => ({
          id: conv.id,
          participant: conv.users_chat_conversations_instructorIdTousers,
          lastMessage: conv.chat_messages[0] || null,
          unreadCount: conv._count.chat_messages,
          updatedAt: conv.updatedAt,
        }))
      );
    }
  } catch (error: any) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// POST - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const userRole = session.user.role;

    let targetUserId: string;
    let targetInstructorId: string;

    if (userRole === "instruktur" || userRole === "admin" || userRole === "super_admin") {
      // The current user is an instructor (or admin) starting a conversation with a student
      const { userId } = body;
      if (!userId) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 });
      }

      // Check if student exists
      const student = await prisma.users.findUnique({
        where: { id: userId },
      });

      if (!student || student.role !== "user") {
        return NextResponse.json({ error: "Valid User not found" }, { status: 404 });
      }

      targetUserId = userId;
      targetInstructorId = session.user.id;
    } else {
      // The current user is a student starting a conversation with an instructor
      const { instructorId } = body;
      if (!instructorId) {
        return NextResponse.json({ error: "Instructor ID is required" }, { status: 400 });
      }

      // Check if instructor exists and is actually an instructor
      const instructor = await prisma.users.findFirst({
        where: {
          id: instructorId,
          role: "instruktur",
        },
      });

      if (!instructor) {
        return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
      }

      targetUserId = session.user.id;
      targetInstructorId = instructorId;
    }

    // Check if conversation already exists
    const existingConversation = await prisma.chat_conversations.findUnique({
      where: {
        userId_instructorId: {
          userId: targetUserId,
          instructorId: targetInstructorId,
        },
      },
      include: {
        users_chat_conversations_userIdTousers: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        users_chat_conversations_instructorIdTousers: {
          select: {
            id: true,
            name: true,
            email: true,
            bidangKeahlian: true,
            avatar: true,
          },
        },
      },
    });

    if (existingConversation) {
      return NextResponse.json({
        id: existingConversation.id,
        // Depending on who called this, we want to return the OTHER participant as `participant`
        participant: (userRole === "instruktur" || userRole === "admin" || userRole === "super_admin")
          ? existingConversation.users_chat_conversations_userIdTousers
          : existingConversation.users_chat_conversations_instructorIdTousers,
        lastMessage: null,
        unreadCount: 0,
        updatedAt: existingConversation.updatedAt,
      });
    }

    // Create new conversation
    const conversation = await prisma.chat_conversations.create({
      data: {
        id: crypto.randomUUID(),
        userId: targetUserId,
        instructorId: targetInstructorId,
        updatedAt: new Date(),
      },
      include: {
        users_chat_conversations_userIdTousers: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        users_chat_conversations_instructorIdTousers: {
          select: {
            id: true,
            name: true,
            email: true,
            bidangKeahlian: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: conversation.id,
      participant: (userRole === "instruktur" || userRole === "admin" || userRole === "super_admin")
        ? conversation.users_chat_conversations_userIdTousers
        : conversation.users_chat_conversations_instructorIdTousers,
      lastMessage: null,
      unreadCount: 0,
      updatedAt: conversation.updatedAt,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
