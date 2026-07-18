# PROMPT UNTUK ANTIGRAVITY — Sistem Absensi Kantor TactLink (Modul Tambahan)

## ATURAN KERJA (BACA DULU SEBELUM MULAI)

1. **INI ADALAH MODUL TAMBAHAN**, bukan pengganti sistem absensi kampus yang sudah ada. **JANGAN hapus, ubah, atau timpa** tabel/model/kode yang sudah dibuat untuk sistem kampus (`Kampus`, `JadwalTemplate`, `JadwalSesi`, `Absensi`, `QRToken`, dst). Sistem ini berjalan **di project/repo yang sama**, tapi dengan model data & alur yang sepenuhnya terpisah.
2. **JANGAN auto-approve/auto-commit** perubahan apapun tanpa saya review dan approve secara eksplisit terlebih dahulu.
3. Kerjakan **per modul/fitur**, jangan generate semua sekaligus. Berhenti setelah tiap fase selesai, tunggu review saya.
4. Kalau ada requirement di bawah yang ambigu, **tanyakan dulu**, jangan menebak sendiri.
5. **Sebelum eksekusi tiap fase**, ringkas ulang pemahamanmu (2-5 poin singkat) untuk saya koreksi dulu sebelum kode ditulis.
6. **Jangan install dependency baru** di luar yang disebutkan tanpa izin eksplisit.
7. **Jangan menambah fitur** di luar yang diminta di tiap fase — lihat bagian OUT OF SCOPE.

---

## 1. OVERVIEW PROJECT

Sistem absensi internal untuk karyawan **TactLink**, khusus untuk kerja **remote/WFH**. Berbeda dari sistem absensi kampus (yang pakai QR ditampilkan fisik + geofencing), sistem ini:

- **TIDAK PAKAI GPS/geofencing** — karena karyawan remote, lokasi bisa di mana saja, validasi lokasi tidak relevan.
- **TIDAK PAKAI 1 QR yang dipajang untuk semua orang** — sebagai gantinya, tiap karyawan punya **token/kode absen personal yang unik per akun**, di-generate otomatis untuk semua karyawan sekaligus lewat 1 klik oleh penanggung jawab.
- Proteksi anti-titip-absen di sini **bukan dari lokasi fisik**, tapi dari **binding token ke sesi login akun karyawan** — token hanya bisa dipakai kalau yang mengklik sedang login sebagai akun karyawan tersebut.

### Role Tambahan
- `KARYAWAN` — submit absen masuk/pulang, ajukan izin/sakit/klarifikasi, lihat rekap pribadi
- `PENANGGUNG_JAWAB_ABSEN` — generate sesi absen (1 klik untuk semua karyawan), approve pengajuan izin/klarifikasi
- `ADMIN_KANTOR` — CRUD data karyawan, lihat & export rekap semua karyawan

---

## 2. TECH STACK TAMBAHAN

Selain stack yang sudah dipakai di sistem kampus (Next.js, TypeScript, Tailwind, Prisma, PostgreSQL/Supabase, Zod, bcrypt), modul ini menambahkan:

| Kebutuhan | Library |
|---|---|
| Export rekap ke Excel | **exceljs** (generate di backend, bukan client-side) |

Semua guardrail teknis yang sudah ditetapkan di prompt sistem kampus (TypeScript strict mode, format response API konsisten, rate limiting, dsb) **tetap berlaku** di modul ini.

---

## 3. DATA MODEL (SKEMA PRISMA — TAMBAHAN, BUKAN PENGGANTI)

