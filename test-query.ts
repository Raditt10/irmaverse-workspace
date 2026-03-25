import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const rows = await prisma.$queryRawUnsafe(`
      SELECT
        fr.id,
        fr.userId,
        fr.type,
        fr.title,
        fr.description,
        fr.screenshotUrl,
        fr.status,
        fr.adminNote,
        fr.createdAt,
        fr.updatedAt,
        u.name as userName,
        u.email as userEmail,
        u.role as userRole
      FROM user_feedback_reports fr
      JOIN users u ON u.id = fr.userId
      WHERE 1=1
      ORDER BY fr.createdAt DESC
      LIMIT 1
    `)
    console.log("Success:", rows)
  } catch (e) {
    console.error("Error:", e)
  } finally {
    await prisma.$disconnect()
  }
}
main()
