
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const quizzes = await prisma.material_quizzes.findMany({
    select: {
      id: true,
      title: true,
      materialId: true,
      creatorId: true,
    }
  })
  console.log("All Quizzes:", JSON.stringify(quizzes, null, 2))
  
  const users = await prisma.users.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      name: true
    }
  })
  console.log("All Users:", JSON.stringify(users, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
