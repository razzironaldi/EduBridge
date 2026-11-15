import { useState } from 'react'
import {
  ArrowRight,
  BookmarkSimple,
  BookOpen,
  Clock,
  DownloadSimple,
  MagnifyingGlass,
  NotePencil,
  Printer,
  Trash,
} from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card, CardBody } from '../components/Card'
import { useStore } from '../store'
import { allLessons, materials } from '../data/materials'

const formatAccessedAt = (timestamp: number) =>
  new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp)

export function BookmarksPage() {
  const [search, setSearch] = useState('')
  const { lessonProgress, toggleBookmark, lessonNotes, setLessonNote, userName } = useStore()

  const lessonsWithProgress = allLessons.map((lesson) => ({
    ...lesson,
    progress: lessonProgress[lesson.id],
  }))

  const accessedLessons = lessonsWithProgress
    .filter((lesson) => typeof lesson.progress?.lastAccessed === 'number')
    .sort((a, b) => (b.progress?.lastAccessed ?? 0) - (a.progress?.lastAccessed ?? 0))

  const query = search.trim().toLocaleLowerCase('id-ID')
  const bookmarkedLessons = lessonsWithProgress
    .filter((lesson) => lesson.progress?.bookmarked)
    .filter(
      (lesson) =>
        !query ||
        `${lesson.materialTitle} ${lesson.title}`.toLocaleLowerCase('id-ID').includes(query)
    )

  // Kumpulkan semua catatan refleksi & rangkuman Aksa yang tersimpan
  const savedNotesEntries = Object.entries(lessonNotes)
    .filter(([, text]) => text && text.trim().length > 0)
    .map(([key, text]) => {
      const matchedLesson = allLessons.find((l) => l.id === key)
      const matchedMat = materials.find((m) => m.id === key)
      return {
        key,
        text: text.trim(),
        title: matchedLesson
          ? `${matchedLesson.materialTitle} · ${matchedLesson.title}`
          : matchedMat
            ? matchedMat.title
            : 'Catatan Umum Aksa',
        route: matchedLesson
          ? `/materials/${matchedLesson.materialId}?section=${encodeURIComponent(matchedLesson.id)}`
          : matchedMat
            ? `/materials/${matchedMat.id}`
            : '/materials',
      }
    })
    .filter(
      (entry) =>
        !query ||
        `${entry.title} ${entry.text}`.toLocaleLowerCase('id-ID').includes(query)
    )

  const mostRecentLesson = accessedLessons[0]
  const mostRecentMaterial = mostRecentLesson
    ? materials.find((material) => material.id === mostRecentLesson.materialId)
    : undefined
  const resumeUrl = mostRecentLesson
    ? `/materials/${mostRecentLesson.materialId}?section=${encodeURIComponent(mostRecentLesson.id)}`
    : '/materials'

  const exportStudySummaryMarkdown = () => {
    const lines: string[] = [
      `# Ringkasan Belajar & Catatan EduBridge`,
      `Pelajar: ${userName || 'Mahasiswa Inklusif'}`,
      `Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`,
      ``,
      `## 1. Bagian Materi yang Ditandai (${bookmarkedLessons.length})`,
      ...(bookmarkedLessons.length > 0
        ? bookmarkedLessons.map((b) => `- **${b.materialTitle}** — ${b.title} (${b.duration} menit)`)
        : ['- Belum ada bagian yang ditandai.']),
      ``,
      `## 2. Catatan Refleksi & Rangkuman Aksa AI (${savedNotesEntries.length})`,
      ...(savedNotesEntries.length > 0
        ? savedNotesEntries.flatMap((n) => [`### ${n.title}`, n.text, ``])
        : ['Belum ada catatan tersimpan.']),
    ]

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Catatan-EduBridge-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary sm:text-3xl">
            Pusat Bookmark & Catatan Belajar
          </h1>
          <p className="mt-1.5 text-sm text-text-secondary">
            Bagian tersimpan, riwayat bacaan terakhir, dan seluruh rangkuman Aksa AI milikmu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            disabled={bookmarkedLessons.length === 0 && savedNotesEntries.length === 0}
          >
            <Printer size={16} weight="bold" />
            Cetak / Ekspor PDF
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={exportStudySummaryMarkdown}
            disabled={bookmarkedLessons.length === 0 && savedNotesEntries.length === 0}
          >
            <DownloadSimple size={16} weight="bold" />
            Unduh Ringkasan (.md)
          </Button>
        </div>
      </div>

      <section data-scroll-reveal aria-labelledby="resume-heading" className="mb-8">
        <h2 id="resume-heading" className="mb-3 text-lg font-bold text-text-primary">
          Lanjutkan belajar
        </h2>
        {mostRecentLesson && mostRecentMaterial ? (
          <Card>
            <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-text-muted">Terakhir dibuka</p>
                <h3 className="mt-1 text-lg font-semibold text-text-primary">
                  {mostRecentLesson.title}
                </h3>
                <p className="mt-1 text-sm text-text-secondary">{mostRecentMaterial.title}</p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
                  <Clock size={14} />
                  {formatAccessedAt(mostRecentLesson.progress?.lastAccessed ?? 0)}
                </p>
              </div>
              <Button to={resumeUrl} className="shrink-0">
                Lanjutkan Belajar
                <ArrowRight size={18} />
              </Button>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-text-secondary">
                Belum ada bagian yang dibuka. Pilih materi untuk memulai.
              </p>
              <Button to="/materials" variant="outline" size="sm">
                Jelajahi Materi
              </Button>
            </CardBody>
          </Card>
        )}
      </section>

      {/* Filter Pencarian Gabungan */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
          <span className="rounded-full bg-surface-elevated border border-border px-3 py-1">
            {bookmarkedLessons.length} Bookmark
          </span>
          <span className="rounded-full bg-primary-50 border border-primary-200 px-3 py-1 text-primary-800">
            {savedNotesEntries.length} Catatan & Rangkuman Aksa
          </span>
        </div>

        <label className="relative block w-full sm:max-w-xs">
          <span className="sr-only">Cari materi atau isi catatan</span>
          <MagnifyingGlass
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari bookmark atau isi catatan..."
            className="min-h-11 w-full rounded-xl border border-border-strong bg-surface pl-10 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-600 focus:outline-none"
          />
        </label>
      </div>

      {/* SEKSI CATATAN REFLEKSI & RANGKUMAN AKSA */}
      <section data-scroll-reveal aria-labelledby="notes-heading" className="mb-10">
        <div className="mb-3 flex items-center gap-2">
          <NotePencil size={20} weight="bold" className="text-primary-700" />
          <h2 id="notes-heading" className="text-lg font-bold text-text-primary">
            Catatan Refleksi & Rangkuman Aksa AI
          </h2>
        </div>

        {savedNotesEntries.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {savedNotesEntries.map((item) => (
              <Card key={item.key} className="h-full">
                <CardBody className="flex h-full flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-extrabold text-text-primary">{item.title}</h3>
                      <button
                        type="button"
                        onClick={() => setLessonNote(item.key, '')}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-surface-muted hover:text-text-primary cursor-pointer"
                        aria-label={`Hapus catatan ${item.title}`}
                        title="Hapus catatan"
                      >
                        <Trash size={15} />
                      </button>
                    </div>
                    <p className="mt-2.5 whitespace-pre-wrap rounded-xl bg-surface-elevated border border-border p-3 text-xs leading-relaxed text-text-secondary max-h-44 overflow-y-auto">
                      {item.text}
                    </p>
                  </div>
                  <div className="mt-4 pt-2 flex justify-end">
                    <Button to={item.route} variant="outline" size="sm">
                      Buka Subtema Terkait
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border-strong bg-surface-elevated/40 px-5 py-8 text-center">
            <NotePencil size={26} className="mx-auto text-text-muted" />
            <p className="mt-2 text-sm font-semibold text-text-primary">
              Belum ada catatan refleksi atau rangkuman Aksa
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              Ketik catatan di bawah materi atau klik tombol &ldquo;Catat&rdquo; pada jawaban Aksa AI untuk menyimpannya di sini.
            </p>
          </div>
        )}
      </section>

      {/* SEKSI BOOKMARK */}
      <section data-scroll-reveal aria-labelledby="saved-heading">
        <div className="mb-4">
          <h2 id="saved-heading" className="text-lg font-bold text-text-primary">
            Bagian Materi Tersimpan
          </h2>
        </div>

        {bookmarkedLessons.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {bookmarkedLessons.map((lesson) => (
              <li key={lesson.id} data-scroll-reveal>
                <Card scrollReveal className="h-full">
                  <CardBody className="flex h-full flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Badge variant="neutral" size="sm">
                          {lesson.materialTitle}
                        </Badge>
                        <h3 className="mt-3 font-semibold text-text-primary">{lesson.title}</h3>
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
                          <BookOpen size={14} />
                          Durasi {lesson.duration} menit
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleBookmark(lesson.id)}
                        aria-label={`Hapus penanda ${lesson.title}`}
                        className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg text-accent-700 hover:bg-accent-50 cursor-pointer"
                      >
                        <BookmarkSimple size={20} weight="fill" />
                      </button>
                    </div>
                    <div className="mt-auto pt-4">
                      <Button
                        to={`/materials/${lesson.materialId}?section=${encodeURIComponent(lesson.id)}`}
                        variant="outline"
                        size="sm"
                        fullWidth
                      >
                        Buka bagian
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          <div
            data-scroll-reveal
            className="rounded-xl border border-dashed border-border-strong px-5 py-10 text-center"
          >
            <BookmarkSimple size={28} className="mx-auto text-text-muted" />
            <p className="mt-3 font-semibold text-text-primary">
              {search ? 'Tidak ada bagian yang cocok' : 'Belum ada bookmark'}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {search
                ? 'Coba kata pencarian lain.'
                : 'Tandai bagian saat belajar untuk menyimpannya di sini.'}
            </p>
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-3 text-sm font-semibold text-primary-700 underline underline-offset-4"
              >
                Hapus pencarian
              </button>
            ) : (
              <Link
                to="/materials"
                className="mt-3 inline-block text-sm font-semibold text-primary-700 underline underline-offset-4"
              >
                Jelajahi materi
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
