import { CheckCircle, BookmarkSimple, Clock, Trophy, TrendUp, Printer, Medal, Sparkle } from '@phosphor-icons/react'
import { Card, CardBody } from '../components/Card'
import { ProgressBar } from '../components/ProgressBar'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { useStore } from '../store'
import { learningCategories, materials, totalLessons } from '../data/materials'

export function ProgressPage() {
  const { lessonProgress, userName, quizReview } = useStore()

  const completedCount = Object.values(lessonProgress).filter((l) => l.completed).length
  const bookmarkedCount = Object.values(lessonProgress).filter((l) => l.bookmarked).length
  const overallPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
  const accessedCount = Object.values(lessonProgress).filter((l) => l.lastAccessed).length
  const quizAnsweredCount = Object.keys(quizReview).length

  const categoryMastery = learningCategories.map((cat) => {
    const catMaterials = materials.filter((m) => m.categoryId === cat.id)
    const catSections = catMaterials.flatMap((m) => m.sections)
    const done = catSections.filter((s) => lessonProgress[s.id]?.completed).length
    const pct = catSections.length > 0 ? Math.round((done / catSections.length) * 100) : 0
    return { ...cat, done, total: catSections.length, pct }
  })

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Analitik Progres & Capaian
          </h1>
          <p className="text-text-secondary mt-1">
            Pantau penguasaan 8 kategori inklusif dan cetak portofolio belajarmu.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
        >
          <Printer size={16} weight="bold" />
          Cetak Ringkasan / Sertifikat
        </Button>
      </div>

      <div data-scroll-reveal className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: TrendUp, label: 'Penguasaan Total', value: `${overallPct}%`, color: 'text-primary-600', bg: 'bg-primary-100' },
          { icon: CheckCircle, label: 'Subtema Selesai', value: `${completedCount}/${totalLessons}`, color: 'text-green-600', bg: 'bg-green-100' },
          { icon: BookmarkSimple, label: 'Bagian Ditandai', value: String(bookmarkedCount), color: 'text-accent-600', bg: 'bg-accent-100' },
          { icon: Clock, label: 'Soal Kuis Dijawab', value: `${quizAnsweredCount} soal (${accessedCount} sesi)`, color: 'text-blue-600', bg: 'bg-blue-100' },
        ].map((s) => (
          <Card key={s.label} scrollReveal>
            <CardBody className="flex items-center gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.bg} ${s.color}`}>
                <s.icon size={22} weight="bold" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-extrabold text-text-primary truncate">{s.value}</p>
                <p className="text-xs text-text-muted">{s.label}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] mb-8">
        <div className="double-bezel" data-scroll-reveal>
          <div className="double-bezel-inner p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="font-extrabold text-lg text-text-primary flex items-center gap-2">
                  <Trophy size={20} className="text-accent-500" weight="fill" />
                  Peta Kompetensi 8 Kategori Inklusif
                </h2>
                <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-bold text-primary-800">
                  UDL Matrix
                </span>
              </div>
              <div className="space-y-3">
                {categoryMastery.map((cat) => (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-text-primary">{cat.title}</span>
                      <span className="font-mono font-bold text-primary-700">
                        {cat.done}/{cat.total} ({cat.pct}%)
                      </span>
                    </div>
                    <ProgressBar value={cat.pct} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="double-bezel" data-scroll-reveal>
          <div className="double-bezel-inner p-6 h-full flex flex-col justify-between bg-gradient-to-br from-primary-50/70 via-surface to-accent-50/40">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-300 bg-surface px-3 py-1 text-xs font-bold text-primary-800">
                  <Sparkle size={14} weight="fill" className="text-accent-600" />
                  Kartu Portofolio Inklusif
                </span>
                <Medal size={28} weight="fill" className="text-accent-500" />
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-widest text-text-muted">
                Diberikan Kepada Pelajar Mandiri
              </p>
              <h3 className="mt-1 text-2xl font-extrabold text-text-primary tracking-tight">
                {userName || 'Pelajar Inklusif TemanAkses'}
              </h3>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                Telah menyelesaikan <strong className="text-text-primary">{completedCount} subtema</strong> ({overallPct}% kurikulum) dan berlatih pada <strong className="text-text-primary">{quizAnsweredCount} evaluasi pemahaman</strong> di platform pembelajaran adaptif TemanAkses.
              </p>
            </div>

            <div className="mt-6 border-t border-border pt-4 flex items-center justify-between text-xs text-text-muted">
              <span>Standar Universal Design for Learning</span>
              <span className="font-mono font-bold text-primary-800">TA-2026-VERIFIED</span>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-bold text-text-primary mb-4">Detail per Materi</h2>
      <div className="space-y-4" data-scroll-reveal>
        {materials.map((m) => {
          const done = m.sections.filter((s) => lessonProgress[s.id]?.completed).length
          const pct = Math.round((done / m.sections.length) * 100)
          return (
            <Card key={m.id} scrollReveal>
              <CardBody>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-text-primary">{m.title}</h3>
                      {pct === 100 && <Badge variant="success">Selesai</Badge>}
                    </div>
                    <p className="text-xs text-text-muted">{done}/{m.sections.length} bagian selesai</p>
                    <ProgressBar value={pct} size="sm" className="mt-2" label={`${pct}% selesai`} />
                  </div>
                  <span className="text-xl font-bold text-primary-600 shrink-0">{pct}%</span>
                </div>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {m.sections.map((s) => {
                    const sd = lessonProgress[s.id]
                    return (
                      <div
                        key={s.id}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${
                          sd?.completed
                            ? 'bg-green-50 text-green-700'
                            : 'bg-surface-muted text-text-muted'
                        }`}
                      >
                        <CheckCircle
                          size={14}
                          weight={sd?.completed ? 'fill' : 'regular'}
                          className={sd?.completed ? 'text-green-500' : ''}
                        />
                        <span className="truncate">{s.title}</span>
                      </div>
                    )
                  })}
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
