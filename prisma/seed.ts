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

  // 2. Create Kampus 'Telkom'
  const kampusTelkom = await prisma.kampus.upsert({
    where: { kodeKampus: 'TELKOM' },
    update: {},
    create: {
      namaKampus: 'Telkom University',
      kodeKampus: 'TELKOM',
      subdomain: 'telkom',
      latitude: -6.974001,
      longitude: 107.630348,
      radiusMeter: 200,
    },
  })
  console.log(`Created kampus: ${kampusTelkom.namaKampus}`)

  // 3. Create Admin untuk Telkom
  const adminTelkom = await prisma.user.upsert({
    where: { email: 'admin@telkom.com' },
    update: {},
    create: {
      email: 'admin@telkom.com',
      passwordHash,
      role: 'ADMIN_KAMPUS',
      kampusId: kampusTelkom.id,
    },
  })
  console.log(`Created admin kampus: ${adminTelkom.email}`)
  
  // 4. Create Dosen & Mahasiswa sample
  const dosen = await prisma.user.upsert({
    where: { email: 'dosen@telkom.com' },
    update: {},
    create: {
      email: 'dosen@telkom.com',
      passwordHash,
      role: 'DOSEN',
      kampusId: kampusTelkom.id,
    },
  })
  console.log(`Created dosen: ${dosen.email}`)

  const mahasiswa = await prisma.user.upsert({
    where: { email: 'mhs@telkom.com' },
    update: {},
    create: {
      email: 'mhs@telkom.com',
      passwordHash,
      role: 'MAHASISWA',
      kampusId: kampusTelkom.id,
      nim: '1301201234'
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
