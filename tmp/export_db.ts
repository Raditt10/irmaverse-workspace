
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const quizzes = await prisma.material_quizzes.findMany({
    select: {
      id: true,
      title: true,
      materialId: true,
      creatorId: true,
      createdAt: true
    }
  });

  const stats = {
    total: quizzes.length,
    mandiri: quizzes.filter(q => q.materialId === null).length,
    materialBound: quizzes.filter(q => q.materialId !== null).length,
    withCreator: quizzes.filter(q => q.creatorId !== null).length,
    withoutCreator: quizzes.filter(q => q.creatorId === null).length,
  };

  const data = { stats, quizzes };
  fs.writeFileSync('c:/laragon/www/irmaVerse/tmp/db_info.json', JSON.stringify(data, null, 2));
  console.log('DB info saved to c:/laragon/www/irmaVerse/tmp/db_info.json');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
