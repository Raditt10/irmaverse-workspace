
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.users.findMany({
    take: 3,
    orderBy: { updatedAt: 'desc' }
  })
  
  const invitations = await prisma.materialinvite.findMany({
    include: { material: true }
  })
  
  const materials = await prisma.material.findMany()
  
  const enrollments = await prisma.courseenrollment.findMany()

  const data = {
    users: users.map(u => ({ id: u.id, email: u.email, role: u.role })),
    invitations: invitations.map(i => ({ 
      id: i.id, 
      userId: i.userId, 
      status: i.status, 
      materialTitle: i.material.title,
      materialId: i.materialId
    })),
    materials: materials.map(m => ({ id: m.id, title: m.title })),
    enrollmentsCount: enrollments.length,
    enrollmentsDetails: enrollments.map(e => ({ materialId: e.materialId, userId: e.userId, role: e.role }))
  }
  
  console.log(JSON.stringify(data, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
