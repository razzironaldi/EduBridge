import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  Bookmark,
  Sparkle,
  SlidersHorizontal,
  SpeakerHigh,
  NotePencil,
} from '@phosphor-icons/react'
import { Button } from '../components/Button'
import { Card, CardBody } from '../components/Card'
import { Badge } from '../components/Badge'
import { ProgressBar } from '../components/ProgressBar'
import { ModeSelector } from '../components/ModeSelector'
import { useStore } from '../store'
import { materials, totalLessons } from '../data/materials'
import { getModeSummary } from '../data/modes'

export function DashboardPage() {
  const [reviewClock, setReviewClock] = useState(0)
  const {
    userName,
    learningModes,
    pageTheme,
    lessonProgress,
    quizReview,
    lessonNotes,
    bionicReadingEnabled,
    setBionicReadingEnabled,
    readingGuideEnabled,
    setReadingGuideEnabled,
    toggleLearningMode,
  } = useStore()
  const preferenceSummary = getModeSummary(learningModes, pageTheme)
  const notesCount = Object.values(lessonNotes).filter((n) => n.trim().length > 0).length

  useEffect(() => {
    const timeout = window.setTimeout(() => setReviewClock(Date.now()), 0)
    return () => window.clearTimeout(timeout)
  }, [])

  const completedCount = Object.values(lessonProgress).filter((l) => l.completed).length
  const bookmarkedCount = Object.values(lessonProgress).filter((l) => l.bookmarked).length
  const overallPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  const mostRecentLessonId = Object.entries(lessonProgress)
    .filter(([, v]) => v.lastAccessed)
    .sort(([, a], [, b]) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0))
    .map(([id]) => id)[0]

  const recentMaterial = mostRecentLessonId
    ? materials.find((m) => m.sections.some((s) => s.id === mostRecentLessonId)) ?? materials[0]
    : materials[0]
  const recentSection = recentMaterial?.sections.find((s) => s.id === mostRecentLessonId)
  const resumeUrl = recentMaterial
    ? `/materials/${recentMaterial.id}${recentSection ? `?section=${encodeURIComponent(recentSection.id)}` : ''}`
    : '/materials'
  const dueQuizReviews = materials.flatMap((material) =>
    material.quiz
      .filter((question) => (quizReview[question.id]?.nextReviewAt ?? Infinity) <= reviewClock)
      .map((question) => ({
        material,
        question,
        section: material.sections[material.sections.length - 1],
      }))
  )

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">
            Halo, {userName || 'Pelajar'}!
          </h1>
          <p className="mt-1 text-text-secondary">
            Preferensi aktif: <strong className="text-primary-700">{preferenceSummary}</strong>
          </p>
        </div>
        <Button to="/settings" variant="outline" size="sm">
          Ubah Preferensi
        </Button>
      </div>

      <div data-scroll-reveal className="grid gap-6 lg:grid-cols-3 mb-8">
        <div className="double-bezel lg:col-span-2">
          <div className="double-bezel-inner h-full p-5 sm:p-6 flex flex-col justify-between gap-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-bold text-primary-800">
                  Kokpit Belajar Adaptif
                </span>
                <h2 className="mt-2 text-lg font-extrabold text-text-primary">Progres Keseluruhan</h2>
                <p className="text-sm text-text-secondary mt-0.5">
                  {completedCount} dari {totalLessons} subtema telah kamu selesaikan
                </p>
                <ProgressBar value={overallPct} className="mt-3" />
              </div>
              <div className="grid grid-cols-3 gap-3 shrink-0 w-full sm:w-auto">
                <div className="rounded-xl border border-border bg-surface-elevated px-3.5 py-2.5 text-center">
                  <p className="text-xl font-extrabold text-primary-600">{overallPct}%</p>
                  <p className="text-[11px] font-medium text-text-muted">Selesai</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-elevated px-3.5 py-2.5 text-center">
                  <p className="text-xl font-extrabold text-accent-600">{bookmarkedCount}</p>
                  <p className="text-[11px] font-medium text-text-muted">Bookmark</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-elevated px-3.5 py-2.5 text-center">
                  <p className="text-xl font-extrabold text-primary-800">{notesCount}</p>
                  <p className="text-[11px] font-medium text-text-muted">Catatan</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
              <span className="text-xs font-semibold text-text-muted mr-1">Alat Bantu Cepat:</span>
              <button
                type="button"
                onClick={() => setBionicReadingEnabled(!bionicReadingEnabled)}
                aria-pressed={bionicReadingEnabled}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                  bionicReadingEnabled
                    ? 'border-primary-600 bg-primary-50 text-primary-800'
                    : 'border-border bg-surface text-text-secondary hover:bg-surface-muted'
                }`}
              >
                <Sparkle size={14} weight={bionicReadingEnabled ? 'fill' : 'regular'} className="text-primary-600" />
                Bionic Reading
              </button>
              <button
                type="button"
                onClick={() => setReadingGuideEnabled(!readingGuideEnabled)}
                aria-pressed={readingGuideEnabled}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                  readingGuideEnabled
                    ? 'border-primary-600 bg-primary-50 text-primary-800'
                    : 'border-border bg-surface text-text-secondary hover:bg-surface-muted'
                }`}
              >
                <SlidersHorizontal size={14} weight={readingGuideEnabled ? 'bold' : 'regular'} className="text-primary-600" />
                Penggaris Fokus
              </button>
              <button
                type="button"
                onClick={() => toggleLearningMode('audio')}
                aria-pressed={learningModes.includes('audio')}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                  learningModes.includes('audio')
                    ? 'border-primary-600 bg-primary-50 text-primary-800'
                    : 'border-border bg-surface text-text-secondary hover:bg-surface-muted'
                }`}
              >
                <SpeakerHigh size={14} weight={learningModes.includes('audio') ? 'fill' : 'regular'} className="text-primary-600" />
                Audio Reader
              </button>
              {notesCount > 0 && (
                <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-text-secondary">
                  <NotePencil size={14} className="text-primary-600" />
                  {notesCount} catatan tersimpan
                </span>
              )}
            </div>
          </div>
        </div>

        {recentMaterial && (
          <div className="double-bezel">
            <div className="double-bezel-inner h-full p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-primary-700 uppercase tracking-wider">
                  {recentSection ? 'Lanjutkan Belajar' : 'Rekomendasi Mulai'}
                </p>
                <h3 className="mt-2 text-lg font-extrabold text-text-primary">{recentMaterial.title}</h3>
                <p className="mt-1 text-xs text-text-secondary line-clamp-2">
                  {recentSection ? `Bagian terakhir: ${recentSection.title}` : recentMaterial.description}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge>{recentMaterial.level}</Badge>
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Clock size={12} /> {recentMaterial.totalDuration} menit
                  </span>
                </div>
              </div>
              <Button
                to={resumeUrl}
                size="md"
                className="mt-5"
                fullWidth
              >
                {recentSection ? 'Lanjutkan Sekarang' : 'Mulai Belajar'}
                <ArrowRight size={16} weight="bold" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {dueQuizReviews.length > 0 && (
        <section data-scroll-reveal aria-labelledby="review-heading" className="mb-8">
          <div className="mb-4">
            <h2 id="review-heading" className="text-lg font-bold text-text-primary">Latihan pengulangan</h2>
            <p className="mt-1 text-sm text-text-secondary">
              {dueQuizReviews.length} soal siap diulang. Kerjakan dengan santai, tanpa batas waktu.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dueQuizReviews.map(({ material, question, section }) => (
              <Card key={question.id} scrollReveal>
                <CardBody>
                  <p className="text-xs font-semibold text-text-muted">{material.title}</p>
                  <h3 className="mt-2 font-semibold text-text-primary">{question.question}</h3>
                  <Button
                    to={`/materials/${material.id}?section=${encodeURIComponent(section.id)}&review=${encodeURIComponent(question.id)}`}
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    fullWidth
                  >
                    Ulangi soal
                    <ArrowRight size={16} />
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section data-scroll-reveal aria-labelledby="materials-heading" className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 id="materials-heading" className="text-lg font-bold text-text-primary">Mulai dari tema ini</h2>
          <Link to="/materials" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
            Jelajahi {materials.length} tema
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.slice(0, 3).map((m) => {
            const done = m.sections.filter((s) => lessonProgress[s.id]?.completed).length
            const pct = Math.round((done / m.sections.length) * 100)
            return (
              <Link key={m.id} to={`/materials/${m.id}`} className="group">
                <Card interactive scrollReveal className="h-full">
                  <CardBody>
                    <div className="flex items-start justify-between">
                      <Badge variant={m.accent === 'accent' ? 'accent' : 'primary'}>{m.category}</Badge>
                      {done === m.sections.length && (
                        <CheckCircle size={20} className="text-green-500" weight="fill" />
                      )}
                    </div>
                    <h3 className="mt-3 font-semibold text-text-primary group-hover:text-primary-600 transition-colors">
                      {m.title}
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary line-clamp-2">{m.description}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <BookOpen size={13} /> {m.sections.length} bagian
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} /> {m.totalDuration} menit
                      </span>
                      {lessonProgress[m.sections[0]?.id]?.bookmarked && (
                        <Bookmark size={13} weight="fill" className="text-accent-500" />
                      )}
                    </div>
                    {pct > 0 && <ProgressBar value={pct} size="sm" className="mt-3" />}
                  </CardBody>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      <section data-scroll-reveal aria-labelledby="mode-heading" className="focus-hide">
        <h2 id="mode-heading" className="text-lg font-bold text-text-primary mb-4">Mode Belajar</h2>
        <ModeSelector compact />
      </section>
    </div>
  )
}
