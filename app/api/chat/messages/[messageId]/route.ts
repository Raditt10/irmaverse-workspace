import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PATCH - Edit message
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId } = await params;
    const { content } = await req.json();

    // Get message
    const message = await prisma.chat_messages.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Check if user is the sender
    if (message.senderId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if message is less than 5 minutes old
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    const fiveMinutes = 5 * 60 * 1000;

    if (messageAge > fiveMinutes) {
      return NextResponse.json(
        { error: "Cannot edit message older than 5 minutes" },
        { status: 400 }
      );
    }

    // Update message
    const updatedMessage = await prisma.chat_messages.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
        editedAt: new Date(),
      },
    });

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error("Error editing message:", error);
    return NextResponse.json(
      { error: "Failed to edit message" },
      { status: 500 }
    );
  }
}

// DELETE - Delete message
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId } = await params;

    // Get message
    const message = await prisma.chat_messages.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Check if user is the sender
    if (message.senderId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if message is less than 5 minutes old
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    const fiveMinutes = 5 * 60 * 1000;

    if (messageAge > fiveMinutes) {
      return NextResponse.json(
        { error: "Cannot delete message older than 5 minutes" },
        { status: 400 }
      );
    }

    // Soft delete message
    const deletedMessage = await prisma.chat_messages.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        content: "Pesan telah dihapus",
      },
    });

    return NextResponse.json(deletedMessage);
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
