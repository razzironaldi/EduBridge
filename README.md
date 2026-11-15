# TemanAkses — Ruang Belajar Web Adaptif & Inklusif

> Platform pembelajaran digital berbahasa Indonesia berstandar **CAST Universal Design for Learning (UDL)** dan **WCAG 2.1 AAA** yang menyesuaikan tampilan baca, kontras visual, navigasi, suara, dan ritme evaluasi dengan kebutuhan setiap pelajar.

Dokumen proposal lengkap tersedia pada berkas **[Proposal_Proyek_TemanAkses_GEMATIK_Teknokrat.pdf](Proposal_Proyek_TemanAkses_GEMATIK_Teknokrat.pdf)**.

---

## Konteks Kompetisi & Implementasi SDGs

**TemanAkses** dirancang dan dikembangkan sebagai karya orisinal untuk **GEMATIK Teknokrat — Kompetisi Desain & Pengembangan Website** dengan fokus implementasi:
- **SDG Tujuan 4 (Pendidikan Berkualitas — Target 4.5 & 4.a):** Menjamin akses materi pembelajaran teknologi dan literasi digital yang setara bagi pelajar dengan variasi pemrosesan bacaan (disleksia, ADHD, kelelahan fokus) maupun keterbatasan penglihatan ringan hingga sedang (*low vision*).
- **SDG Tujuan 10 (Berkurangnya Kesenjangan — Target 10.2):** Menghapus hambatan biaya dan perangkat melalui arsitektur web ringan berbasis penyimpanan lokal (*local-first*) yang langsung aktif di peramban tanpa paksaan registrasi akun.

---

## Fitur Utama

1. **Studio Kalibrasi Kognitif (`/onboarding`):**
   - Simulasi baca interaktif 10 detik dan 4 tombol preset 1-klik (*Ramah Disleksia*, *Fokus Tinggi / ADHD*, *Low Vision WCAG AAA*, dan *Standar Seimbang*).
2. **Ruang Baca Adaptif & Kendali Keyboard Penuh (`/materials/:id`):**
   - **Bionic Reading (45% Fixation):** Penebalan otomatis bagian awal kata untuk memandu lompatan fokus mata.
   - **Penggaris Fokus Baris (*Reading Ruler*):** Menyorot baris aktif dan meredupkan baris di sekitarnya.
   - **4 Tema Visual Inklusif:** *Terang*, *Tenang/Soft* (krem hangat bebas silau), *Gelap*, dan *Kontras Tinggi WCAG AAA* (rasio kontras 21:1).
   - **Pintasan Keyboard Tanpa Mouse:** `Alt+B` (Bionic), `Alt+R` (Penggaris Fokus), `Alt+S` (Tandai Selesai), dan `Alt+←/→` (Pindah Subbab).
3. **Glosarium Interaktif 1-Klik & Pembaca Suara Bahasa Indonesia (`id-ID`):**
   - Penjelasan istilah kontekstual tanpa berpindah halaman serta sintesis suara Web Speech API dengan pengaturan kecepatan `0.75x`–`1.5x` dan penyorotan kata aktif.
4. **Pendamping Belajar Kontekstual Aksa AI:**
   - Terhubung ke Gemini API melalui server proxy Node.js (kunci API terisolasi aman di sisi server) dan dilengkapi pencarian materi lokal otomatis (`src/data/materials.ts`) sehingga tetap dapat memberikan rangkuman dan petunjuk saat luring/tanpa kuota.
   - Rangkuman diskusi dapat disimpan langsung ke subbab materi yang sedang dibaca (`?section=<id>`).
5. **Kuis Dua Mode & Penjadwalan Ulang Otomatis (*Spaced Repetition*):**
   - **Mode Santai** (tanpa hitung mundur, dilengkapi petunjuk bertahap) dan **Mode Tantangan** (20 detik/soal) dengan jadwal latihan ulang otomatis (`+1 hari` hingga `14 hari`).
6. **Portofolio Belajar, Sertifikat & Pindah Perangkat (`/profile` & `/bookmarks`):**
   - Cetak sertifikat penyelesaian (`TA-UDL`), unduh kompilasi catatan dalam format Markdown (`.md`) / PDF, serta ekspor/impor cadangan progres dalam format `.json`.

---

## Arsitektur & Teknologi

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router DOM v7
- **State & Penyimpanan Lokal:** Zustand 5 (`localStorage` dengan normalisasi ekspor/impor `.json`)
- **Aksesibilitas & Audio:** Web Speech API (`speechSynthesis` `id-ID`), dukungan penuh `prefers-reduced-motion`, dan navigasi keyboard global
- **Server & AI Proxy:** Node.js HTTP Server (`server/index.mjs`) untuk mengisolasi `GEMINI_API_KEY` dari kode klien

---

## Cara Menjalankan Proyek Secara Lokal

### Prasyarat
- **Node.js** (v20 atau lebih baru) dan **npm**

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Menjalankan Mode Pengembangan
```bash
npm run dev
```
Aplikasi dapat diakses di `http://localhost:5173`.
*(Opsional)* Apabila ingin mengaktifkan koneksi daring Gemini API pada Aksa AI, salin `.env.example` menjadi `.env.local` dan isi `GEMINI_API_KEY`. Tanpa kunci API, Aksa AI otomatis berjalan menggunakan mesin pencocokan materi lokal (`src/data/materials.ts`).

### 3. Kompilasi & Menjalankan Server Produksi
```bash
npm run build
npm start
```

---

## Struktur Direktori Utama

```text
temanakses/
├── public/                                              # Aset ikon & favicon
├── server/
│   └── index.mjs                                        # Server produksi & proxy aman Gemini API
├── src/
│   ├── components/                                      # Ruang Baca, Studio Kalibrasi, Penggaris Fokus, Aksa AI
│   ├── data/                                            # Kurikulum 52 subbab, tema inklusif, & konfigurasi mode
│   ├── pages/                                           # 8 halaman rute aplikasi utama
│   ├── App.tsx                                          # Konfigurasi rute & pengamat aksesibilitas
│   └── store.ts                                         # Manajemen state lokal Zustand (v4)
├── Proposal_Proyek_TemanAkses_GEMATIK_Teknokrat.pdf     # Dokumen Proposal Resmi GEMATIK Teknokrat
├── package.json
├── railway.json
└── vite.config.ts
```

---

## Tim Pengusul (Tim Inovasi TemanAkses)

- **Razzi Ronaldi** — *Ketua Tim / System Architecture & Full-Stack Engineer*
- **Yandri Utama** — *Anggota Tim / UI/UX Accessibility & UDL Curriculum Researcher*
