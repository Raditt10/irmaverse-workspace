import prisma from "@/lib/prisma";
import type { notifications_type } from "@prisma/client";

/**
 * Server-side helper to create a notification and return it for WebSocket emission.
 * This should be called from API routes, not from the client.
 */
export async function createNotification({
  userId,
  type = "basic",
  title,
  message,
  icon,
  resourceType,
  resourceId,
  actionUrl,
  inviteToken,
  senderId,
}: {
  userId: string;
  type?: notifications_type;
  title: string;
  message: string;
  icon?: string;
  resourceType?: string;
  resourceId?: string;
  actionUrl?: string;
  inviteToken?: string;
  senderId?: string;
}) {
  const notification = await prisma.notifications.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      type,
      title,
      message,
      icon,
      resourceType,
      resourceId,
      actionUrl,
      inviteToken,
      senderId,
      updatedAt: new Date(),
    },
    include: {
      users_notifications_senderIdTousers: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  return notification;
}

/**
 * Create multiple notifications at once (e.g. when inviting multiple users).
 * Returns all created notifications for WebSocket emission.
 */
export async function createBulkNotifications(
  notifications: {
    userId: string;
    type?: notifications_type;
    title: string;
    message: string;
    icon?: string;
    resourceType?: string;
    resourceId?: string;
    actionUrl?: string;
    inviteToken?: string;
    senderId?: string;
  }[],
) {
  const results = await Promise.all(
    notifications.map((n) => createNotification(n)),
  );
  return results;
}
