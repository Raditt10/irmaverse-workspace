import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testCycle() {
  console.log("--- STARTING TEST CYCLE ---")
  
  // 0. Find a real instructor
  const user = await prisma.users.findFirst({
    where: { role: 'instruktur' }
  })
  
  if (!user) {
    console.error("❌ No instructor found in DB! Cannot run test.")
    return
  }
  
  const instructorId = user.id
  console.log(`Using instructor: ${user.name} (${instructorId})`)

  // 1. Create a dummy material
  const material = await (prisma as any).material.create({
    data: {
      id: `test-mat-${Date.now()}`,
      title: "Test Material Deletion",
      grade: "X",
      instructorId: instructorId,
      category: "Wajib",
      updatedAt: new Date(),
    }
  })
  console.log(`Created Material: ${material.id}`)

  // 2. Create a quiz for it
  const quiz = await (prisma as any).material_quizzes.create({
    data: {
      id: `test-quiz-${Date.now()}`,
      title: "Test Quiz",
      materialId: material.id,
      updatedAt: new Date(),
    }
  })
  console.log(`Created Quiz: ${quiz.id} assigned to ${material.id}`)

  // 3. Create a rekapan for it
  const rekapan = await (prisma as any).rekapan.create({
    data: {
      id: `test-rekap-${Date.now()}`,
      materialId: material.id,
      content: "Test Content",
      updatedAt: new Date(),
    }
  })
  console.log(`Created Rekapan: ${rekapan.id} assigned to ${material.id}`)

  // 4. Manually perform the "unset" like in our API (using Prisma first to check behavior)
  console.log("Unsetting relations via Prisma updateMany...")
  await (prisma as any).material_quizzes.updateMany({
    where: { materialId: material.id },
    data: { materialId: null }
  })
  await (prisma as any).rekapan.updateMany({
    where: { materialId: material.id },
    data: { materialId: null }
  })

  // 5. Verify they are UNSET
  const checkQuiz = await (prisma as any).material_quizzes.findUnique({ where: { id: quiz.id } })
  const checkRekap = await (prisma as any).rekapan.findUnique({ where: { id: rekapan.id } })
  console.log(`Quiz materialId after unset: ${checkQuiz?.materialId}`)
  console.log(`Rekapan materialId after unset: ${checkRekap?.materialId}`)

  // 6. Delete the material
  console.log("Deleting Material...")
  await (prisma as any).material.delete({ where: { id: material.id } })

  // 7. FINAL CHECK
  const finalQuiz = await (prisma as any).material_quizzes.findUnique({ where: { id: quiz.id } })
  const finalRekap = await (prisma as any).rekapan.findUnique({ where: { id: rekapan.id } })
  
  if (finalQuiz) {
    console.log("✅ SUCCESS: Quiz survived deletion!")
  } else {
    console.log("❌ FAILURE: Quiz was deleted!")
  }

  if (finalRekap) {
    console.log("✅ SUCCESS: Rekapan survived deletion!")
  } else {
    console.log("❌ FAILURE: Rekapan was deleted!")
  }
}

testCycle()
  .catch(e => {
    console.error("Error during test cycle:", e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
