import { Suspense, lazy, useEffect, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  Eye,
  Target,
  SpeakerHigh,
  TextAa,
  Sparkle,
  Users,
  GraduationCap,
  Devices,
  CheckCircle,
  BookOpen,
  Play,
  Stop,
  SlidersHorizontal,
  ShieldCheck,
  Lightning,
  MagnifyingGlass,
  WarningCircle,
} from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { CommandPalette } from '../components/CommandPalette'
import { InteractiveVideoShowcase } from '../components/InteractiveVideoShowcase'
import { useStore } from '../store'
import { learningCategories, materials, totalLessons } from '../data/materials'

const AdaptiveFieldCanvas = lazy(() =>
  import('../components/AdaptiveFieldCanvas').then((m) => ({ default: m.AdaptiveFieldCanvas }))
)

type PreviewMode = 'visual' | 'simple' | 'audio' | 'bionic' | 'contrast'

const sampleText =
  'Hambatan belajar sering muncul bukan karena kemampuan pelajar, melainkan karena bahan ajar yang dikunci dalam satu format kaku. Ketika platform menyediakan kendali tipografi, fiksasi kata Bionic, pemutar suara Bahasa Indonesia, dan ringkasan bertingkat, setiap orang dapat menyerap konsep yang sama secara mandiri.'

function renderBionicSample(text: string) {
  return text.split(/(\s+)/).map((token, idx) => {
    if (!token || /^\s+$/.test(token)) return token
    const cleanLen = token.replace(/[^a-zA-Z0-9]/g, '').length
    if (cleanLen < 3) return token
    const boldLen = Math.ceil(token.length * 0.45)
    return (
      <span key={idx}>
        <strong className="font-extrabold text-text-primary">{token.slice(0, boldLen)}</strong>
        <span>{token.slice(boldLen)}</span>
      </span>
    )
  })
}

