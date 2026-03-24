import prisma from "@/lib/prisma";

export async function ensureFeedbackReportsTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS user_feedback_reports (
      id VARCHAR(191) NOT NULL,
      userId VARCHAR(191) NOT NULL,
      type ENUM('bug','feature') NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      status ENUM('open','in_review','done','rejected') NOT NULL DEFAULT 'open',
      adminNote TEXT NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      INDEX user_feedback_reports_userId_idx (userId),
      INDEX user_feedback_reports_type_idx (type),
      INDEX user_feedback_reports_status_idx (status),
      INDEX user_feedback_reports_createdAt_idx (createdAt),
      CONSTRAINT user_feedback_reports_userId_fkey
        FOREIGN KEY (userId) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

export const FEEDBACK_TYPES = ["bug", "feature"] as const;
export const FEEDBACK_STATUSES = [
  "open",
  "in_review",
  "done",
  "rejected",
] as const;
