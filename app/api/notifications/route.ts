import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/notifications
 * Fetch all notifications for the authenticated user.
 * Query params:
 *   - status: filter by status (optional, e.g. "unread")
 *   - limit: max number of results (default 50)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const statusFilter = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const where: any = { userId: session.user.id };
    if (statusFilter) {
      where.status = statusFilter;
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({
        where: {
          userId: session.user.id,
          status: "unread",
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("[GET /api/notifications] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/notifications
 * Update notification status (read, accepted, rejected).
 * Body:
 *   - id: notification ID (string) OR ids: notification IDs (string[])
 *   - status: new status ("read" | "accepted" | "rejected")
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ids, status, reason } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 },
      );
    }

    const validStatuses = ["read", "accepted", "rejected"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Mark all unread as read (bulk)
    if (ids && Array.isArray(ids)) {
      await prisma.notification.updateMany({
        where: {
          id: { in: ids },
          userId: session.user.id,
        },
        data: { status },
      });

      return NextResponse.json({ success: true, updated: ids.length });
    }

    // Single notification update
    if (!id) {
      return NextResponse.json(
        { error: "Notification id is required" },
        { status: 400 },
      );
    }

    // Verify ownership
    const notification = await prisma.notification.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 },
      );
    }

    // For invitation type: handle accept/reject
    if (notification.type === "invitation") {
      const inviteToken = notification.inviteToken;
      const materialId = notification.resourceId;
      
      console.log("[PATCH /api/notifications] Handling invitation response:", {
        inviteToken,
        materialId,
        status,
        notificationId: id
      });
      
      if (status === "accepted" || status === "rejected") {
        // Update the materialinvite
        // Strategy: Try by token first, if fails, try by materialId + userId (fallback)
        let invite = null;
        if (inviteToken) {
          invite = await prisma.materialInvite.findUnique({
            where: { token: inviteToken },
          });
        }
        
        if (!invite && materialId) {
          console.log("[PATCH /api/notifications] token failed, trying fallback by materialId:", materialId);
          invite = await prisma.materialInvite.findFirst({
            where: { 
              materialId: materialId,
              userId: session.user.id
            },
          });
        }

        if (invite) {
          console.log("[PATCH /api/notifications] Found invite, updating status to:", status);
          await prisma.materialInvite.update({
            where: { id: invite.id },
            data: { 
              status, 
              reason: status === "rejected" ? reason : null,
              updatedAt: new Date() 
            } as any,
          });

          // If accepted, create course enrollment
          if (status === "accepted") {
            console.log("[PATCH /api/notifications] Accepted! Creating enrollment for user:", session.user.id);
            await prisma.courseEnrollment.upsert({
              where: {
                materialId_userId: {
                  materialId: invite.materialId,
                  userId: session.user.id,
                },
              },
              update: { 
                role: "user",
                enrolledAt: new Date()
              },
              create: {
                id: `enr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                materialId: invite.materialId,
                userId: session.user.id,
                role: "user",
                enrolledAt: new Date(),
              },
            });
          }
        } else {
          console.log("[PATCH /api/notifications] WARNING: No invite record found even with fallback for token:", inviteToken);
        }
      }
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { status },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, notification: updated });
  } catch (error) {
    console.error("[PATCH /api/notifications] Error:", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/notifications/mark-all-read
 * Convenience endpoint to mark all unread notifications as read.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        status: "unread",
      },
      data: { status: "read" },
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
    });
  } catch (error) {
    console.error("[POST /api/notifications] Error:", error);
    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 },
    );
  }
}