export function LandingPage() {
  const { onboardingComplete } = useStore()
  const [previewMode, setPreviewMode] = useState<PreviewMode>('bionic')
  const [previewFontSize, setPreviewFontSize] = useState(17)
  const [compareMode, setCompareMode] = useState<'rigid' | 'adaptive'>('adaptive')
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [isSpeakingSample, setIsSpeakingSample] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [webglPaused, setWebglPaused] = useState(false)

  const primaryActionRoute = onboardingComplete ? '/dashboard' : '/onboarding'
  const primaryActionLabel = onboardingComplete ? 'Buka Ruang Belajar' : 'Mulai Ruang Belajar'

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('keydown', handleKey)
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const toggleSampleAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    if (isSpeakingSample) {
      window.speechSynthesis.cancel()
      setIsSpeakingSample(false)
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(sampleText)
    utterance.lang = 'id-ID'
    utterance.rate = 1
    utterance.onend = () => setIsSpeakingSample(false)
    utterance.onerror = () => setIsSpeakingSample(false)
    window.speechSynthesis.speak(utterance)
    setIsSpeakingSample(true)
  }

  return (
    <div className="flex flex-col bg-surface text-text-primary selection:bg-primary-200 selection:text-primary-950">
      <a href="#landing-main" className="skip-to-content">
        Langsung ke konten utama
      </a>
      <header className="sticky top-4 z-40 px-4 sm:px-6">
        <nav
          className="glass-pill-nav mx-auto flex h-16 max-w-6xl items-center justify-between rounded-full px-3 sm:px-5 spring-transition"
          aria-label="Navigasi utama"
        >
          <Link to="/" className="flex items-center gap-3 pl-1" aria-label="EduBridge Beranda">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-900 text-white font-extrabold text-xs tracking-tight shadow-soft">
              EB
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm sm:text-base text-text-primary tracking-tight leading-none">
                EduBridge
              </span>
              <span className="text-[11px] font-medium text-text-muted mt-0.5">
                Adaptive Learning Studio
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-7 text-sm font-medium text-text-secondary">
            <a href="#preview-studio" className="hover:text-primary-700 transition-colors">
              Studio 3D
            </a>
            <a href="#video-reel" className="hover:text-primary-700 transition-colors">
              Video Tur
            </a>
            <a href="#transformasi-udl" className="hover:text-primary-700 transition-colors">
              Transformasi Baca
            </a>
            <a href="#fitur-utama" className="hover:text-primary-700 transition-colors">
              Arsitektur Akses
            </a>
            <a href="#katalog-materi" className="hover:text-primary-700 transition-colors">
              Kurikulum ({materials.length})
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border-strong/80 bg-surface/90 px-4 text-xs font-semibold text-text-secondary hover:border-primary-600 hover:text-text-primary spring-transition cursor-pointer"
              aria-label="Buka pusat komando cepat (Ctrl+K)"
            >
              <MagnifyingGlass size={14} weight="light" aria-hidden="true" className="text-primary-700" />
              <span className="hidden sm:inline">Komando</span>
              <kbd className="hidden md:inline-block rounded-full bg-surface-elevated px-2 py-0.5 font-mono text-[10px] font-semibold text-text-muted border border-border">
                Ctrl K
              </kbd>
            </button>

            <Link
              to={primaryActionRoute}
              className="group hidden sm:inline-flex min-h-[44px] items-center gap-3 rounded-full bg-primary-900 pl-5 pr-1.5 py-1.5 text-xs font-semibold text-white hover:bg-primary-800 active:scale-[0.98] spring-transition"
            >
              <span>{primaryActionLabel}</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105">
                <ArrowUpRight size={14} weight="bold" aria-hidden="true" />
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface lg:hidden cursor-pointer"
            >
              <span
                className={`absolute h-0.5 w-4 bg-text-primary transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  mobileMenuOpen ? 'rotate-45' : '-translate-y-1.5'
                }`}
              />
              <span
                className={`absolute h-0.5 w-4 bg-text-primary transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  mobileMenuOpen ? '-rotate-45' : 'translate-y-1.5'
                }`}
              />
            </button>
          </div>
        </nav>

        {mobileMenuOpen && (
          <div className="mx-auto mt-2 max-w-6xl rounded-3xl border border-border bg-surface/95 p-5 shadow-elevated backdrop-blur-2xl lg:hidden">
            <div className="flex flex-col gap-3 text-sm font-semibold text-text-primary">
              <a
                href="#preview-studio"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-2xl px-3 py-2 hover:bg-surface-elevated"
              >
                Studio Interaktif
              </a>
              <a
                href="#transformasi-udl"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-2xl px-3 py-2 hover:bg-surface-elevated"
              >
                Transformasi Baca
              </a>
              <a
                href="#fitur-utama"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-2xl px-3 py-2 hover:bg-surface-elevated"
              >
                Arsitektur Akses
              </a>
              <a
                href="#katalog-materi"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-2xl px-3 py-2 hover:bg-surface-elevated"
              >
                Kurikulum ({materials.length})
              </a>
              <Link
                to={primaryActionRoute}
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 inline-flex items-center justify-between rounded-full bg-primary-900 px-5 py-3 text-white"
              >
                <span>{primaryActionLabel}</span>
                <ArrowUpRight size={16} weight="bold" />
              </Link>
            </div>
          </div>
        )}
      </header>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      <main id="landing-main">
      <section
        data-scroll-reveal
        className="relative min-h-[92dvh] flex items-center overflow-hidden border-b border-border bg-editorial-grid"
      >
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <div className="absolute -top-32 right-1/4 h-[28rem] w-[28rem] rounded-full bg-primary-200/35 blur-3xl" />
          <div className="absolute bottom-0 left-8 h-[22rem] w-[22rem] rounded-full bg-accent-200/25 blur-3xl" />
        </div>
        <Suspense fallback={null}>
          <AdaptiveFieldCanvas activeMode={previewMode} paused={webglPaused} />
        </Suspense>

        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 pt-12 sm:pt-20 pb-20 sm:pb-28">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-6">
              <div data-reveal-item="left" className="inline-flex flex-wrap items-center gap-2 mb-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-surface/95 px-3.5 py-1.5 text-[11px] uppercase tracking-[0.18em] font-semibold text-primary-800 shadow-soft">
                  <Sparkle size={13} weight="fill" className="text-primary-600" />
                  <span>Universal Design for Learning · WebGL 3D</span>
                </div>
                <button
                  type="button"
                  onClick={() => setWebglPaused((p) => !p)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-surface/90 px-3 py-1 text-[11px] font-semibold text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  <span>{webglPaused ? 'Nyalakan 3D Field' : 'Jeda 3D (Mode Tenang)'}</span>
                </button>
              </div>

              <h1 data-reveal-item="left" className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tighter text-text-primary leading-[1.08]">
                Ruang belajar yang{' '}
                <span className="text-primary-700">menyesuaikan cara berpikirmu.</span>
              </h1>

              <p data-reveal-item="left" className="mt-5 text-base sm:text-lg text-text-secondary leading-relaxed max-w-[50ch]">
                Satu materi dengan lima jalur kognitif: fiksasi kata Bionic, penggaris fokus, pembaca suara Bahasa Indonesia, dan pendamping Aksa.
              </p>

              <div data-reveal-item="left" className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  to={primaryActionRoute}
                  className="group inline-flex items-center gap-3.5 rounded-full bg-primary-900 pl-6 pr-2 py-2 text-sm font-semibold text-white shadow-card hover:bg-primary-800 active:scale-[0.98] spring-transition"
                >
                  <span>{primaryActionLabel}</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105">
                    <ArrowUpRight size={16} weight="bold" />
                  </span>
                </Link>

                <Link
                  to="/materials"
                  className="inline-flex items-center gap-2.5 rounded-full border border-border-strong bg-surface px-6 py-3.5 text-sm font-semibold text-text-primary hover:border-primary-600 hover:bg-surface-elevated active:scale-[0.98] spring-transition"
                >
                  <BookOpen size={17} weight="light" />
                  <span>Eksplorasi Kurikulum</span>
                </Link>
              </div>
            </div>

            <div id="preview-studio" data-reveal-item="right" className="lg:col-span-6 w-full">
              <div className="double-bezel">
                <div
                  className={`double-bezel-inner overflow-hidden spring-transition ${
                    previewMode === 'contrast'
                      ? 'border-black bg-white text-black'
                      : 'bg-surface text-text-primary'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-elevated/80 px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal size={16} className="text-primary-700" weight="light" />
                      <span className="text-xs font-bold tracking-tight text-text-primary">
                        Kanvas Adaptif Live
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Pilih mode pratinjau">
                      {(
                        [
                          { id: 'bionic', label: 'Bionic' },
                          { id: 'simple', label: 'Sederhana' },
                          { id: 'audio', label: 'Audio' },
                          { id: 'contrast', label: 'Kontras' },
                          { id: 'visual', label: 'Standar' },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setPreviewMode(tab.id)}
                          aria-pressed={previewMode === tab.id}
                          className={`rounded-full px-3 py-1 text-xs font-semibold spring-transition cursor-pointer ${
                            previewMode === tab.id
                              ? 'bg-primary-900 text-white shadow-soft'
                              : 'bg-surface text-text-secondary hover:bg-surface-muted border border-border'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-5 sm:p-7 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="primary">Desain Pembelajaran Inklusif</Badge>
                      <div className="flex items-center gap-1.5 text-xs text-text-muted">
                        <button
                          type="button"
                          onClick={toggleSampleAudio}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold spring-transition cursor-pointer ${
                            isSpeakingSample
                              ? 'border-accent-500 bg-accent-100 text-accent-900'
                              : 'border-primary-300 bg-primary-50 text-primary-900 hover:bg-primary-100'
                          }`}
                        >
                          {isSpeakingSample ? <Stop size={12} weight="fill" /> : <Play size={12} weight="fill" />}
                          {isSpeakingSample ? 'Hentikan Suara' : 'Suara id-ID'}
                        </button>
                        {[15, 17, 20].map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setPreviewFontSize(sz)}
                            aria-pressed={previewFontSize === sz}
                            className={`h-7 w-8 rounded-full border text-[11px] font-bold cursor-pointer spring-transition ${
                              previewFontSize === sz
                                ? 'border-primary-800 bg-primary-900 text-white'
                                : 'border-border bg-surface text-text-secondary'
                            }`}
                          >
                            {sz === 15 ? 'A-' : sz === 17 ? 'A' : 'A+'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-text-primary">
                        Mulai dari Tujuan dan Hambatan Belajar
                      </h2>
                      <p className="text-xs text-text-muted mt-1">
                        Ubah tab mode atau skala huruf di atas untuk menguji adaptasi langsung pada DOM
                      </p>
                    </div>

                    {previewMode === 'simple' ? (
                      <div
                        className="rounded-2xl border border-primary-200 bg-primary-50/70 p-4 sm:p-5 space-y-2.5"
                        style={{ fontSize: `${previewFontSize}px`, lineHeight: 1.65 }}
                      >
                        <p className="text-xs font-bold text-primary-900">
                          Inti Sari Cepat (Mode Sederhana)
                        </p>
                        <p className="text-text-primary font-medium">
                          Tetapkan tujuan belajar yang jelas, lalu hilangkan hambatan format agar setiap pelajar dapat berpartisipasi.
                        </p>
                        <ul className="space-y-1.5 pt-1 text-sm text-text-secondary">
                          <li className="flex items-center gap-2">
                            <CheckCircle size={16} weight="fill" className="text-primary-700 shrink-0" />
                            Standar kompetensi tetap terjaga penuh
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle size={16} weight="fill" className="text-primary-700 shrink-0" />
                            Tersedia dalam teks Bionic, ringkasan, dan suara
                          </li>
                        </ul>
                      </div>
                    ) : (
                      <div
                        className="rounded-2xl border border-border bg-surface-elevated/60 p-4 sm:p-5 space-y-3 text-text-secondary"
                        style={{ fontSize: `${previewFontSize}px`, lineHeight: 1.75 }}
                      >
                        <p className={previewMode === 'contrast' ? 'text-black font-semibold' : ''}>
                          {previewMode === 'bionic' ? (
                            renderBionicSample(sampleText)
                          ) : previewMode === 'audio' ? (
                            <>
                              Hambatan belajar sering muncul bukan karena kemampuan pelajar, melainkan karena{' '}
                              <mark className="audio-word-highlight px-1 font-semibold">
                                bahan ajar yang dikunci dalam satu format kaku
                              </mark>
                              . Ketika platform menyediakan kendali tipografi, fiksasi kata Bionic, pemutar suara Bahasa Indonesia, dan ringkasan bertingkat, setiap orang dapat menyerap konsep yang sama secara mandiri.
                            </>
                          ) : (
                            sampleText
                          )}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-border pt-3.5 text-xs text-text-muted">
                      <span>
                        Pintasan global: tekan <strong className="font-mono text-text-primary">Ctrl+K</strong>
                      </span>
                      <Link
                        to="/materials/udl-praktis"
                        className="font-bold text-primary-700 hover:text-primary-900 inline-flex items-center gap-1"
                      >
                        Buka modul penuh <ArrowRight size={13} weight="bold" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        data-scroll-reveal
        aria-label="Standar dan metrik kurikulum"
        className="border-b border-border bg-surface py-12 sm:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <div data-reveal-item className="border-l-2 border-primary-600 pl-5">
              <p className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary">
                {learningCategories.length}
              </p>
              <p className="mt-1 text-sm font-semibold text-text-primary">Rumpun Kurikulum</p>
              <p className="text-xs text-text-muted mt-0.5">Web, Data, AI, Karier, hingga UDL</p>
            </div>
            <div data-reveal-item className="border-l-2 border-primary-600 pl-5">
              <p className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight text-primary-700">
                {totalLessons}
              </p>
              <p className="mt-1 text-sm font-semibold text-text-primary">Subtema Terstruktur</p>
              <p className="text-xs text-text-muted mt-0.5">Lengkap dengan ringkasan & glosarium</p>
            </div>
            <div data-reveal-item className="border-l-2 border-primary-600 pl-5">
              <p className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary">
                WCAG AAA
              </p>
              <p className="mt-1 text-sm font-semibold text-text-primary">Arsitektur Kontras</p>
              <p className="text-xs text-text-muted mt-0.5">4 tema baca & target sentuh 44px</p>
            </div>
            <div data-reveal-item className="border-l-2 border-primary-600 pl-5">
              <p className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary">
                id-ID
              </p>
              <p className="mt-1 text-sm font-semibold text-text-primary">Bimodal Audio & Aksa</p>
              <p className="text-xs text-text-muted mt-0.5">Sorotan kata sinkron & evaluasi santai</p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="video-reel"
        data-scroll-reveal
        className="w-full py-10 sm:py-16 lg:py-20"
        aria-labelledby="video-reel-heading"
      >
        <InteractiveVideoShowcase />
      </section>

      <section
        id="transformasi-udl"
        data-scroll-reveal
        className="py-24 sm:py-32 border-b border-border bg-surface-elevated/55"
        aria-labelledby="compare-heading"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2
              id="compare-heading"
              className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-text-primary tracking-tight leading-[1.12]"
            >
              Mengapa antarmuka kaku membuat sebagian pelajar kelelahan?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-text-secondary leading-relaxed">
              Paragraf panjang yang rapat memicu kelelahan visual. Bandingkan bagaimana materi yang sama disajikan pada web biasa dan pada kanvas adaptif EduBridge.
            </p>
          </div>

          <div className="mt-8 inline-flex rounded-full border border-border-strong bg-surface p-1.5 shadow-soft" role="group" aria-label="Bandingkan tampilan baca">
            <button
              type="button"
              onClick={() => setCompareMode('rigid')}
              aria-pressed={compareMode === 'rigid'}
              className={`rounded-full px-5 py-2 text-xs sm:text-sm font-semibold spring-transition cursor-pointer ${
                compareMode === 'rigid'
                  ? 'bg-slate-900 text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Web Edukasi Kaku (Umum)
            </button>
            <button
              type="button"
              onClick={() => setCompareMode('adaptive')}
              aria-pressed={compareMode === 'adaptive'}
              className={`rounded-full px-5 py-2 text-xs sm:text-sm font-semibold spring-transition cursor-pointer ${
                compareMode === 'adaptive'
                  ? 'bg-primary-900 text-white'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Ruang Baca EduBridge
            </button>
          </div>

          <div className="mt-8 double-bezel">
            <div className="double-bezel-inner p-6 sm:p-10">
              {compareMode === 'rigid' ? (
                <div className="space-y-4 max-w-4xl">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-red-800 bg-red-50 border border-red-200 rounded-full px-4 py-2">
                    <span className="flex items-center gap-2">
                      <WarningCircle size={16} weight="fill" />
                      Teks Rapat · Satu Ukuran · Tanpa Fiksasi Baris
                    </span>
                    <span>Beban Kognitif Tinggi</span>
                  </div>
                  <p className="text-[13px] leading-[1.38] tracking-tight text-slate-600">
                    Dalam pembelajaran daring konvensional seluruh peserta didik dipaksa membaca blok teks panjang dengan ukuran huruf kecil dan kerapatan baris sempit tanpa adanya opsi pemecahan poin utama maupun pembaca suara otomatis. Akibatnya pelajar yang mengalami kelelahan visual atau membutuhkan pemrosesan auditori sering tertinggal bukan karena materi tersebut terlalu sulit melainkan karena antarmuka halaman yang tidak ramah aksesibilitas.
                  </p>
                </div>
              ) : (
                <div className="grid lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="inline-flex items-center gap-2 text-xs font-bold text-primary-900 bg-primary-50 border border-primary-200 rounded-full px-4 py-2">
                      <CheckCircle size={16} weight="fill" className="text-primary-700" />
                      <span>Bionic Fixation + Spasi Proporsional + Glosarium Bersuara</span>
                    </div>
                    <p className="text-lg sm:text-xl leading-[1.8] tracking-[0.015em] text-text-primary">
                      {renderBionicSample(
                        'EduBridge memecah materi menjadi subtema terukur. Kamu bebas mengaktifkan penebalan awal kata (Bionic), mendengarkan narasi suara Bahasa Indonesia, atau membaca poin inti lebih dulu.'
                      )}
                    </p>
                  </div>
                  <div className="lg:col-span-5 grid gap-3">
                    <div className="rounded-2xl border border-border bg-surface-elevated p-4">
                      <p className="text-sm font-bold text-text-primary">Fiksasi Suku Kata & Penggaris Baca</p>
                      <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                        Menjaga mata tetap pada baris aktif dan mempercepat pengenalan kata bagi pembaca disleksia maupun ADHD.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-surface-elevated p-4">
                      <p className="text-sm font-bold text-text-primary">Evaluasi Mode Santai Tanpa Cemas</p>
                      <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                        Kuis dilengkapi petunjuk bertahap bersama Aksa dan penjadwalan Spaced Repetition otomatis.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="fitur-utama" data-scroll-reveal className="py-24 sm:py-36" aria-labelledby="benefits-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2
              id="benefits-heading"
              className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-text-primary tracking-tight leading-[1.12]"
            >
              Lima instrumen aksesibilitas dalam satu ruang kerja.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-text-secondary leading-relaxed">
              Dirancang melampaui standar aksesibilitas pasif. Setiap alat bantu bekerja langsung pada struktur teks dan interaksi halaman.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-12">
            <div data-reveal-item="left" className="double-bezel lg:col-span-7">
              <div className="double-bezel-inner h-full p-7 sm:p-9 flex flex-col justify-between bg-gradient-to-br from-primary-50/80 via-surface to-surface">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-900 text-white">
                      <Eye size={24} weight="light" />
                    </span>
                    <span className="rounded-full border border-primary-200 bg-surface px-3.5 py-1 text-xs font-semibold text-primary-900">
                      DOM Typography Engine
                    </span>
                  </div>
                  <h3 className="mt-6 text-2xl font-extrabold tracking-tight text-text-primary">
                    Studio Baca Adaptif, Bionic, & Penggaris Fokus
                  </h3>
                  <p className="mt-2.5 text-sm sm:text-base text-text-secondary leading-relaxed">
                    Kendalikan ukuran teks (16-28px), tinggi baris (1.3-2.1), spasi karakter, empat tema kontras (Terang, Kertas Lembut, Gelap Nyaman, Kontras AAA), serta penggaris fokus yang mengikuti kursor atau sentuhan.
                  </p>
                </div>

                <div className="mt-8 grid sm:grid-cols-3 gap-2.5 pt-5 border-t border-border">
                  <div className="rounded-2xl bg-surface border border-border px-3.5 py-2.5">
                    <p className="font-mono text-xs font-bold text-primary-800">Preset 01</p>
                    <p className="text-xs font-semibold text-text-primary mt-0.5">Ramah Disleksia</p>
                  </div>
                  <div className="rounded-2xl bg-surface border border-border px-3.5 py-2.5">
                    <p className="font-mono text-xs font-bold text-primary-800">Preset 02</p>
                    <p className="text-xs font-semibold text-text-primary mt-0.5">Low Vision 22px</p>
                  </div>
                  <div className="rounded-2xl bg-surface border border-border px-3.5 py-2.5">
                    <p className="font-mono text-xs font-bold text-primary-800">Preset 03</p>
                    <p className="text-xs font-semibold text-text-primary mt-0.5">Baca Malam Gelap</p>
                  </div>
                </div>
              </div>
            </div>

            <div data-reveal-item="right" className="double-bezel-dark lg:col-span-5">
              <div className="double-bezel-dark-inner h-full p-7 sm:p-9 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-primary-200">
                      <SpeakerHigh size={24} weight="light" />
                    </span>
                    <span className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1 font-mono text-xs font-semibold text-primary-100">
                      Web Speech API id-ID
                    </span>
                  </div>
                  <h3 className="mt-6 text-2xl font-extrabold tracking-tight text-white">
                    Audio Reader dengan Sorotan Kata Sinkron
                  </h3>
                  <p className="mt-2.5 text-sm sm:text-base text-slate-300 leading-relaxed">
                    Dengarkan seluruh modul dalam Bahasa Indonesia dengan pengatur laju 0.75x hingga 1.5x. Kata yang sedang diucapkan disorot secara real-time untuk memperkuat fokus bimodal.
                  </p>
                </div>

                <div className="mt-8 rounded-2xl border border-white/15 bg-white/5 p-4 text-xs text-primary-100 leading-relaxed">
                  Setiap istilah di dalam Kamus Glosarium juga memiliki tombol pelafalan suara instan.
                </div>
              </div>
            </div>

            <div data-reveal-item="scale" className="double-bezel lg:col-span-4">
              <div className="double-bezel-inner h-full p-7 flex flex-col justify-between">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-800 border border-primary-200">
                    <Target size={22} weight="light" />
                  </div>
                  <h3 className="mt-5 text-xl font-extrabold tracking-tight text-text-primary">
                    Mode Fokus & Command Ctrl+K
                  </h3>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                    Sembunyikan distraksi visual satu klik, atau kendalikan seluruh fitur aksesibilitas dan pencarian modul lewat keyboard.
                  </p>
                </div>
                <p className="mt-6 font-mono text-xs font-semibold text-primary-800">
                  Zero-Mouse Navigation Ready
                </p>
              </div>
            </div>

            <div data-reveal-item="scale" className="double-bezel lg:col-span-4">
              <div className="double-bezel-inner h-full p-7 flex flex-col justify-between bg-surface-elevated/60">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-100 text-accent-800 border border-accent-200">
                    <TextAa size={22} weight="light" />
                  </div>
                  <h3 className="mt-5 text-xl font-extrabold tracking-tight text-text-primary">
                    Ringkasan Bertingkat & Catatan
                  </h3>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                    Pahami poin inti subtema terlebih dahulu sebelum masuk ke wacana penuh, lalu tulis refleksi pribadi yang tersimpan otomatis.
                  </p>
                </div>
                <p className="mt-6 font-mono text-xs font-semibold text-accent-800">
                  Progressive Disclosure
                </p>
              </div>
            </div>

            <div data-reveal-item="scale" className="double-bezel lg:col-span-4">
              <div className="double-bezel-inner h-full p-7 flex flex-col justify-between">
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-800 border border-primary-200">
                    <Lightning size={22} weight="light" />
                  </div>
                  <h3 className="mt-5 text-xl font-extrabold tracking-tight text-text-primary">
                    Pendamping Aksa & Spaced Quiz
                  </h3>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                    Tanyakan konsep sulit kepada Aksa dan perkuat ingatan jangka panjang lewat pengulangan kuis terjadwal.
                  </p>
                </div>
                <p className="mt-6 font-mono text-xs font-semibold text-primary-800">
                  Adaptive Mastery Loop
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="katalog-materi"
        data-scroll-reveal
        className="border-y border-border bg-surface-elevated/70 py-24 sm:py-32"
        aria-labelledby="catalog-heading"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2
              id="catalog-heading"
              className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold text-text-primary tracking-tight leading-[1.12]"
            >
              Kurikulum Inklusif: {learningCategories.length} Rumpun Ilmu & {materials.length} Modul.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-text-secondary leading-relaxed">
              Setiap modul dilengkapi ringkasan sederhana, istilah glosarium interaktif, ruang catatan refleksi, dan evaluasi pemahaman.
            </p>
          </div>

          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {learningCategories.map((cat) => {
              const count = materials.filter((m) => m.categoryId === cat.id).length
              return (
                <Link
                  key={cat.id}
                  to="/materials"
                  data-reveal-item="scale"
                  className="group double-bezel hover:-translate-y-1"
                >
                  <div className="double-bezel-inner h-full p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-text-muted">
                        <span className="rounded-full bg-primary-50 border border-primary-200 px-3 py-0.5 text-primary-900">
                          {count} modul
                        </span>
                        <ArrowUpRight
                          size={16}
                          weight="bold"
                          className="text-text-muted group-hover:text-primary-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 spring-transition"
                        />
                      </div>
                      <h3 className="mt-4 text-lg font-extrabold tracking-tight text-text-primary group-hover:text-primary-700 transition-colors">
                        {cat.title}
                      </h3>
                      <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                    <span className="mt-6 pt-3 border-t border-border inline-flex items-center gap-1.5 text-xs font-bold text-primary-800">
                      Buka rumpun materi <ArrowRight size={13} weight="bold" />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section data-scroll-reveal className="py-24 sm:py-32" aria-labelledby="impact-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="double-bezel-dark">
            <div className="double-bezel-dark-inner p-8 sm:p-14">
              <div className="grid lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-7">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-[11px] uppercase tracking-[0.18em] font-semibold text-primary-200 mb-5">
                    <ShieldCheck size={14} weight="fill" />
                    <span>Zero-Stigma Adaptive Architecture</span>
                  </div>
                  <h2
                    id="impact-heading"
                    className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.1]"
                  >
                    Teknologi pendidikan yang menghormati cara manusia belajar.
                  </h2>
                  <p className="mt-4 text-slate-300 leading-relaxed max-w-xl text-base sm:text-lg">
                    EduBridge tidak meminta label atau diagnosis pengguna. Setiap orang bebas meracik ruang bacanya sendiri, menguji pemahaman tanpa rasa takut salah, dan menyimpan portofolio belajarnya.
                  </p>
                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <Link
                      to={primaryActionRoute}
                      className="group inline-flex items-center gap-3.5 rounded-full bg-white pl-6 pr-2 py-2 text-sm font-bold text-primary-950 hover:bg-primary-50 active:scale-[0.98] spring-transition"
                    >
                      <span>{primaryActionLabel}</span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-900 text-white transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105">
                        <ArrowUpRight size={16} weight="bold" />
                      </span>
                    </Link>
                    <Link
                      to="/materials"
                      className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/10 active:scale-[0.98] spring-transition"
                    >
                      <span>Eksplorasi Kurikulum</span>
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                  {[
                    { icon: Users, label: 'Desain Inklusif', sub: 'Tanpa asumsi kemampuan' },
                    { icon: GraduationCap, label: 'Evaluasi Suportif', sub: 'Mode Santai & Spaced Review' },
                    { icon: Devices, label: 'Responsif Penuh', sub: 'Nyaman di HP & Desktop' },
                    { icon: Lightning, label: 'Aksa Companion', sub: 'Bantuan AI & Lokal Instan' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      data-reveal-item="scale"
                      className="rounded-3xl border border-white/12 bg-white/5 p-5"
                    >
                      <item.icon size={24} weight="light" className="text-primary-300" />
                      <p className="mt-3 font-bold text-sm text-white">{item.label}</p>
                      <p className="mt-1 text-xs text-slate-300 leading-relaxed">{item.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </main>

      <footer className="border-t border-border bg-surface py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-900 text-white font-extrabold text-xs">
                EB
              </div>
              <span className="font-extrabold text-text-primary tracking-tight">EduBridge</span>
              <span className="text-xs text-text-muted">Platform Pembelajaran Adaptif Inklusif</span>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-text-secondary">
              <Link to="/dashboard" className="hover:text-primary-700">Dashboard</Link>
              <Link to="/materials" className="hover:text-primary-700">Eksplorasi Kurikulum</Link>
              <Link to="/progress" className="hover:text-primary-700">Portofolio Progres</Link>
              <Link to="/settings" className="hover:text-primary-700">Studio Aksesibilitas</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
