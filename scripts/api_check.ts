import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const email = "iniakuraditt@gmail.com";
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.log("User not found");
    return;
  }

  console.log("Found User:", user.id, user.role);

  const where: any = {};

  // Logic from the API
  const isPrivileged = user.role === "instruktur" || user.role === "admin";

  if (!isPrivileged) {
    where.OR = [
      {
        courseenrollment: { some: { userId: user.id } },
      },
      {
        materialinvite: { some: { userId: user.id, status: "accepted" } },
      },
    ];
  }

  console.log("Executing findMany with where:", JSON.stringify(where, null, 2));

  const materials = await prisma.material.findMany({
    where,
    include: {
      courseenrollment: {
        where: { userId: user.id },
        select: { id: true },
      },
    },
  });

  console.log("Result Count:", materials.length);
  console.log(
    "Materials:",
    materials.map((m) => ({
      id: m.id,
      title: m.title,
      isJoined: (m.courseenrollment || []).length > 0,
    })),
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