```
SesiAbsenKantor (dibuat tiap kali "Generate" diklik, 2x/hari: MASUK & PULANG)
├── id, tanggal, jenisAbsen (MASUK, PULANG)
├── dibuatOleh (FK -> User)
├── waktuDibuat
└── status (AKTIF, SELESAI)

TokenAbsenKaryawan (kode unik PER AKUN, di-generate otomatis untuk semua karyawan aktif saat sesi dibuat)
├── id, sesiAbsenKantorId (FK), karyawanId (FK -> User)
├── token (unik per kombinasi sesi + karyawan)
├── expiresAt
├── isUsed (boolean)
└── UNIQUE(sesiAbsenKantorId, karyawanId)

AbsensiKantor (1 baris per karyawan per hari, gabungan masuk & pulang)
├── id, karyawanId (FK)
├── tanggal
├── sesiMasukId (FK -> SesiAbsenKantor, nullable)
├── sesiPulangId (FK -> SesiAbsenKantor, nullable)
├── waktuAbsenMasuk, waktuAbsenPulang (nullable)
├── status (HADIR, TERLAMBAT, ALPHA, IZIN, SAKIT)
├── durasiKerja (computed dari waktuAbsenMasuk-waktuAbsenPulang)
├── isIncomplete (boolean — true kalau salah satu dari masuk/pulang kosong)
└── metode (LINK_PERSONAL, MANUAL_ADMIN, PENGAJUAN_KARYAWAN)

PengajuanIzin
├── id, karyawanId (FK)
├── jenis (IZIN, SAKIT, KLARIFIKASI_ABSEN)   // CUTI belum masuk fase ini
├── tanggalMulai, tanggalSelesai              // untuk KLARIFIKASI_ABSEN, tanggalMulai = tanggalSelesai
├── alasan (text)
├── lampiranUrl (nullable — wajib kalau SAKIT > 1 hari, divalidasi backend)
├── status (PENDING, DISETUJUI, DITOLAK)
├── diprosesOleh (FK -> User, nullable)
├── catatanApproval (nullable)
├── adaKonflikAbsen (boolean — true kalau tanggal yang diajukan sudah ada AbsensiKantor berstatus HADIR/TERLAMBAT)
└── createdAt, updatedAt

ExportLog (audit trail tiap kali rekap di-export)
├── id, exportedBy (FK -> User), bulan, tahun, createdAt
```

---

## 4. LOGIKA INTI

### A. Generate Sesi Absen (1 Klik untuk Semua Karyawan)
- `PENANGGUNG_JAWAB_ABSEN` klik "Generate Absen Masuk" (pagi) atau "Generate Absen Pulang" (sore).
- Sistem buat 1 `SesiAbsenKantor`, lalu **loop semua karyawan aktif**, generate 1 `TokenAbsenKaryawan` unik per karyawan untuk sesi itu.
- Token **tidak ditampilkan sebagai QR yang bisa di-screenshot dan dipakai bebas** — token hanya valid dan bisa disubmit **saat karyawan sedang login ke akunnya sendiri**. Validasi backend wajib cek `karyawanId` dari token = `karyawanId` dari JWT sesi yang sedang login, bukan hanya validasi token secara berdiri sendiri.

### B. Karyawan Absen
- Karyawan login → dashboard otomatis tampilkan tombol "Absen Masuk" / "Absen Pulang" kalau ada sesi aktif hari itu.
- Klik → backend validasi token milik karyawan tsb, belum `isUsed`, belum `expiresAt` → catat waktu, tentukan `HADIR`/`TERLAMBAT` berdasarkan jam.
- Update `AbsensiKantor` (buat kalau belum ada untuk tanggal itu, update kalau sudah ada dari sesi masuk sebelumnya).

### C. Deteksi & Flag `isIncomplete`
- Cron job jalan di akhir hari: kalau `AbsensiKantor` hari itu punya `waktuAbsenMasuk` tapi `waktuAbsenPulang` kosong (atau sebaliknya) → set `isIncomplete = true`.
- Karyawan bisa ajukan `PengajuanIzin` dengan `jenis = KLARIFIKASI_ABSEN` untuk hari yang `isIncomplete`.

### D. Pengajuan Izin/Sakit/Klarifikasi + Approval
- Karyawan submit pengajuan → status `PENDING`.
- **Deteksi konflik otomatis:** saat submit, backend cek apakah tanggal yang diajukan sudah punya `AbsensiKantor` berstatus `HADIR`/`TERLAMBAT` → kalau ya, set `adaKonflikAbsen = true`, tampilkan warning eksplisit ke approver (JANGAN auto-overwrite data absen yang sudah valid tanpa sepengetahuan approver).
- `PENANGGUNG_JAWAB_ABSEN` approve/reject. Kalau disetujui:
  - Untuk `IZIN`/`SAKIT`: update `AbsensiKantor` untuk setiap tanggal dalam rentang, `metode = PENGAJUAN_KARYAWAN`, invalidate token yang belum dipakai di tanggal terkait.
  - Untuk `KLARIFIKASI_ABSEN`: update field yang kosong (`waktuAbsenMasuk`/`waktuAbsenPulang`) sesuai klarifikasi, set `isIncomplete = false`.

