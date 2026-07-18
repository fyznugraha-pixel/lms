import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const admins = [
  { name: "Willy", email: "willy@tactlink.com", role: "ADMIN_KANTOR" },
  { name: "Supriatna", email: "supriatna@tactlink.com", role: "ADMIN_KANTOR" }
];

async function main() {
  console.log("Mulai seeding admin...");

  for (const admin of admins) {
    const passwordPlain = `${admin.name.toLowerCase()}123`;
    const passwordHash = await bcrypt.hash(passwordPlain, 10);

    try {
      const user = await prisma.user.upsert({
        where: { email: admin.email },
        update: {},
        create: {
          email: admin.email,
          passwordHash,
          namaLengkap: admin.name,
          role: "ADMIN_KANTOR", // Assuming ADMIN_KANTOR is the correct role for this
          isActive: true
        }
      });
      console.log(`Berhasil membuat admin: ${user.email} (Password: ${passwordPlain})`);
    } catch (error) {
      console.error(`Gagal membuat admin untuk ${admin.name}:`, error);
    }
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
