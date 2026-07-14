-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MAHASISWA', 'DOSEN', 'ADMIN_KAMPUS', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "StatusKampus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "StatusMahasiswa" AS ENUM ('AKTIF', 'CUTI', 'LULUS', 'DO');

-- CreateEnum
CREATE TYPE "Hari" AS ENUM ('SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU', 'MINGGU');

-- CreateEnum
CREATE TYPE "StatusJadwalTemplate" AS ENUM ('AKTIF', 'NONAKTIF');

-- CreateEnum
CREATE TYPE "StatusJadwalSesi" AS ENUM ('SCHEDULED', 'ONGOING', 'SELESAI', 'DIBATALKAN');

-- CreateEnum
CREATE TYPE "StatusAbsensi" AS ENUM ('HADIR', 'TERLAMBAT', 'ALPHA', 'IZIN', 'SAKIT');

-- CreateEnum
CREATE TYPE "MetodeAbsensi" AS ENUM ('QR', 'MANUAL_DOSEN', 'AUTO_SYSTEM');

-- CreateTable
CREATE TABLE "Kampus" (
    "id" TEXT NOT NULL,
    "namaKampus" TEXT NOT NULL,
    "kodeKampus" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radiusMeter" INTEGER NOT NULL DEFAULT 100,
    "status" "StatusKampus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "Kampus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "kampusId" TEXT,
    "nim" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterMahasiswa" (
    "id" TEXT NOT NULL,
    "kampusId" TEXT NOT NULL,
    "nim" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "prodi" TEXT NOT NULL,
    "status" "StatusMahasiswa" NOT NULL DEFAULT 'AKTIF',

    CONSTRAINT "MasterMahasiswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jurusan" (
    "id" TEXT NOT NULL,
    "kampusId" TEXT NOT NULL,
    "namaJurusan" TEXT NOT NULL,
    "kodeJurusan" TEXT NOT NULL,

    CONSTRAINT "Jurusan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kelas" (
    "id" TEXT NOT NULL,
    "kampusId" TEXT NOT NULL,
    "jurusanId" TEXT NOT NULL,
    "namaKelas" TEXT NOT NULL,
    "angkatan" INTEGER NOT NULL,

    CONSTRAINT "Kelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "mahasiswaId" TEXT NOT NULL,
    "kelasId" TEXT NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("mahasiswaId","kelasId")
);

-- CreateTable
CREATE TABLE "MataKuliah" (
    "id" TEXT NOT NULL,
    "kampusId" TEXT NOT NULL,
    "kodeMk" TEXT NOT NULL,
    "namaMk" TEXT NOT NULL,
    "sks" INTEGER NOT NULL,

    CONSTRAINT "MataKuliah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KelasMataKuliah" (
    "id" TEXT NOT NULL,
    "mataKuliahId" TEXT NOT NULL,
    "kelasId" TEXT NOT NULL,
    "dosenId" TEXT NOT NULL,

    CONSTRAINT "KelasMataKuliah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JadwalTemplate" (
    "id" TEXT NOT NULL,
    "kelasMataKuliahId" TEXT NOT NULL,
    "hari" "Hari" NOT NULL,
    "jamMulai" TIME NOT NULL,
    "jamSelesai" TIME NOT NULL,
    "ruangan" TEXT NOT NULL,
    "berlakuMulai" DATE NOT NULL,
    "berlakuSampai" DATE NOT NULL,
    "status" "StatusJadwalTemplate" NOT NULL DEFAULT 'AKTIF',

    CONSTRAINT "JadwalTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JadwalSesi" (
    "id" TEXT NOT NULL,
    "jadwalTemplateId" TEXT NOT NULL,
    "pertemuanKe" INTEGER NOT NULL,
    "tanggal" DATE NOT NULL,
    "jamMulai" TIME NOT NULL,
    "jamSelesai" TIME NOT NULL,
    "status" "StatusJadwalSesi" NOT NULL DEFAULT 'SCHEDULED',

    CONSTRAINT "JadwalSesi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRToken" (
    "id" TEXT NOT NULL,
    "jadwalSesiId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QRToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Absensi" (
    "id" TEXT NOT NULL,
    "mahasiswaId" TEXT NOT NULL,
    "jadwalSesiId" TEXT NOT NULL,
    "waktuAbsen" TIMESTAMP(3),
    "status" "StatusAbsensi" NOT NULL,
    "metode" "MetodeAbsensi" NOT NULL,
    "latitudeScan" DOUBLE PRECISION,
    "longitudeScan" DOUBLE PRECISION,
    "jarakMeter" INTEGER,
    "isLocationValid" BOOLEAN,

    CONSTRAINT "Absensi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbsensiLog" (
    "id" TEXT NOT NULL,
    "absensiId" TEXT NOT NULL,
    "statusLama" "StatusAbsensi" NOT NULL,
    "statusBaru" "StatusAbsensi" NOT NULL,
    "changedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbsensiLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HariLibur" (
    "id" TEXT NOT NULL,
    "kampusId" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "keterangan" TEXT NOT NULL,

    CONSTRAINT "HariLibur_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Kampus_kodeKampus_key" ON "Kampus"("kodeKampus");

-- CreateIndex
CREATE UNIQUE INDEX "Kampus_subdomain_key" ON "Kampus"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_kampusId_nim_key" ON "User"("kampusId", "nim");

-- CreateIndex
CREATE UNIQUE INDEX "MasterMahasiswa_kampusId_nim_key" ON "MasterMahasiswa"("kampusId", "nim");

-- CreateIndex
CREATE UNIQUE INDEX "QRToken_token_key" ON "QRToken"("token");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_kampusId_fkey" FOREIGN KEY ("kampusId") REFERENCES "Kampus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterMahasiswa" ADD CONSTRAINT "MasterMahasiswa_kampusId_fkey" FOREIGN KEY ("kampusId") REFERENCES "Kampus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jurusan" ADD CONSTRAINT "Jurusan_kampusId_fkey" FOREIGN KEY ("kampusId") REFERENCES "Kampus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kelas" ADD CONSTRAINT "Kelas_kampusId_fkey" FOREIGN KEY ("kampusId") REFERENCES "Kampus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kelas" ADD CONSTRAINT "Kelas_jurusanId_fkey" FOREIGN KEY ("jurusanId") REFERENCES "Jurusan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MataKuliah" ADD CONSTRAINT "MataKuliah_kampusId_fkey" FOREIGN KEY ("kampusId") REFERENCES "Kampus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KelasMataKuliah" ADD CONSTRAINT "KelasMataKuliah_mataKuliahId_fkey" FOREIGN KEY ("mataKuliahId") REFERENCES "MataKuliah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KelasMataKuliah" ADD CONSTRAINT "KelasMataKuliah_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KelasMataKuliah" ADD CONSTRAINT "KelasMataKuliah_dosenId_fkey" FOREIGN KEY ("dosenId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JadwalTemplate" ADD CONSTRAINT "JadwalTemplate_kelasMataKuliahId_fkey" FOREIGN KEY ("kelasMataKuliahId") REFERENCES "KelasMataKuliah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JadwalSesi" ADD CONSTRAINT "JadwalSesi_jadwalTemplateId_fkey" FOREIGN KEY ("jadwalTemplateId") REFERENCES "JadwalTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRToken" ADD CONSTRAINT "QRToken_jadwalSesiId_fkey" FOREIGN KEY ("jadwalSesiId") REFERENCES "JadwalSesi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absensi" ADD CONSTRAINT "Absensi_mahasiswaId_fkey" FOREIGN KEY ("mahasiswaId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absensi" ADD CONSTRAINT "Absensi_jadwalSesiId_fkey" FOREIGN KEY ("jadwalSesiId") REFERENCES "JadwalSesi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsensiLog" ADD CONSTRAINT "AbsensiLog_absensiId_fkey" FOREIGN KEY ("absensiId") REFERENCES "Absensi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbsensiLog" ADD CONSTRAINT "AbsensiLog_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HariLibur" ADD CONSTRAINT "HariLibur_kampusId_fkey" FOREIGN KEY ("kampusId") REFERENCES "Kampus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
