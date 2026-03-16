
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const email = "iniakuraditt@gmail.com"
  const materialTitle = "KWH 2"
  
  console.log(`--- TRACING ${materialTitle} for ${email} ---`)
  
  const user = await prisma.users.findUnique({ where: { email } })
  if (!user) return console.log("User not found")
  console.log("User ID:", user.id)

  const material = await prisma.material.findFirst({
    where: { title: { contains: materialTitle } }
  })
  if (!material) return console.log("Material not found")
  console.log("Material ID:", material.id)

  const invite = await prisma.materialinvite.findFirst({
    where: { 
      materialId: material.id,
      userId: user.id
    }
  })
  console.log("Invite:", invite)

  const enrollment = await prisma.courseenrollment.findFirst({
    where: {
      materialId: material.id,
      userId: user.id
    }
  })
  console.log("Enrollment:", enrollment)

  const notification = await prisma.notifications.findFirst({
    where: {
      userId: user.id,
      resourceId: material.id,
      type: "invitation"
    },
    orderBy: { createdAt: 'desc' }
  })
  console.log("Latest Notification:", notification)
}

main().catch(console.error)
