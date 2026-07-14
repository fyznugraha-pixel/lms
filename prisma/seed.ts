import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding data...')
  const passwordHash = await bcrypt.hash('password123', 10)

  // 1. Create Super Admin (tanpa kampus)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@system.com' },
    update: {},
    create: {
      email: 'superadmin@system.com',
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  })
  console.log(`Created super admin: ${superAdmin.email}`)

  // 2. Create Kampus 'Unpad'
  const kampusUnpad = await prisma.kampus.upsert({
    where: { kodeKampus: 'UNPAD' },
    update: {},
    create: {
      namaKampus: 'Universitas Padjadjaran',
      kodeKampus: 'UNPAD',
      subdomain: 'unpad',
      latitude: -6.926128,
      longitude: 107.774574,
      radiusMeter: 200,
    },
  })
  console.log(`Created kampus: ${kampusUnpad.namaKampus}`)

  // 3. Create Admin untuk Unpad
  const adminUnpad = await prisma.user.upsert({
    where: { email: 'admin@unpad.com' },
    update: {},
    create: {
      email: 'admin@unpad.com',
      passwordHash,
      role: 'ADMIN_KAMPUS',
      kampusId: kampusUnpad.id,
    },
  })
  console.log(`Created admin kampus: ${adminUnpad.email}`)
  
  // 4. Create Dosen & Mahasiswa sample
  const dosen = await prisma.user.upsert({
    where: { email: 'dosen@unpad.com' },
    update: {},
    create: {
      email: 'dosen@unpad.com',
      passwordHash,
      role: 'DOSEN',
      kampusId: kampusUnpad.id,
    },
  })
  console.log(`Created dosen: ${dosen.email}`)

  const mahasiswa = await prisma.user.upsert({
    where: { email: 'mhs@unpad.com' },
    update: {},
    create: {
      email: 'mhs@unpad.com',
      passwordHash,
      role: 'MAHASISWA',
      kampusId: kampusUnpad.id,
      nim: '140810180001'
    },
  })
  console.log(`Created mahasiswa: ${mahasiswa.email}`)

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
