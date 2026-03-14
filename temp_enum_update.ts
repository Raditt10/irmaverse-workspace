import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.$executeRawUnsafe(`ALTER TABLE users MODIFY COLUMN role ENUM('user', 'admin', 'super_admin', 'instruktur') DEFAULT 'user'`)
  console.log('Successfully updated Role enum to include super_admin')
}

main()
  .catch(async (e) => {
    console.error("Failed with 'users', trying 'User'...")
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE User MODIFY COLUMN role ENUM('user', 'admin', 'super_admin', 'instruktur') DEFAULT 'user'`)
      console.log('Successfully updated Role enum to include super_admin on User table')
    } catch (e2) {
      console.error(e2)
      process.exit(1)
    }
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
