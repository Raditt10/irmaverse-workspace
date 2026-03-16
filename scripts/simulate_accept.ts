
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const email = "iniakuraditt@gmail.com"
  const user = await prisma.users.findUnique({ where: { email } })
  if (!user) return console.log("User not found")
  
  const token = "b3ogo97wwfnjhd5v3zegb" // KWH 2 token
  console.log("Simulating acceptance for token:", token)
  
  // 1. Update invite
  await prisma.materialinvite.update({
    where: { token },
    data: { status: 'accepted' }
  })
  
  // 2. Update notification
  await prisma.notifications.updateMany({
    where: { inviteToken: token },
    data: { status: 'accepted' }
  })
  
  // 3. Create enrollment (simplified)
  await prisma.courseenrollment.upsert({
    where: {
      materialId_userId: {
        materialId: "cl80hjf5qrw", // KWH 2 id
        userId: user.id
      }
    },
    update: { role: 'user' },
    create: {
      id: `enr-sim-${Date.now()}`,
      materialId: "cl80hjf5qrw",
      userId: user.id,
      role: 'user'
    }
  })
  
  console.log("Simulation complete. Checking visibility...")
  
  const where: any = {
    OR: [
      { courseenrollment: { some: { userId: user.id } } },
      { materialinvite: { some: { userId: user.id, status: "accepted" } } }
    ]
  }
  
  const materials = await prisma.material.findMany({
    where,
    select: { id: true, title: true }
  })
  
  console.log("Visible Materials:", materials)
}

main().catch(console.error).finally(() => prisma.$disconnect())