### E. Rekap & Export
- Rekap personal (karyawan) dan rekap keseluruhan (admin) **wajib memisahkan kategori "Perlu Klarifikasi"** dari "Hadir" — jangan digabung, supaya hari yang datanya bolong tidak dianggap hadir penuh secara diam-diam.
- Export ke Excel **hanya bisa diakses role `ADMIN_KANTOR` / `PENANGGUNG_JAWAB_ABSEN`**, wajib role guard eksplisit di backend (bukan cuma disembunyikan di UI).
- Tiap export tercatat di `ExportLog` (siapa, kapan).

---

## 5. STRUKTUR UI

### A. Karyawan
- Dashboard utama: tombol "Absen Masuk"/"Absen Pulang" (muncul sesuai sesi aktif)
- Rekap bulanan: summary cards (Hadir, Terlambat, Izin, Sakit, **Perlu Klarifikasi**), total jam kerja, rata-rata jam/hari
- Riwayat harian dengan tombol "[Klarifikasi]" langsung di baris yang `isIncomplete`
- Halaman "Ajukan Izin" (pilih jenis, tanggal, alasan, upload lampiran)

### B. Penanggung Jawab Absen
- Tombol "Generate Absen Masuk" / "Generate Absen Pulang" (1 klik)
- Halaman approval pengajuan izin — tampilkan warning eksplisit kalau `adaKonflikAbsen = true`
- Rekap semua karyawan (tabel sortable per kolom, badge untuk yang sering "Perlu Klarifikasi")

### C. Admin Kantor
- CRUD data karyawan (tambah/nonaktifkan akun)
- Rekap semua karyawan + tombol "Export Excel"

---

## 6. ARAH DESAIN UI

Ikuti prinsip yang sama dengan sistem kampus: **hindari tampilan generic/template AI**, palet warna & tipografi konsisten dan sudah ditentukan sebelumnya (reuse dari sistem kampus kalau relevan, karena ini 1 produk yang sama — tapi tunjukkan dulu preview-nya ke saya kalau ada penyesuaian). Dashboard admin/penanggung jawab yang data-heavy harus punya hierarki visual jelas, bukan tabel mentah ala spreadsheet.

---

## 7. WORK LOG & TO-DO LIST (Update Kerjaan Harian)

Fitur tambahan: karyawan input apa yang dikerjakan hari ini & rencana besok, plus to-do list pribadi. **Visibilitas default: seluruh perusahaan bisa lihat** (keputusan bisnis, bukan default teknis yang restriktif) — tapi tetap sediakan opsi per-entry untuk karyawan tandai suatu update sebagai privat (hanya ke atasan), untuk kasus edge yang sensitif.

**Ini BUKAN kalender visual grid** (bukan reimplementasi Google Calendar dengan drag-drop/multi-view) — cukup list sederhana dengan tanggal/deadline. Jangan tambahkan library kalender visual (FullCalendar/react-big-calendar) kecuali diminta eksplisit di fase lanjutan.

### Data Model

```
WorkLog (update harian, 1 entry per karyawan per hari)
├── id, karyawanId (FK)
├── tanggal
├── dikerjakanHariIni (text, mendukung multi-poin/bullet)
├── rencanaBesok (text, mendukung multi-poin/bullet)
├── blocker (nullable — kendala yang dihadapi, opsional)
├── isPrivat (boolean, default false — kalau true hanya terlihat oleh karyawan ybs & atasan langsung)
└── createdAt, updatedAt

TodoItem (to-do list pribadi karyawan, tidak public ke orang lain)
├── id, karyawanId (FK)
├── judul, deskripsi (nullable)
├── deadline (date, nullable — tanggal saja, bukan jam spesifik)
├── status (TODO, IN_PROGRESS, DONE)
├── prioritas (RENDAH, SEDANG, TINGGI)
└── createdAt, updatedAt
```

**Catatan:** `TodoItem` defaultnya **privat per karyawan** (bukan public) — beda dari `WorkLog`. To-do list adalah alat kerja pribadi (semacam checklist), sedangkan `WorkLog` adalah yang memang dimaksudkan untuk terlihat tim/perusahaan. Jangan gabungkan keduanya jadi 1 tabel walau terlihat mirip, karena tujuan visibilitasnya beda secara default.

