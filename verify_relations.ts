import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const materials = await prisma.material.findMany({
    take: 5,
    include: {
      material_quizzes: true,
      rekapan: true
    }
  })

  console.log("Checking last 5 materials:")
  materials.forEach(m => {
    console.log(`Material: ${m.title} (${m.id})`)
    console.log(`- Quizzes: ${(m as any).material_quizzes?.length || 0}`)
    console.log(`- Rekapan: ${(m as any).rekapan ? "Yes" : "No"}`)
  })
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
