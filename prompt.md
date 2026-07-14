# PROMPT UNTUK ANTIGRAVITY — Sistem Absensi Multi-Kampus

## ATURAN KERJA (BACA DULU SEBELUM MULAI)

1. **JANGAN auto-approve/auto-commit perubahan apapun** tanpa saya review dan approve secara eksplisit terlebih dahulu. Setiap perubahan signifikan (skema database, struktur folder, logic inti) harus ditawarkan sebagai rencana dulu, tunggu konfirmasi saya, baru dieksekusi.
2. Kerjakan **per modul/fitur**, jangan generate seluruh sistem sekaligus dalam satu langkah besar. Setelah 1 modul selesai, berhenti dan tunggu review saya sebelum lanjut ke modul berikutnya.
3. Kalau ada requirement di bawah yang ambigu atau kamu perlu asumsi, **tanyakan dulu**, jangan menebak sendiri lalu jalan.
4. Ikuti struktur data dan alur logika yang sudah saya tentukan di bawah — jangan mengganti pendekatan (misal ganti dari Prisma ke ORM lain, atau ganti struktur multi-tenant) tanpa didiskusikan dulu.
5. **Sebelum eksekusi tiap fase**, ringkas ulang pemahamanmu tentang apa yang akan kamu bangun (2-5 poin singkat). Ini supaya saya bisa koreksi kalau ada kesalahpahaman sebelum kode ditulis, bukan sesudah.
6. **Jangan install dependency/library baru** di luar yang sudah disebutkan di stack tanpa izin eksplisit dari saya — termasuk library kecil seperti date formatter, icon set, dll. Tanyakan dulu, sebutkan alasannya.
7. **Jangan menambah fitur** yang menurutmu "related" atau "akan berguna" di luar yang diminta di tiap fase — walau niatnya membantu. Lihat juga bagian OUT OF SCOPE di bawah.

---

## 1. OVERVIEW PROJECT

Sistem absensi perkuliahan berbasis QR Code untuk kebutuhan pendidikan, digunakan oleh **multiple kampus** (partnership B2B, bukan 1 institusi tunggal). Setiap kampus punya dashboard dan data yang terisolasi, tapi berjalan di **satu aplikasi & satu database** (multi-tenant, bukan multi-deploy).

### Tujuan Utama
- Mahasiswa absen dengan scan QR code yang ditampilkan dosen di kelas
- QR bersifat **rotating/dynamic** (refresh tiap 10-15 detik) untuk mencegah kecurangan titip-scan via screenshot
- Divalidasi tambahan dengan **geofencing lokasi** (radius dari titik kampus)
- Ada 3 role UI: **Mahasiswa**, **Dosen**, **Super Admin** (dan opsional **Admin Kampus** per tenant)

---

## 2. TECH STACK (WAJIB, JANGAN DIUBAH TANPA DISKUSI)

| Layer | Teknologi |
|---|---|
| Frontend + Backend | **Next.js** (App Router), TypeScript |
| Styling | **Tailwind CSS** |
| Database | **PostgreSQL** |
| ORM | **Prisma** |
| Hosting DB | **Supabase** (evaluasi Free vs Pro tier sesuai kebutuhan produksi — jangan asumsikan free tier cukup untuk produksi karena ada auto-pause 7 hari inactivity) |
| Hosting App | **Vercel** |
| PWA | `next-pwa`, dengan manifest untuk installable app (bukan native app) |
| QR Generation & Scan | Library QR generation di backend (misal `qrcode`), scan di frontend pakai `html5-qrcode` atau `react-qr-reader` |
| Auth | JWT, role-based middleware |
| Validasi input | **Zod** — semua request body/query di API routes wajib divalidasi pakai schema Zod sebelum diproses |
| Password hashing | **bcrypt**, minimal 10 salt rounds |

### Guardrail Teknis Tambahan (WAJIB DIIKUTI)

- **TypeScript strict mode** wajib aktif (`"strict": true` di `tsconfig.json`). Jangan gunakan `any` kecuali benar-benar tidak terhindarkan, dan kalau terpaksa, beri komentar alasannya.
- **Format response API konsisten** di seluruh endpoint, gunakan envelope seperti ini:
  ```json
  // Sukses
  { "success": true, "data": { ... } }
  // Error
  { "success": false, "error": { "message": "...", "code": "..." } }
  ```
