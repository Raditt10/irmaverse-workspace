const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const activities = await prisma.activityLog.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { role: true, name: true } } }
  });
  console.log('Activities:', JSON.stringify(activities, null, 2));

  const adminUsers = await prisma.user.findMany({
    where: { role: { in: ['admin', 'super_admin'] } },
    select: { id: true, name: true, role: true }
  });
  console.log('Admins:', JSON.stringify(adminUsers, null, 2));

  // Let's create a test activity for the first admin
  if (adminUsers.length > 0) {
    const adminId = adminUsers[0].id;
    try {
        const newAct = await prisma.activityLog.create({
            data: {
                userId: adminId,
                type: 'admin_login',
                title: 'Test Admin Login Activity',
                description: 'This is a test activity for debugging',
                xpEarned: 0
            }
        });
        console.log('Created test activity:', newAct);
    } catch(err) {
        console.error('Error creating activity:', err.message);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  });