### UI

**Halaman "Update Kerjaan" (bisa dilihat semua karyawan, seperti feed):**
```
┌─────────────────────────────────────────┐
│  Update Hari Ini — Rina Wijaya            │
│  ✅ Dikerjakan:                            │
│   • Selesai revisi UI dashboard            │
│   • Meeting sync sama tim design           │
│  📅 Rencana Besok:                         │
│   • Mulai integrasi API pembayaran         │
│  ⚠️ Blocker: nunggu akses API dari vendor  │
└─────────────────────────────────────────┘
```
- Tampilkan sebagai feed terurut tanggal terbaru, filter per karyawan/divisi
- Entry dengan `isPrivat = true` hanya muncul untuk karyawan ybs & role atasan (`PENANGGUNG_JAWAB_ABSEN`/`ADMIN_KANTOR`)

**Halaman "To-Do List Saya" (privat per karyawan):**
```
┌─────────────────────────────────────────┐
│  To-Do List Saya          [+ Tambah]     │
│  🔴 Tinggi   Fix bug login          18 Jul│
│  🟡 Sedang   Review PR teman        20 Jul│
│  🟢 Rendah   Update dokumentasi     -     │
└─────────────────────────────────────────┘
```
- Sortable/filter by status & prioritas
- Checkbox cepat untuk ubah status TODO → DONE tanpa buka form terpisah

---

## 8. OUT OF SCOPE (JANGAN DIBANGUN DI FASE INI)

- **CUTI Tahunan dengan kuota/saldo** — enum `jenis` di `PengajuanIzin` sengaja belum termasuk `CUTI`, akan menyusul di fase terpisah
- **Integrasi payroll/gaji** — rekap jam kerja hanya untuk insight, bukan dasar perhitungan gaji otomatis
- **GPS/geofencing** — tidak relevan untuk kerja remote, jangan tambahkan validasi lokasi apapun
- **Notifikasi push real-time** untuk approval — cukup tampil di dashboard, belum perlu notifikasi terpisah
- **Kalender visual grid** (drag-drop, multi-view harian/mingguan/bulanan) — Work Log & To-Do List cukup list-based, bukan reimplementasi Google Calendar

---

## 9. FASE PENGERJAAN

Kerjakan berurutan, **berhenti dan tunggu review saya di akhir tiap fase**:

1. **Fase 1:** Tambahkan model Prisma baru (`SesiAbsenKantor`, `TokenAbsenKaryawan`, `AbsensiKantor`, `PengajuanIzin`, `ExportLog`) ke schema yang sudah ada. Tambahkan role baru ke enum `Role`. Migrate. **Pastikan tidak ada model/kolom sistem kampus yang berubah.**
2. **Fase 2:** Modul Admin Kantor — CRUD karyawan.
3. **Fase 3:** Modul Penanggung Jawab — generate sesi absen (1 klik, loop semua karyawan aktif, generate token personal).
4. **Fase 4:** Modul Karyawan — dashboard absen masuk/pulang (validasi token terikat sesi login), riwayat harian.
5. **Fase 5:** Cron job deteksi `isIncomplete` + fitur klarifikasi.
6. **Fase 6:** Modul Pengajuan Izin/Sakit + approval + deteksi konflik absen.
7. **Fase 7:** Rekap (karyawan & admin) + export Excel + audit log.
8. **Fase 8:** Modul Work Log (feed update harian, dengan opsi `isPrivat`) + To-Do List pribadi.

**Mulai dari Fase 1. Tunjukkan rencana schema Prisma tambahan dulu (highlight bagian mana yang baru, konfirmasi tidak ada yang menyentuh model kampus) sebelum eksekusi migration.**

10. AUTENTIKASI & SESI LOGIN

A. Prinsip Dasar

Sistem ini menambahkan "Ingat saya di device ini" dengan masa berlaku 30 hari. Ini BUKAN sekadar memperpanjang expiresIn JWT jadi 30d — itu anti-pattern karena JWT stateless tidak bisa dicabut kalau device hilang/dicuri sebelum expired. Pendekatan yang dipakai: short-lived access token + revocable refresh token tersimpan di DB.

