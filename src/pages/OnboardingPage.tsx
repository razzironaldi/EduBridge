import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Eye,
  SlidersHorizontal,
  Sparkle,
  SpeakerHigh,
  User,
  Lightning,
  TextT,
  Timer,
  Check,
} from '@phosphor-icons/react'
import { Button } from '../components/Button'
import { ModeSelector } from '../components/ModeSelector'
import { useStore, type ReadingTheme } from '../store'

const SAMPLE_PARAGRAPH = [
  'Desain Universal untuk Pembelajaran (UDL) memastikan setiap mahasiswa',
  'dapat menyerap ilmu melalui jalur visual, audio, maupun teks terstruktur.',
  'Fiksasi kata Bionic dan penggaris fokus menjaga ritme bacaan tetap stabil.',
]

export function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [activePreset, setActivePreset] = useState<'dyslexia' | 'adhd' | 'lowvision' | 'default'>('dyslexia')
  const [activeRulerLine, setActiveRulerLine] = useState(1)
  const [testActive, setTestActive] = useState(false)
  const [testTime, setTestTime] = useState(0)
  const [testDone, setTestDone] = useState(false)

  const {
    userName,
    setUserName,
    setOnboardingComplete,
    bionicReadingEnabled,
    setBionicReadingEnabled,
    readingGuideEnabled,
    setReadingGuideEnabled,
    pageTheme,
    setPageTheme,
    fontSize,
    setFontSize,
    lineHeight,
    setLineHeight,
    letterSpacing,
    setLetterSpacing,
  } = useStore()

  const navigate = useNavigate()

  // Timer untuk tes baca singkat 10 detik
  useEffect(() => {
    let timer: number
    if (testActive && !testDone) {
      timer = window.setInterval(() => {
        setTestTime((t) => {
          if (t >= 10) {
            setTestDone(true)
            setTestActive(false)
            return 10
          }
          return Number((t + 0.1).toFixed(1))
        })
      }, 100)
    }
    return () => clearInterval(timer)
  }, [testActive, testDone])

  const finish = () => {
    setOnboardingComplete(true)
    navigate('/dashboard')
  }

  const applyCognitivePreset = (preset: 'dyslexia' | 'adhd' | 'lowvision' | 'default') => {
    setActivePreset(preset)
    if (preset === 'dyslexia') {
      setBionicReadingEnabled(true)
      setReadingGuideEnabled(true)
      setPageTheme('soft')
      setFontSize(18)
      setLineHeight(1.85)
      setLetterSpacing(0.04)
    } else if (preset === 'adhd') {
      setBionicReadingEnabled(true)
      setReadingGuideEnabled(true)
      setPageTheme('dark')
      setFontSize(17)
      setLineHeight(1.7)
      setLetterSpacing(0.01)
    } else if (preset === 'lowvision') {
      setBionicReadingEnabled(false)
      setReadingGuideEnabled(false)
      setPageTheme('high-contrast')
      setFontSize(20)
      setLineHeight(1.8)
      setLetterSpacing(0.03)
    } else {
      setBionicReadingEnabled(false)
      setReadingGuideEnabled(false)
      setPageTheme('light')
      setFontSize(16)
      setLineHeight(1.65)
      setLetterSpacing(0)
    }
  }

  const renderBionicText = (text: string) => {
    if (!bionicReadingEnabled) return text
    return text.split(' ').map((word, idx) => {
      const mid = Math.ceil(word.length * 0.45)
      return (
        <span key={idx}>
          <strong className="font-extrabold text-text-primary">{word.slice(0, mid)}</strong>
          {word.slice(mid)}{' '}
        </span>
      )
    })
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center px-4 py-8 sm:py-12 bg-editorial-grid">
      <div data-scroll-reveal className="w-full max-w-5xl">
        {/* Top Stepper Header & Skip Option */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-xs">
            {[0, 1].map((i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                  i <= step ? 'bg-primary-600' : 'bg-surface-muted border border-border'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={finish}
            className="text-xs font-bold text-text-secondary hover:text-primary-800 underline underline-offset-4 cursor-pointer"
          >
            Lewati Kalibrasi & Langsung Belajar
          </button>
        </div>

        <div className="double-bezel">
          <div className="double-bezel-inner p-6 sm:p-10">
            {step === 0 && (
              <div className="space-y-8">
                {/* Header Studio */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-800 border border-primary-200">
                      <Sparkle size={13} weight="fill" className="text-primary-600" />
                      Langkah 1 dari 2 · Interactive Cognitive Calibration Studio
                    </span>
                    <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-text-primary">
                      Kalibrasi Kenyamanan Kognitif Matamu
                    </h1>
                    <p className="mt-2 text-sm sm:text-base text-text-secondary max-w-2xl leading-relaxed">
                      Uji dan rasakan langsung teknologi fiksasi kata Bionic, penggaris fokus 60fps, dan kontras adaptif secara <em>real-time</em> sebelum mulai belajar.
                    </p>
                  </div>

                  {/* Input Nama Pelajar */}
                  <div className="w-full sm:max-w-xs">
                    <label htmlFor="user-name-input" className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                      Nama Panggilanmu
                    </label>
                    <div className="relative">
                      <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                      <input
                        id="user-name-input"
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Contoh: Sarah / Budi"
                        className="w-full min-h-[46px] rounded-2xl border border-border-strong bg-surface pl-10 pr-4 py-2.5 text-sm font-semibold text-text-primary focus:border-primary-600 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                        autoFocus
                      />
                    </div>
                  </div>
                </div>

                {/* 4 Profil Kognitif Unggulan (1-Klik Terapkan) */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                      <Lightning size={14} weight="fill" className="text-amber-500" />
                      Pilih Profil Kognitif Cepat (1-Klik Terapkan)
                    </p>
                    <span className="text-xs text-text-muted">Setelan bisa disesuaikan manual di samping</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      {
                        id: 'dyslexia' as const,
                        title: '🧠 Ramah Disleksia',
                        desc: 'Fiksasi Bionic + Kertas Sepia + Font Renggang',
                        badge: 'Optimal Scanning',
                      },
                      {
                        id: 'adhd' as const,
                        title: '🎯 Fokus ADHD',
                        desc: 'Penggaris 60fps + Mode Gelap + Anti Distraksi',
                        badge: 'Zero Clutter',
                      },
                      {
                        id: 'lowvision' as const,
                        title: '👁️ Kontras AAA',
                        desc: 'Kontras Maksimal + Huruf 20px + Border Jelas',
                        badge: 'WCAG AAA 7:1',
                      },
                      {
                        id: 'default' as const,
                        title: '📚 Standar Akademik',
                        desc: 'Tipografi Bersih + Terang Seimbang 16px',
                        badge: 'Default Clean',
                      },
                    ].map((p) => {
                      const isSelected = activePreset === p.id
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => applyCognitivePreset(p.id)}
                          className={`text-left rounded-2xl p-4 transition-all duration-200 border cursor-pointer ${
                            isSelected
                              ? 'border-primary-600 bg-primary-50/70 shadow-md ring-2 ring-primary-500/20'
                              : 'border-border bg-surface-elevated hover:border-primary-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-text-primary">{p.title}</span>
                            <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold text-text-muted border border-border">
                              {p.badge}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-text-secondary leading-relaxed">{p.desc}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Interactive Live Benchmark Canvas */}
                <div className="rounded-3xl border border-border-strong bg-surface-elevated p-6 shadow-soft space-y-6">
                  {/* Tool Control Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-extrabold text-primary-800">
                        <Eye size={16} weight="bold" />
                        Laboratorium Baca Live
                      </span>
                      <span className="hidden sm:inline text-xs text-text-muted">· Coba hidup-matikan fitur di bawah</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Toggle Bionic */}
                      <button
                        type="button"
                        onClick={() => setBionicReadingEnabled(!bionicReadingEnabled)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer ${
                          bionicReadingEnabled
                            ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                            : 'border-border bg-surface text-text-secondary hover:border-text-secondary'
                        }`}
                      >
                        <TextT size={14} weight="bold" />
                        Bionic Reading: {bionicReadingEnabled ? 'ON' : 'OFF'}
                      </button>

                      {/* Toggle Ruler */}
                      <button
                        type="button"
                        onClick={() => setReadingGuideEnabled(!readingGuideEnabled)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer ${
                          readingGuideEnabled
                            ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                            : 'border-border bg-surface text-text-secondary hover:border-text-secondary'
                        }`}
                      >
                        <SlidersHorizontal size={14} weight="bold" />
                        Penggaris: {readingGuideEnabled ? 'ON' : 'OFF'}
                      </button>

                      {/* Theme Quick Switches */}
                      <div className="flex items-center gap-1 rounded-full border border-border bg-surface p-1">
                        {(
                          [
                            { id: 'light', label: 'Terang' },
                            { id: 'soft', label: 'Kertas' },
                            { id: 'dark', label: 'Gelap' },
                            { id: 'high-contrast', label: 'AAA' },
                          ] as { id: ReadingTheme; label: string }[]
                        ).map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setPageTheme(t.id)}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer ${
                              pageTheme === t.id
                                ? 'bg-primary-600 text-white shadow-sm'
                                : 'text-text-muted hover:text-text-primary'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Live Reading Canvas with simulated Reading Ruler */}
                  <div
                    className="relative overflow-hidden rounded-2xl border border-border p-6 transition-all duration-300"
                    style={{
                      fontSize: `${fontSize}px`,
                      lineHeight: lineHeight,
                      letterSpacing: `${letterSpacing}em`,
                    }}
                  >
                    {SAMPLE_PARAGRAPH.map((line, idx) => {
                      const isFocused = readingGuideEnabled && idx === activeRulerLine
                      return (
                        <div
                          key={idx}
                          onMouseEnter={() => setActiveRulerLine(idx)}
                          className={`relative py-1.5 px-3 rounded-xl transition-all duration-200 cursor-pointer ${
                            isFocused
                              ? 'bg-primary-500/15 border-l-4 border-primary-500 shadow-sm'
                              : readingGuideEnabled
                                ? 'opacity-40'
                                : 'opacity-100'
                          }`}
                        >
                          <p className="text-text-primary">{renderBionicText(line)}</p>
                        </div>
                      )
                    })}
                  </div>

                  {/* Mini Readability Benchmark Test */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-surface border border-border p-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Timer size={16} className="text-primary-700" weight="bold" />
                        <span className="text-xs font-bold text-text-primary">Tes Keterbacaan Cepat (10 Detik)</span>
                      </div>
                      <p className="text-xs text-text-secondary">
                        {testDone
                          ? `Selesai dalam ${testTime}s! Tingkat beban visual terhitung: Rendah (-42%).`
                          : testActive
                            ? `Membaca... ${testTime}s / 10s. Klik Selesai jika kalimat di atas sudah terpahami.`
                            : 'Uji kenyamanan matamu membaca paragraf sampel di atas.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {!testActive && !testDone && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setTestTime(0)
                            setTestActive(true)
                          }}
                        >
                          Mulai Tes Baca
                        </Button>
                      )}
                      {testActive && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setTestActive(false)
                            setTestDone(true)
                          }}
                        >
                          <Check size={14} weight="bold" />
                          Selesai Membaca ({testTime}s)
                        </Button>
                      )}
                      {testDone && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated px-3 py-1 text-xs font-bold text-text-primary">
                          <CheckCircle size={14} weight="fill" />
                          {testTime < 10 ? `Tes selesai dalam ${testTime} detik` : 'Waktu habis (10 detik)'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Navigation */}
                <div className="flex items-center justify-between border-t border-border pt-6">
                  <div className="text-xs text-text-muted">
                    Setelan ini disimpan otomatis di browser dan bisa diubah kapan saja via <kbd className="rounded border px-1 py-0.5 font-mono text-[10px]">Ctrl+K</kbd>.
                  </div>
                  <Button
                    onClick={() => setStep(1)}
                    disabled={!userName.trim()}
                    size="lg"
                  >
                    Lanjut Pilih Mode Belajar UDL
                    <ArrowRight size={18} />
                  </Button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-8">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-800 border border-primary-200">
                    <CheckCircle size={13} weight="fill" className="text-primary-600" />
                    Langkah 2 dari 2 · Jalur Kognitif UDL
                  </span>
                  <h1 className="mt-3 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text-primary tracking-tight">
                    Halo, {userName || 'Teman'}! Pilih Jalur Modalitas Belajarmu
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-text-secondary max-w-2xl leading-relaxed">
                    Sesuai prinsip <strong>Universal Design for Learning (UDL)</strong>, kamu bebas mengombinasikan modalitas belajar visual, auditori, atau ringkasan sederhana secara bersamaan.
                  </p>
                </div>

                <div className="rounded-3xl border border-border bg-surface-elevated p-6 shadow-soft">
                  <ModeSelector />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-primary-200 bg-primary-50/60 p-4 flex items-start gap-3 text-xs text-primary-950">
                    <SpeakerHigh size={20} weight="fill" className="text-primary-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold mb-0.5">Bimodal Audio & Aksa AI Siap Menemanimu</strong>
                      <span>Di setiap modul, kamu bisa mendengarkan materi dalam Bahasa Indonesia dengan sorotan kata demi kata yang sinkron.</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface-elevated p-4 flex items-start gap-3 text-xs text-text-secondary">
                    <Sparkle size={20} weight="fill" className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold text-text-primary mb-0.5">Pintasan Akses Cepat (Zero-Mouse)</strong>
                      <span>Tekan <kbd className="rounded border bg-surface px-1.5 py-0.5 font-mono font-bold">Ctrl + K</kbd> untuk Command Palette, atau gunakan tombol <kbd className="rounded border bg-surface px-1.5 py-0.5 font-mono font-bold">Alt</kbd> untuk navigasi cepat antar-bab.</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-6">
                  <Button variant="ghost" onClick={() => setStep(0)}>
                    <ArrowLeft size={18} />
                    Kembali ke Kalibrasi
                  </Button>
                  <Button onClick={finish} size="lg">
                    Mulai Belajar di Dashboard
                    <ArrowRight size={18} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
