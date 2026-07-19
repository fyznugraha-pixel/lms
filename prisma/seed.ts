import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding data...')
  const passwordHash = await bcrypt.hash('password123', 10)

  // 1. Create Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@system.com' },
    update: {},
    create: {
      email: 'superadmin@system.com',
      passwordHash,
      role: 'SUPER_ADMIN',
      namaLengkap: 'Super Administrator',
    },
  })
  console.log(`Created super admin: ${superAdmin.email}`)

  // 2. Create Admin Kantor
  const adminKantor = await prisma.user.upsert({
    where: { email: 'admin@tactlink.com' },
    update: {},
    create: {
      email: 'admin@tactlink.com',
      passwordHash,
      role: 'ADMIN_KANTOR',
      namaLengkap: 'Admin HRD',
    },
  })
  console.log(`Created admin kantor: ${adminKantor.email}`)
  
  // 3. Create Karyawan sample
  const karyawan = await prisma.user.upsert({
    where: { email: 'karyawan@tactlink.com' },
    update: {},
    create: {
      email: 'karyawan@tactlink.com',
      passwordHash,
      role: 'KARYAWAN',
      namaLengkap: 'Karyawan Teladan',
    },
  })
  console.log(`Created karyawan: ${karyawan.email}`)

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
