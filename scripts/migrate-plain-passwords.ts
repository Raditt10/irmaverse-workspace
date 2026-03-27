import { PrismaClient } from "@prisma/client"; // Langsung dari library
import bcrypt from "bcryptjs";

// Buat instance prisma di sini agar tidak tergantung file luar yang path-nya sering error di script
const prisma = new PrismaClient();

async function migratePlainPasswords() {
  console.log("Memulai migrasi password...");
  
  // Ambil semua user
  const users = await prisma.users.findMany();
  
  for (const user of users) {
    // Cek jika password ada dan belum di-hash
    if (user.password && !user.password.startsWith("$2b$")) {
      const hashed = await bcrypt.hash(user.password, 10);
      await prisma.users.update({
        where: { id: user.id },
        data: { password: hashed },
      });
      console.log(`✅ Password user ${user.email} berhasil di-hash.`);
    }
  }
  
  console.log("✨ Migrasi selesai.");
  await prisma.$disconnect();
  process.exit(0);
}

migratePlainPasswords().catch(async (e) => {
  console.error("❌ Terjadi error:", e);
  await prisma.$disconnect();
  process.exit(1);
});