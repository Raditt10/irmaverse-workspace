import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seeding data...");

  // ── CLEAR ─────────────────────────────────────────────────────────────────
  console.log("🧹 Clearing existing data...");
  const tableNames = [
    "chat_messages",
    "chat_conversations",
    "user_badges",
    "activity_logs",
    "badges",
    "friendships",
    "notifications",
    "materialinvite",
    "courseenrollment",
    "program_enrollments",
    "attendance",
    "saved_news",
    "quiz_attempts",
    "quiz_options",
    "quiz_questions",
    "material_quizzes",
    "rekapan",
    "material",
    "programs",
    "news",
    "schedules",
    "competitions",
    "favorite_instructors",
    "forum_messages",
    "accounts",
    "users",
  ];

  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0;`);
  for (const tableName of tableNames) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${tableName}\`;`);
    } catch (e) {
      console.log(`⚠️  Could not truncate ${tableName}, trying delete...`);
      await prisma.$executeRawUnsafe(`DELETE FROM \`${tableName}\`;`);
    }
  }
  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1;`);
  console.log("🧹 Database cleared");

  console.log("🌱 Database is now empty. No seed accounts created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