- **Environment variables**: buat file `.env.example` berisi semua variabel yang dibutuhkan (connection string Supabase, JWT secret, dll) dengan value placeholder — JANGAN pernah hardcode credential di kode.
- **Rate limiting** wajib diterapkan minimal di endpoint `login` dan `scan QR` (misal maksimal 5-10 request/menit per IP/user), untuk mencegah brute force token atau spam scan.
- **Semua koordinat/waktu sensitif** (misal `expiresAt` token QR, validasi jam sesi) dihitung di **server**, tidak pernah dipercaya dari input client.

---

## 3. ARSITEKTUR MULTI-TENANT (KRUSIAL — BACA BENAR-BENAR)

- **Satu database, shared schema**, isolasi data lewat kolom `kampusId` di hampir semua tabel.
- **JANGAN** buat database terpisah per kampus.
- Tenant (kampus) diidentifikasi dari **subdomain** (misal `unpad.namaapp.com`), dideteksi lewat Next.js Middleware, lalu di-inject sebagai context ke setiap request.
- `kampusId` **HARUS** masuk ke JWT payload saat login — semua query backend WAJIB filter berdasarkan `kampusId` dari JWT, **bukan** dari input/parameter yang bisa dimanipulasi user.
- `nim` unik secara **composite** dengan `kampusId` (`UNIQUE(kampusId, nim)`), bukan unique global — karena NIM antar kampus bisa sama persis.
- Role `SUPER_ADMIN` (global, `kampusId = NULL`) beda dari `ADMIN_KAMPUS` (tenant-level, terikat 1 kampus).

---

## 4. DATA MODEL (SKEMA PRISMA — IKUTI STRUKTUR INI)

```
Kampus
├── id, namaKampus, kodeKampus (unique), subdomain (unique)
├── latitude, longitude          // untuk geofencing, 1 kampus = 1 titik (kampus kecil, 1 gedung)
├── radiusMeter (default 100m)
└── status (ACTIVE, SUSPENDED)

User
├── id, kampusId (nullable khusus SUPER_ADMIN), nim (nullable)
├── email (unique global), passwordHash
├── role (MAHASISWA, DOSEN, ADMIN_KAMPUS, SUPER_ADMIN)
└── UNIQUE(kampusId, nim)

MasterMahasiswa (data resmi dari kampus, untuk validasi registrasi)
├── id, kampusId, nim, namaLengkap, prodi
├── status (AKTIF, CUTI, LULUS, DO)
└── UNIQUE(kampusId, nim)

Jurusan
├── id, kampusId, namaJurusan, kodeJurusan

Kelas (rombel/rombongan belajar, misal "TI-2A")
├── id, kampusId, jurusanId, namaKelas, angkatan

Enrollment
├── mahasiswaId (FK User), kelasId (FK Kelas)

MataKuliah
├── id, kampusId, kodeMk, namaMk, sks

KelasMataKuliah
├── id, mataKuliahId, kelasId, dosenId

JadwalTemplate (pola berulang mingguan)
├── id, kelasMataKuliahId, hari (enum SENIN-SABTU)
├── jamMulai, jamSelesai, ruangan
├── berlakuMulai, berlakuSampai (rentang tanggal 1 semester)
└── status (AKTIF, NONAKTIF)

JadwalSesi (instance aktual, di-generate dari JadwalTemplate)
├── id, jadwalTemplateId, pertemuanKe, tanggal
├── jamMulai, jamSelesai (bisa override beda dari template)
└── status (SCHEDULED, ONGOING, SELESAI, DIBATALKAN)

QRToken (rotating token per sesi)
├── id, jadwalSesiId, token (JWT/UUID)
├── issuedAt, expiresAt (expiresAt = issuedAt + 15 detik)

Absensi
├── id, mahasiswaId, jadwalSesiId
├── waktuAbsen, status (HADIR, TERLAMBAT, ALPHA, IZIN, SAKIT)
├── metode (QR, MANUAL_DOSEN, AUTO_SYSTEM)
├── latitudeScan, longitudeScan, jarakMeter, isLocationValid

AbsensiLog (audit trail untuk override manual dosen)
├── id, absensiId, statusLama, statusBaru, changedBy, createdAt

HariLibur (opsional, untuk skip generate jadwal di tanggal libur)
├── id, kampusId, tanggal, keterangan
```

