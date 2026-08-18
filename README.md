# Sistem Penilaian Lomba MAPSI

Aplikasi web production-ready untuk pelaksanaan lomba **Praktik Wudu** dan **Praktik Gerakan & Bacaan Salat**.

## Fitur Utama

- ✅ Multi-role: Admin, Operator, Juri
- ✅ Penilaian Wudu (100 poin) dengan 11 kriteria
- ✅ Penilaian Salat (250 poin) dengan 14 kelompok/34 kriteria
- ✅ Auto-save & Draft
- ✅ Finalisasi & Kunci Nilai
- ✅ Multi-juri dengan agregasi rata-rata
- ✅ Ranking real-time dengan tie-breaking
- ✅ Export Excel & CSV
- ✅ Cetak / PDF
- ✅ Audit Log
- ✅ Supabase Realtime
- ✅ Mobile responsive

---

## Teknologi

| Komponen | Teknologi |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Backend | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Security | Supabase Row Level Security |
| Realtime | Supabase Realtime |
| Hosting | Vercel |
| Deploy | GitHub → Vercel |

---

## Setup Awal

### 1. Buat Project Supabase

1. Buka [supabase.com](https://supabase.com) dan buat akun
2. Klik **New Project**
3. Isi nama project, pilih region terdekat (Singapore)
4. Catat **Project URL** dan **anon key** dari *Settings > API*

### 2. Jalankan SQL Migration

Di Supabase **SQL Editor**, jalankan file berikut secara berurutan:

```
1. supabase/schema.sql       — Tabel utama + Auth + RLS
2. supabase/schema_phase2.sql — Tabel penilaian Wudu & Salat
3. supabase/schema_phase3.sql — Ranking, Audit Log, Views
4. supabase/seed.sql          — Data awal (opsional)
```

Verifikasi:
```sql
SELECT SUM(maximum_score) FROM public.wudu_criteria;       -- harus = 100
SELECT SUM(maximum_score) FROM public.prayer_score_groups; -- harus = 250
```

### 3. Buat Akun Admin Pertama

1. Di Supabase > **Authentication > Users** > klik **Add User**
2. Masukkan email dan password
3. Di **SQL Editor**, jalankan:

```sql
UPDATE public.profiles
SET role = 'admin', full_name = 'Nama Admin Anda'
WHERE id = 'uuid-user-anda';
```

Atau via tabel langsung di **Table Editor > profiles**.

### 4. Konfigurasi Supabase Auth

Di Supabase > **Authentication > URL Configuration**:
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: `https://your-app.vercel.app/auth/callback`

Untuk development lokal, tambahkan juga:
- `http://localhost:3000/auth/callback`

---

## Development Lokal

### Prerequisite
- Node.js 18+
- npm atau yarn

### Install & Jalankan

```bash
# Clone repository
git clone https://github.com/username/nilailomba.git
cd nilailomba/nilailomba-app

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local dan isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY

# Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

---

## Deployment ke Vercel

### 1. Push ke GitHub

```bash
cd nilailomba

# Init git (jika belum)
git init
git add .
git commit -m "Initial commit — Sistem Penilaian Lomba MAPSI"

# Buat repository di GitHub, lalu:
git remote add origin https://github.com/username/nilailomba.git
git push -u origin main
```

### 2. Hubungkan ke Vercel

1. Buka [vercel.com](https://vercel.com) dan login
2. Klik **New Project**
3. Import repository GitHub Anda
4. Pilih folder **Root Directory**: `nilailomba-app`
5. Framework: **Next.js** (otomatis terdeteksi)

### 3. Tambahkan Environment Variables di Vercel

Di halaman project Vercel > **Settings > Environment Variables**:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` |

### 4. Deploy

Klik **Deploy**. Vercel akan otomatis build dan deploy.

Setiap push ke branch `main` akan otomatis trigger deployment baru.

### 5. Update Aplikasi

```bash
# Buat perubahan, lalu:
git add .
git commit -m "Update: deskripsi perubahan"
git push
```

Vercel akan otomatis rebuild dan deploy.

---

## Struktur Folder

```
nilailomba-app/
├── app/
│   ├── (dashboard)/         # Halaman dengan layout dashboard
│   │   ├── dashboard/       # Beranda
│   │   ├── penilaian-wudu/  # Penilaian Wudu
│   │   ├── penilaian-salat/ # Penilaian Salat
│   │   ├── ranking/         # Ranking peserta
│   │   ├── rekap/           # Rekap nilai
│   │   ├── peserta/         # Manajemen peserta
│   │   ├── juri/            # Manajemen juri
│   │   ├── pengaturan/      # Pengaturan lomba
│   │   └── riwayat/         # Audit log
│   ├── print/               # Halaman cetak
│   ├── auth/callback/       # Auth callback
│   ├── login/
│   └── forgot-password/
├── components/              # Komponen reusable
│   ├── ui/                  # Komponen UI dasar
│   ├── scoring/             # Komponen penilaian
│   └── results/             # Komponen hasil
├── hooks/                   # Custom React hooks
├── services/                # Supabase service layer
├── types/                   # TypeScript types
├── lib/                     # Utilities
└── supabase/
    ├── schema.sql            # Phase 1 schema
    ├── schema_phase2.sql     # Phase 2 schema
    ├── schema_phase3.sql     # Phase 3 schema
    └── seed.sql              # Seed data
```

---

## Kalkulasi Nilai

```
Nilai Wudu Final   = Rata-rata nilai wudu dari semua juri wudu (finalized)
Nilai Salat Final  = Rata-rata nilai salat dari semua juri salat (finalized)
Total Nilai        = Nilai Wudu Final + Nilai Salat Final
Persentase         = (Total Nilai / 350) × 100

Tie-break ranking  = Jika total sama → bandingkan Nilai Salat
```

---

## Role dan Hak Akses

| Aksi | Admin | Operator | Juri |
|---|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ |
| Manajemen peserta | ✅ | ✅ | ❌ |
| Manajemen juri | ✅ | ❌ | ❌ |
| Penilaian Wudu | ✅ | ❌ | ✅* |
| Penilaian Salat | ✅ | ❌ | ✅* |
| Ranking | ✅ | ✅ | ✅ |
| Rekap & Export | ✅ | ✅ | ❌ |
| Finalisasi Hasil | ✅ | ❌ | ❌ |
| Buka Nilai Terkunci | ✅ | ❌ | ❌ |
| Audit Log | ✅ | ❌ | ❌ |

*Juri hanya dapat menilai peserta sesuai kategori yang ditugaskan

---

## Keamanan

- Row Level Security (RLS) aktif di semua tabel
- Juri hanya dapat mengakses data miliknya
- `SUPABASE_SERVICE_ROLE_KEY` tidak pernah dikirim ke browser
- Semua validasi dilakukan di frontend + database level

---

## Support

Untuk pertanyaan atau masalah, hubungi admin sistem.