Trade-off yang harus disadari (bukan default diam-diam): sesi 30 hari berarti sekali device karyawan dipegang orang lain, orang itu bisa submit absen atas nama karyawan tsb tanpa perlu tahu password, selama sesi belum di-revoke. Ini diterima sebagai trade-off demi kenyamanan WFH — wajib ada fitur "Logout dari semua device" di halaman profil sebagai mitigasi.

Scope: ⚠️ [TANYAKAN DULU sebelum eksekusi] — apakah remember-me 30 hari ini berlaku untuk karyawan kantor saja, atau juga untuk mahasiswa di sistem kampus? Implikasi keamanannya beda (device mahasiswa lebih sering dipinjam-pinjam dibanding device kerja karyawan). Default asumsi kalau tidak dijawab: karyawan kantor saja, sistem kampus tetap pakai sesi pendek seperti sebelumnya.

B. Skema Prisma Tambahan

prismamodel SesiLogin {
  id               String    @id @default(cuid())
  userId           String
  user             User      @relation(fields: [userId], references: [id])
  refreshTokenHash String    @unique   // hash (bcrypt/sha256), JANGAN simpan plaintext
  deviceInfo       String?             // user-agent, ditampilkan di "Kelola Device"
  ipAddress        String?             // opsional, untuk info di UI kelola device
  createdAt        DateTime  @default(now())
  expiresAt        DateTime            // createdAt + 30 hari
  lastUsedAt       DateTime  @default(now())
  revokedAt        DateTime?           // diisi saat logout manual / logout-all-device

  @@index([userId])
}

Tidak menyentuh model User yang sudah ada kecuali menambah relasi sesiLogin SesiLogin[].

C. Alur Teknis
Login berhasil + checkbox "Ingat saya" dicentang:

Terbitkan access token (JWT, umur pendek 15-30 menit) — dipakai untuk otorisasi tiap request, disimpan di memory (bukan localStorage).
Terbitkan refresh token (random string, bukan JWT) — di-hash lalu disimpan sebagai baris baru di SesiLogin dengan expiresAt = now() + 30 hari.
Refresh token dikirim ke client sebagai cookie httpOnly + Secure + SameSite=Strict, bukan localStorage/sessionStorage (localStorage rentan dicuri lewat XSS).

Login tanpa centang "Ingat saya":

Access token tetap diterbitkan, tapi tidak ada refresh token — begitu browser ditutup/token pendek habis, wajib login ulang. Ini behavior default (opt-in, bukan default selalu-on).

Tiap request butuh otorisasi, access token expired:

Client panggil endpoint /api/auth/refresh dengan cookie refresh token.
Backend cek: token ada & belum revokedAt & belum lewat expiresAt → terbitkan access token baru DAN rotate refresh token (buat baris baru, revoke baris lama). Refresh token one-time-use — kalau ada yang coba pakai refresh token yang sudah di-rotate, anggap sebagai indikasi pencurian token → revoke seluruh sesi user tsb sebagai langkah aman (reuse detection).
Kalau refresh token invalid/expired/revoked → 401, redirect ke halaman login.

Logout (satu device):

Endpoint /api/auth/logout → set revokedAt = now() di baris SesiLogin yang sesuai, hapus cookie di client. Revoke di DB wajib — jangan cuma hapus cookie, karena kalau token sempat ke-copy/ke-leak, tetap bisa dipakai kalau DB tidak diupdate.

Logout semua device ("Keluar dari semua perangkat"):

Endpoint terpisah → set revokedAt = now() untuk semua SesiLogin milik user tsb yang belum revoked.
Tempatkan tombol ini di halaman profil karyawan, dengan konfirmasi eksplisit sebelum eksekusi (destructive action).

Halaman "Kelola Device" (opsional tapi disarankan):

List SesiLogin aktif milik user (device info, kapan login, kapan terakhir dipakai), dengan tombol revoke per-baris. Ini kasih transparansi ke karyawan device mana saja yang masih "ingat" akun mereka.





D. Guardrail Wajib