**Catatan penting:**
- `Kelas` (rombel) dan `KelasMataKuliah` (mata kuliah yang diambil kelas) adalah **2 tabel berbeda**, jangan digabung.
- Kampus di sistem ini diasumsikan **1 gedung per kampus** (kampus kecil) — jadi lokasi geofence ada di level `Kampus`, bukan tabel `GedungKampus` terpisah. Jangan over-engineer dengan relasi 1-to-many untuk gedung kalau belum ada kebutuhan multi-gedung.

---

## 5. LOGIKA INTI YANG HARUS DIIMPLEMENTASI

### A. Generate QR Rotating
- QR baru di-generate otomatis tiap 10-15 detik selama `JadwalSesi.status = ONGOING`.
- Dosen klik "Mulai Sesi" → sistem mulai rotasi otomatis, tidak perlu generate manual berulang.
- Validasi: QR hanya bisa di-generate kalau waktu sekarang berada dalam rentang jam sesi.

### B. Validasi Scan Mahasiswa (2 lapis)
1. **Validasi token QR** — cek `expiresAt` belum lewat.
2. **Validasi geofence** — hitung jarak (Haversine formula) antara koordinat mahasiswa saat scan vs `Kampus.latitude/longitude`. Kalau jarak > `radiusMeter`, tolak dengan pesan jelas (tampilkan jarak aktual ke user).
3. Minta izin lokasi browser **di background saat halaman scan dibuka** (bukan setelah user klik kamera), supaya tidak ada 2 popup permission berurutan yang membingungkan.

### C. Auto-Close Sesi & Default Status ALPHA
- Cron job jalan setelah `jamSelesai` sesi lewat.
- Mahasiswa yang terdaftar (`Enrollment`) di kelas tapi TIDAK punya record `Absensi` untuk sesi itu → otomatis dibuatkan record dengan `status = ALPHA`, `metode = AUTO_SYSTEM`.
- Status ALPHA ini **bukan final** — dosen bisa override.

### D. Override Manual Dosen
- Dosen hanya bisa override sesi yang dia ampu sendiri (validasi `dosenId` di `KelasMataKuliah`).
- Setiap override tercatat di `AbsensiLog` (audit trail: status lama, status baru, siapa yang ubah).
- UI: inline dropdown per baris mahasiswa (Hadir/Izin/Sakit) + **bulk action** (checkbox multi-select untuk ubah banyak mahasiswa sekaligus, misal untuk kasus surat izin kolektif).

### E. Generate Jadwal Sesi dari Template
- Function generate harus **idempotent** (aman dijalankan berkali-kali, skip kalau instance untuk tanggal itu sudah ada).
- Saat admin/dosen input `JadwalTemplate` baru, sistem otomatis generate seluruh `JadwalSesi` untuk 1 semester penuh berdasarkan `berlakuMulai` — `berlakuSampai`.

---

## 6. STRUKTUR 3 UI (ROLE-BASED)

### A. Mahasiswa (mobile-first, karena scan pakai HP)
- Halaman utama: tombol besar "Scan Absen", kamera langsung terbuka
- Jadwal kuliah **per hari** (tab: Senin/Selasa/dst), otomatis filter sesuai kelas mahasiswa (tidak perlu pilih jurusan manual)
- Riwayat absensi: summary card di atas (total Hadir/Sakit/Izin/Alpha), breakdown per mata kuliah di bawah (accordion, bukan tabel flat semua sesi)
- Tampilkan badge "Diverifikasi Dosen" kalau status berasal dari override manual
- Tampilkan warning (⚠️) kalau persentase kehadiran mendekati/di bawah ambang batas syarat UAS

### B. Dosen (desktop-first, dashboard)
- List mata kuliah diampu → pilih kelas → pilih pertemuan
- Tombol "Mulai Sesi" → QR full-screen (untuk proyektor) + live counter mahasiswa yang sudah absen (real-time, bisa manfaatkan Supabase Realtime)
- Halaman rekap sesi: tabel mahasiswa + status + aksi override (inline dropdown + bulk action)
- Jadwal mengajar per hari, dengan filter jurusan/kelas

### C. Super Admin / Admin Kampus (CRUD)
- Kelola: Kampus (kalau Super Admin), User, Jurusan, Kelas, MataKuliah, Enrollment
- Import data mahasiswa (upload Excel/CSV) ke `MasterMahasiswa` — `kampusId` otomatis dari session admin, TIDAK BOLEH jadi field yang bisa diedit manual
- Setup lokasi kampus untuk geofencing (idealnya pakai embed peta untuk pilih titik koordinat, bukan input manual lat/long)
- Setup `JadwalTemplate` per kelas-mata kuliah
- Reporting/analytics lintas kelas & dosen

