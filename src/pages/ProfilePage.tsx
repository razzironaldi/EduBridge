import { useRef, useState, type ChangeEvent } from 'react'
import {
  BookmarkSimple,
  Certificate,
  CheckCircle,
  DownloadSimple,
  FileText,
  GearSix,
  NotePencil,
  Palette,
  Printer,
  Sparkle,
  UploadSimple,
  User,
} from '@phosphor-icons/react'
import { Button } from '../components/Button'
import { Card, CardBody } from '../components/Card'
import { useStore } from '../store'
import { getModeSummary } from '../data/modes'
import { allLessons, learningCategories, materials, totalLessons } from '../data/materials'

export function ProfilePage() {
  const {
    userName,
    setUserName,
    learningModes,
    fontSize,
    lineHeight,
    letterSpacing,
    pageTheme,
    bionicReadingEnabled,
    readingGuideEnabled,
    lessonProgress,
    lessonNotes,
    quizReview,
  } = useStore()

  const [importStatus, setImportStatus] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const preferenceSummary = getModeSummary(learningModes, pageTheme)
  const completedCount = Object.values(lessonProgress).filter((l) => l.completed).length
  const bookmarkedCount = Object.values(lessonProgress).filter((l) => l.bookmarked).length
  const savedNotesList = Object.entries(lessonNotes).filter(([, n]) => n && n.trim().length > 0)
  const notesCount = savedNotesList.length
  const quizMasteredCount = Object.values(quizReview).filter((q) => q.consecutiveCorrect >= 1).length
  const completionPct = Math.round((completedCount / totalLessons) * 100)

  const badgeTier =
    completionPct >= 75
      ? 'Sertifikasi Pelopor UDL Utama'
      : completionPct >= 30
        ? 'Praktisi Pembelajaran Adaptif'
        : completedCount >= 1
          ? 'Penjelajah Inklusif Aktif'
          : 'Inisiator EduBridge'

  const certId = `EB-UDL-${(userName || 'PELAJAR').slice(0, 4).toUpperCase()}-${new Date().getFullYear()}`

  // Ekspor Transkrip Catatan & Portofolio Belajar (.md)
  const handleExportTranscriptMarkdown = () => {
    const lines: string[] = [
      `# Transkrip Portofolio Belajar & Catatan EduBridge`,
      `ID Sertifikat: ${certId}`,
      `Nama Pelajar: ${userName || 'Mahasiswa Inklusif'}`,
      `Tingkat Kompetensi: ${badgeTier}`,
      `Tanggal Penerbitan: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`,
      ``,
      `---`,
      ``,
      `## 1. Ringkasan Penguasaan Kurikulum UDL`,
      `- **Penguasaan Materi:** ${completionPct}% (${completedCount} dari ${totalLessons} subtema selesai)`,
      `- **Soal Kuis Dikuasai (Spaced Repetition):** ${quizMasteredCount} konsep`,
      `- **Subtema Ditandai:** ${bookmarkedCount} bagian`,
      `- **Preferensi Ruang Baca:** Tema ${pageTheme.toUpperCase()} · ${fontSize}px · Bionic ${bionicReadingEnabled ? 'Aktif' : 'Nonaktif'}`,
      ``,
      `## 2. Koleksi Catatan Refleksi & Rangkuman Aksa AI (${notesCount})`,
      ...(savedNotesList.length > 0
        ? savedNotesList.map(([key, text]) => {
            const matchedLesson = allLessons.find((l) => l.id === key)
            const matchedMat = materials.find((m) => m.id === key)
            const title = matchedLesson
              ? `${matchedLesson.materialTitle} — ${matchedLesson.title}`
              : matchedMat
                ? matchedMat.title
                : 'Catatan Umum'
            return `### ${title}\n${text}\n`
          })
        : ['Belum ada catatan tersimpan.']),
      ``,
      `---`,
      `*Dokumen ini dibuat otomatis oleh EduBridge — Platform Pembelajaran Adaptif Berstandar UDL.*`,
    ]

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Transkrip-Belajar-${(userName || 'Pelajar').replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Backup Data Mandiri Local-First (.json)
  const handleExportBackupJson = () => {
    const rawStorage = localStorage.getItem('edubridge-storage') || localStorage.getItem('temanakses-storage')
    let payload
    try {
      payload = rawStorage ? JSON.parse(rawStorage) : null
    } catch {
      payload = null
    }

    if (!payload || !payload.state) {
      payload = {
        state: {
          userName,
          learningModes,
          pageTheme,
          fontSize,
          lineHeight,
          letterSpacing,
          bionicReadingEnabled,
          readingGuideEnabled,
          lessonProgress,
          lessonNotes,
          quizReview,
        },
        version: 4,
        exportedAt: new Date().toISOString(),
      }
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Backup-EduBridge-${(userName || 'Pelajar').replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Restore Data Backup (.json) dengan normalisasi tangguh
  const handleImportBackupJson = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result ?? '')
        const parsed = JSON.parse(text)
        if (!parsed || typeof parsed !== 'object') {
          setImportStatus('Format file JSON tidak valid.')
          return
        }

        // Normalisasi format Zustand persist
        const normalized = parsed.state ? parsed : { state: parsed, version: 4 }
        localStorage.setItem('edubridge-storage', JSON.stringify(normalized))
        setImportStatus('Data berhasil dipulihkan! Memuat ulang profil...')
        setTimeout(() => window.location.reload(), 650)
      } catch {
        setImportStatus('Gagal membaca file cadangan JSON. Pastikan file berformat .json yang valid.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      {/* Top Header */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary">
            Profil & Portofolio Kognitif
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Identitas belajar adaptif, sertifikasi progres, dan pencadangan data lintas perangkat.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button to="/settings" variant="outline" size="sm">
            <GearSix size={16} />
            Pengaturan
          </Button>
        </div>
      </div>

      {/* KARTU SERTIFIKAT & LENCANA KOMPETENSI INKLUSIF */}
      <div data-scroll-reveal className="double-bezel-dark mb-8">
        <div className="double-bezel-dark-inner p-6 sm:p-8 text-white relative overflow-hidden">
          {/* Ambient Glow Latar */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl"
          />

          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-400/30 shadow-inner">
                  <Certificate size={36} weight="duotone" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-0.5 font-mono text-[11px] font-bold text-teal-200 border border-white/15">
                      <Sparkle size={12} weight="fill" className="text-amber-300" />
                      {badgeTier}
                    </span>
                    <span className="font-mono text-[11px] text-white/60">{certId}</span>
                  </div>
                  <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    {userName || 'Pelajar Inklusif'}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-white/80">
                    Kurikulum Universal Design for Learning (UDL) · {learningCategories.length} Rumpun · {materials.length} Modul
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3.5 text-right shrink-0">
                <p className="font-mono text-3xl sm:text-4xl font-extrabold text-teal-300">{completionPct}%</p>
                <p className="text-xs text-white/75 mt-0.5">Penguasaan Kurikulum</p>
              </div>
            </div>

            {/* Statistik Indikator Kunci */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-white/12 pt-5">
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[11px] text-white/65">Subtema Selesai</p>
                <p className="mt-1 font-mono text-lg font-extrabold text-white">
                  {completedCount} / {totalLessons}
                </p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[11px] text-white/65">Soal Kuis Dikuasai</p>
                <p className="mt-1 font-mono text-lg font-extrabold text-white">{quizMasteredCount}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[11px] text-white/65">Catatan & Rangkuman</p>
                <p className="mt-1 font-mono text-lg font-extrabold text-white">{notesCount}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-[11px] text-white/65">Bagian Ditandai</p>
                <p className="mt-1 font-mono text-lg font-extrabold text-white">{bookmarkedCount}</p>
              </div>
            </div>

            {/* Tombol Aksi Portofolio & Sertifikat */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/12 pt-5 print:hidden">
              <span className="text-xs text-white/70">
                Terverifikasi secara <em>local-first</em> pada {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
              </span>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex min-h-[38px] items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 text-xs font-bold text-white spring-transition cursor-pointer"
                >
                  <Printer size={15} weight="bold" />
                  <span>Cetak Sertifikat (PDF)</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportTranscriptMarkdown}
                  className="inline-flex min-h-[38px] items-center gap-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 px-4 py-2 text-xs font-extrabold spring-transition cursor-pointer shadow-md"
                >
                  <FileText size={15} weight="bold" />
                  <span>Unduh Transkrip Belajar (.md)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8 print:hidden">
        {/* Identitas Pelajar */}
        <Card scrollReveal>
          <CardBody>
            <h3 className="font-bold text-text-primary mb-3 flex items-center gap-2">
              <User size={18} className="text-primary-600" weight="bold" />
              Identitas Pelajar
            </h3>
            <label htmlFor="profile-name" className="block text-xs font-semibold text-text-secondary mb-1.5">
              Nama pada Sertifikat & Sapaan Dashboard
            </label>
            <input
              id="profile-name"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Ketik nama lengkap atau panggilan..."
              className="w-full min-h-[44px] rounded-xl border border-border-strong bg-surface px-3.5 py-2 text-sm font-semibold text-text-primary focus:border-primary-600 focus:outline-none"
            />
            <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-3 text-xs text-text-secondary">
              <span className="flex items-center gap-1.5">
                <CheckCircle size={15} className="text-emerald-600" weight="fill" />
                {completedCount} bab selesai
              </span>
              <span className="flex items-center gap-1.5">
                <BookmarkSimple size={15} className="text-accent-600" weight="fill" />
                {bookmarkedCount} bookmark
              </span>
              <span className="flex items-center gap-1.5">
                <NotePencil size={15} className="text-primary-600" weight="fill" />
                {notesCount} catatan
              </span>
            </div>
          </CardBody>
        </Card>

        {/* Kalibrasi Aksesibilitas Aktif */}
        <Card scrollReveal>
          <CardBody>
            <h3 className="font-bold text-text-primary mb-3 flex items-center gap-2">
              <Palette size={18} className="text-primary-600" weight="bold" />
              Kalibrasi Aksesibilitas Aktif
            </h3>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="rounded-xl bg-surface-muted p-2.5">
                <p className="text-text-muted">Mode & Tema</p>
                <p className="font-bold text-text-primary mt-0.5 truncate">{preferenceSummary}</p>
              </div>
              <div className="rounded-xl bg-surface-muted p-2.5">
                <p className="text-text-muted">Tipografi</p>
                <p className="font-bold text-text-primary mt-0.5">
                  {fontSize}px · {lineHeight.toFixed(1)}× ·{' '}
                  {letterSpacing === 0 ? 'Normal' : `${Math.round(letterSpacing * 100)}%`}
                </p>
              </div>
              <div className="rounded-xl bg-surface-muted p-2.5">
                <p className="text-text-muted">Bionic Reading</p>
                <p className="font-bold text-text-primary mt-0.5">
                  {bionicReadingEnabled ? 'Aktif (ON)' : 'Nonaktif'}
                </p>
              </div>
              <div className="rounded-xl bg-surface-muted p-2.5">
                <p className="text-text-muted">Penggaris Fokus</p>
                <p className="font-bold text-text-primary mt-0.5">
                  {readingGuideEnabled ? 'Aktif (60fps)' : 'Nonaktif'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* PORTABILITAS DATA LOCAL-FIRST (EXPORT / IMPORT JSON) */}
      <Card scrollReveal className="print:hidden">
        <CardBody>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-text-primary">
                Portabilitas Data Mandiri (Backup & Restore JSON)
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-text-secondary">
                EduBridge menjaga privasimu secara <em>local-first</em>. Unduh cadangan progres, kuis Spaced Repetition, dan catatanmu untuk dipindahkan ke laptop lain kapan saja tanpa internet server.
              </p>
              {importStatus && (
                <p className="mt-2 text-xs font-bold text-primary-800" role="status">
                  {importStatus}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button variant="primary" size="sm" onClick={handleExportBackupJson}>
                <DownloadSimple size={16} weight="bold" />
                Ekspor Backup (.json)
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportBackupJson}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadSimple size={16} weight="bold" />
                Impor Backup (.json)
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
