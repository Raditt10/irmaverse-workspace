import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("--- KWH 2 TRACE ---");

  // Find the material
  const material = await prisma.material.findFirst({
    where: { title: { contains: "KWH 2" } },
  });

  if (!material) {
    console.log("Material 'KWH 2' not found");
  } else {
    console.log("Found Material:", material.id, material.title);

    // Find all invites for this material
    const invites = await prisma.materialinvite.findMany({
      where: { materialId: material.id },
      include: {
        users_materialinvite_userIdTousers: { select: { email: true } },
      },
    });
    console.log(
      "Invites for KWH 2:",
      invites.map((i) => ({
        id: i.id,
        user: i.users_materialinvite_userIdTousers.email,
        status: i.status,
        token: i.token,
      })),
    );

    // Find all notifications related to this material
    const notifications = await prisma.notification.findMany({
      where: { resourceId: material.id, resourceType: "material" },
      include: { user: { select: { email: true } } },
    });
    console.log(
      "Notifications for KWH 2:",
      notifications.map((n) => ({
        id: n.id,
        user: n.user.email,
        status: n.status,
        type: n.type,
        inviteToken: n.inviteToken,
      })),
    );
  }

  console.log("\n--- USER STATUS CHECK ---");
  const email = "iniakuraditt@gmail.com";
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      courseenrollment: true,
      materialinvite_materialinvite_userIdTousers: {
        include: { material: true },
      },
    },
  });

  if (user) {
    console.log("User:", user.email);
    console.log("Role:", user.role);
    console.log("Enrollments:", user.courseenrollment.length);
    console.log(
      "Invites:",
      (user as any).materialinvite_materialinvite_userIdTousers.map(
        (i: any) => ({
          material: i.material.title,
          status: i.status,
          token: i.token,
        }),
      ),
    );
  }

  console.log("--- TRACE END ---");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
