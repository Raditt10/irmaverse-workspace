import prisma from "@/lib/prisma";
import { activity_logs_type } from "@prisma/client";

interface RecordActivityParams {
  userId: string;
  type: activity_logs_type;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Record a user activity log without awarding XP.
 * Used for admin actions, superadmin actions, and other non-gamified activities.
 */
export async function recordActivity({
  userId,
  type,
  title,
  description,
  metadata,
}: RecordActivityParams) {
  try {
    return await prisma.activity_logs.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        type,
        title,
        description,
        metadata: metadata || undefined,
        xpEarned: 0, // Admin activities never award XP
      },
    });
  } catch (error) {
    console.error("Error recording activity:", error);
    // We don't throw error to avoid breaking the main process
    return null;
  }
}