Refresh token tidak pernah disimpan plaintext di DB — selalu di-hash.
Refresh token tidak pernah dikirim lewat response body / disimpan di localStorage — hanya httpOnly cookie.
Rotate-on-use + reuse detection wajib ada, bukan opsional — ini yang mencegah refresh token lama yang bocor tetap valid selamanya.
Cron job kecil untuk bersihkan baris SesiLogin yang sudah expired/revoked secara berkala (housekeeping, bukan wajib real-time).
Endpoint refresh & logout ikut guardrail teknis yang sudah ditetapkan di prompt sistem kampus (rate limiting, dsb).


E. Brief Desain — Halaman Login

Ikuti prinsip "hindari tampilan generic AI" yang sudah ditetapkan di Section 6 — hindari pola gradient-mesh + card mengambang di tengah + logo bulat generik.


Split-layout: satu sisi form login, sisi lain brand statement/imagery TactLink (bukan ilustrasi stok generic dari komunitas Figma).
Toggle konteks eksplisit antara login Mahasiswa vs Karyawan (tab atau segmented control di atas form) — sekaligus jadi penanda visual bahwa ini dua sistem yang terpisah.
Checkbox "Ingat saya di device ini selama 30 hari" — opt-in eksplisit, tidak dicentang otomatis secara default.
Microcopy error yang manusiawi ("Email atau password salah", bukan raw error dari backend/stack trace).
State loading & disabled button jelas saat submit — hindari kesan form "diam" tanpa feedback saat diklik.


Tunjukkan preview desain dulu sebelum implementasi, sesuai aturan kerja umum di dokumen ini (Aturan Kerja poin 5).


Tambahan untuk Fase Pengerjaan (Section 9)

Sisipkan sebagai fase baru, dikerjakan terpisah dari fase absen:


Fase 2.5: Modul Autentikasi & Sesi — model SesiLogin, endpoint login/refresh/logout/logout-all, halaman login baru (split-layout, toggle Mahasiswa/Karyawan), checkbox remember-me. Tunjukkan rencana skema + flow diagram refresh-token dulu sebelum eksekusi, konfirmasi juga apakah scope 30 hari berlaku untuk mahasiswa juga atau karyawan saja.

ADDENDUM — Catatan Tambahan: Pemisahan UI Scanner & Dashboard

Sisipkan sebagai catatan tambahan di Section 5.A (Karyawan) dan Section 6 (Arah Desain UI).

Catatan Implementasi — WAJIB DIPISAH, BUKAN REUSE

Komponen dan halaman berikut wajib dibuat baru dan independen, JANGAN reuse/extend komponen kampus yang sudah ada — karena interaction model-nya beda secara fundamental, bukan cuma beda styling:

AspekSistem KampusSistem KantorCara absenScan QR fisik (kamera aktif, viewfinder, deteksi barcode)Klik tombol (link/token personal, tanpa kamera)DependencyLibrary QR-scanner, getUserMedia/camera permissionTidak ada dependency kamera sama sekaliKomponencomponents/kampus/ScannerAbsen.tsx (contoh)components/kantor/AbsenKaryawan.tsx (contoh)Route/kampus/absen (contoh)/kantor/absen (contoh)Dashboard utamaTampilan & data untuk mahasiswaTampilan & data untuk karyawan (summary WFH, work log, to-do)

Struktur folder & route dipisah dari awal (bukan satu halaman dengan branching if (userType === ...)) supaya kalau salah satu sistem diupdate nanti, tidak berisiko kesenggol logic yang lain — konsisten dengan Aturan Kerja poin 1 (jangan sentuh sistem kampus yang sudah ada).

Dashboard utama (halaman home setelah login): tetap 1 route dengan conditional render berdasarkan role — cukup section yang beda isinya (mahasiswa lihat jadwal & absensi kampus, karyawan lihat tombol absen kantor + work log + to-do), kecuali ternyata ada user yang bisa punya lebih dari satu role sekaligus (perlu dikonfirmasi) — kalau iya, baru dibutuhkan role-switcher di UI.


Catatan implementasi: Halaman/komponen absen karyawan wajib dibuat baru dan terpisah dari komponen scanner QR sistem kampus — JANGAN reuse atau extend komponen scanner yang ada. Interaction model-nya beda: karyawan tidak melakukan scan kamera apapun, cukup tombol aksi ("Absen Masuk"/"Absen Pulang") yang muncul otomatis kalau ada sesi aktif dan token milik akun tsb belum dipakai. Tidak ada dependency kamera/QR-library di flow ini sama sekali.