---

## 7. ARAH DESAIN UI (WAJIB DIIKUTI)

- **Hindari tampilan generic/template AI** — jangan pakai pola default seperti card putih polos dengan shadow tipis, palet biru-ungu gradient khas SaaS starter template, atau layout yang terasa "auto-generated". Sistem ini dipakai institusi pendidikan sungguhan, harus terasa dirancang dengan intensi, bukan template generik.
- Tentukan **1 palet warna yang jelas dan konsisten** di awal (bukan default Tailwind biru/indigo begitu saja) — tunjukkan pilihan warna dulu ke saya sebelum diterapkan ke seluruh komponen.
- Tipografi: hindari font default sistem tanpa pertimbangan (`font-sans` polos) — pilih pairing font yang punya karakter, tapi tetap readable untuk data-heavy dashboard (dosen/admin).
- Untuk UI **Mahasiswa** (mobile): prioritaskan kejelasan aksi utama (scan) dan feedback visual yang cepat dipahami (warna status hadir/telat/alpha harus jelas dibedakan, bukan cuma teks).
- Untuk UI **Dosen/Admin** (dashboard data-heavy): hindari tabel Excel-style mentah — beri hierarki visual yang jelas (grouping, spacing, warna status) supaya data kehadiran tidak terasa seperti spreadsheet biasa dipindah ke web.
- Tampilkan dulu **1 halaman contoh** (misal halaman scan mahasiswa) untuk saya review arah visualnya, sebelum diterapkan konsisten ke semua halaman lain.

---

## 8. OUT OF SCOPE (JANGAN DIBANGUN, KECUALI DIMINTA EKSPLISIT)

Fitur-fitur berikut **sengaja tidak termasuk** dalam MVP ini. Jangan bangun, jangan siapkan skema database untuk ini, dan jangan sarankan menambahkannya di tengah proses kerja tanpa saya minta duluan:

- **Payment/SPP Integration** — sistem pembayaran, billing, atau langganan
- **Full LMS** — upload materi kuliah, kuis online, forum diskusi, submit tugas
- **Face recognition** — belum termasuk fase ini, geofencing + QR rotating sudah cukup untuk MVP
- **Multi-gedung per kampus** — skema saat ini asumsi 1 kampus = 1 gedung/titik lokasi
- **Native mobile app** (Android/iOS terpisah) — cukup PWA

Kalau menurutmu ada fitur di luar list ini yang "sebaiknya ditambahkan", **tanyakan dulu ke saya**, jangan langsung dibangun.

---

## 9. PWA REQUIREMENTS

- Installable (manifest.json dengan `display: standalone`)
- `start_url` mengarah ke halaman scan (untuk mahasiswa) — bukan halaman login/dashboard, karena itu aksi paling sering dilakukan
- Sediakan instruksi visual "Add to Home Screen" khusus untuk iOS Safari (karena tidak ada prompt otomatis seperti Android)
- Push notification untuk reminder sesi akan dimulai (opsional, fase lanjutan)

---

## 10. FASE PENGERJAAN YANG DIMINTA

Kerjakan berurutan, **berhenti dan tunggu review saya di akhir tiap fase**:

1. **Fase 1:** Setup project Next.js + TypeScript + Tailwind + Prisma + koneksi Supabase. Buat schema Prisma lengkap sesuai struktur di atas, migrate ke database.
2. **Fase 2:** Sistem auth + multi-tenant middleware (subdomain detection, JWT dengan kampusId, role guard).
3. **Fase 3:** Modul Super Admin — CRUD Kampus, User, Jurusan, Kelas, MataKuliah, import MasterMahasiswa.
4. **Fase 4:** Modul Dosen — setup JadwalTemplate + generator JadwalSesi, halaman mulai sesi + QR rotating.
5. **Fase 5:** Modul Mahasiswa — halaman scan (kamera + geolocation), validasi backend (token + geofence), halaman jadwal & riwayat absensi.
6. **Fase 6:** Auto-close job (cron) + fitur override dosen + audit log.
7. **Fase 7:** PWA setup (manifest, service worker, icon).

**Mulai dari Fase 1 dulu. Tunjukkan rencana struktur folder dan schema Prisma lengkap sebelum mulai generate kode — saya review dulu sebelum kamu lanjut eksekusi.**