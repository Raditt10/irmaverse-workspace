
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const email = "iniakuraditt@gmail.com"
  const users = await prisma.users.findMany({
    where: { email }
  })
  
  console.log("Users with email:", email, users.map(u => ({ id: u.id, email: u.email, role: u.role })))
  
  if (users.length > 0) {
    const userId = users[0].id
    const notifications = await prisma.notifications.findMany({
      where: { userId }
    })
    console.log("Notifications for user:", notifications.map(n => ({ id: n.id, type: n.type, status: n.status, inviteToken: n.inviteToken })))
    
    const invites = await prisma.materialinvite.findMany({
      where: { userId }
    })
    console.log("Invites for user:", invites.map(i => ({ id: i.id, status: i.status, token: i.token })))
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
