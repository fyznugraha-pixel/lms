import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const internNames = [
  "Valencia Eunike",
  "Fayiz Apriwansyah Nugraha",
  "Talitha Zahira Hendriadi",
  "Muhammad Azka Najhan",
  "Izzah Zahra Answar",
  "Hana Shafa Dewi",
  "Keisya",
  "Desti Mutiara Anggun",
  "ihsan mustofa",
  "Gayuh Makbul Laksono",
  "Gilang",
  "Siska Rahmawati",
  "Aulia Rahman",
  "Serlyta Alia Kastra",
  "Elsa Della Panggabean",
  "Diana Nur Beti",
  "Ema Meliani",
  "M. Raenaldi",
  "Muhammad Rizal Abdillah",
  "Zharfan Azizah Huda",
  "Dinda Fitria Nur Rizki",
  "Yosefa Citra Kartika",
  "Tria Damayanti",
  "Muhammad Ilham Nur Razak",
  "Faiz Risang Alfatah",
  "Supriatna"
];

async function main() {
  console.log("Mulai melakukan seeding 25 akun intern...");

  for (const fullName of internNames) {
    const firstNameRaw = fullName.trim().split(" ")[0].toLowerCase();
    const firstName = firstNameRaw.replace(/[^a-z]/g, "");

    const email = `${firstName}@tactlink.com`;
    const passwordPlain = `${firstName}123`;
    const passwordHash = await bcrypt.hash(passwordPlain, 10);

    try {
      const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          passwordHash,
          namaLengkap: fullName.trim(),
          role: "KARYAWAN",
          isActive: true
        }
      });
      console.log(`Berhasil membuat akun: ${user.email} (Password: ${passwordPlain})`);
    } catch (error) {
      console.error(`Gagal membuat akun untuk ${fullName}:`, error);
    }
  }

  console.log("Seeding selesai!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
