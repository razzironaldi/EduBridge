import { useEffect, useRef, useState } from 'react'
import {
  Play,
  Pause,
  SpeakerHigh,
  Sparkle,
  CornersOut,
  ArrowsIn,
  ArrowUpRight,
  MagnifyingGlass,
  Check,
  Cursor,
} from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { useStore } from '../store'

interface DemoChapter {
  id: string
  timeRange: [number, number]
  badge: string
  title: string
  subtitle: string
  narration: string
  tryRoute: string
  tryLabel: string
}

const CHAPTERS: DemoChapter[] = [
  {
    id: '01',
    timeRange: [0, 4],
    badge: '01 · Bionic Fixation',
    title: 'Fiksasi Suku Kata Otomatis di Level DOM',
    subtitle:
      'Kursor mengaktifkan Bionic Reading dan kamera mendekat ke paragraf untuk memperlihatkan penebalan huruf awal.',
    narration:
      'Adegan pertama: kursor mengaktifkan Bionic Reading, lalu kamera memperbesar tampilan suku kata awal yang ditebalkan agar pembaca disleksia dan ADHD memindai kalimat dua kali lebih stabil.',
    tryRoute: '/materials/udl-praktis',
    tryLabel: 'Coba Bionic di Ruang Baca',
  },
  {
    id: '02',
    timeRange: [4, 8],
    badge: '02 · Reading Ruler 60fps',
    title: 'Penggaris Fokus Baris Berakselerasi GPU',
    subtitle:
      'Pita fokus menyorot baris aktif mengikuti pergerakan kursor agar mata tidak melompat antar-kalimat.',
    narration:
      'Adegan kedua: penggaris fokus baris bergerak mengikuti kursor secara mulus pada enam puluh frame per detik untuk menjaga orientasi bacaan.',
    tryRoute: '/materials/udl-praktis',
    tryLabel: 'Aktifkan Garis Baca',
  },
  {
    id: '03',
    timeRange: [8, 12],
    badge: '03 · Bimodal Audio id-ID',
    title: 'Sintesis Suara Bahasa Indonesia + Sorotan Kata',
    subtitle:
      'Spektrum gelombang suara aktif bersamaan dengan sorotan kuning pada kata yang sedang diucapkan.',
    narration:
      'Adegan ketiga: pembaca suara Bahasa Indonesia aktif sambil menyorot kata demi kata secara sinkron untuk memperkuat fokus auditori dan visual.',
    tryRoute: '/materials/arsitektur-web-aksesibel',
    tryLabel: 'Dengarkan Modul Audio',
  },
  {
    id: '04',
    timeRange: [12, 16],
    badge: '04 · Command Palette Ctrl+K',
    title: 'Kendali Penuh Keyboard Tanpa Mouse',
    subtitle:
      'Modal Command Palette terbuka instan untuk memilih preset disleksia, kontras AAA, atau melompat ke 17 modul.',
    narration:
      'Adegan keempat: pusat komando Control K membuka akses instan ke seluruh profil kognitif dan tujuh belas modul pembelajaran hanya dengan keyboard.',
    tryRoute: '/settings',
    tryLabel: 'Buka Studio Preset',
  },
]

const DURATION = 16
const SAMPLE_WORDS =
  'Pembelajaran adaptif membantu setiap mahasiswa memahami materi dengan ritme yang paling nyaman bagi dirinya.'.split(' ')
const RULER_LINES = [
  'Desain Universal untuk Pembelajaran (UDL)',
  'menyediakan banyak cara untuk terlibat,',
  'banyak cara menyajikan informasi, dan',
  'banyak cara bagi mahasiswa untuk',
  'menunjukkan apa yang mereka pahami.',
]
const PRESETS = ['Preset Disleksia', 'Kontras Tinggi AAA', 'Mode Fokus ADHD', 'Buka Modul: UDL Praktis']

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const ease = (x: number) => 1 - Math.pow(1 - clamp01(x), 3)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function FakeCursor({
  x,
  y,
  clicking,
  isHighContrast,
}: {
  x: number
  y: number
  clicking: boolean
  isHighContrast?: boolean
}) {
  return (
    <div className="pointer-events-none absolute z-30" style={{ left: `${x}%`, top: `${y}%` }}>
      {clicking && (
        <span
          className={`absolute -left-3 -top-3 h-8 w-8 rounded-full border-2 ${
            isHighContrast ? 'border-black bg-yellow-300/40' : 'border-teal-300'
          } animate-ping`}
        />
      )}
      <Cursor
        size={26}
        weight="fill"
        className={
          isHighContrast
            ? 'text-black drop-shadow-[0_2px_4px_rgba(255,255,255,0.9)]'
            : 'text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]'
        }
        style={{ transform: clicking ? 'scale(0.85)' : 'scale(1)' }}
      />
    </div>
  )
}

function BionicScene({ p, isHighContrast, isSoft }: { p: number; isHighContrast?: boolean; isSoft?: boolean }) {
  const t = ease(p / 0.25)
  const on = p > 0.28
  const zoom = 1 + 0.18 * ease((p - 0.45) / 0.3)
  return (
    <div className="relative h-full">
      <div className="flex items-center justify-between">
        <span
          className={`font-mono text-[11px] uppercase tracking-[0.16em] ${
            isHighContrast ? 'text-black font-semibold' : isSoft ? 'text-stone-400' : 'text-slate-400'
          }`}
        >
          Ruang Baca · UDL Praktis
        </span>
        <span
          className={`flex items-center gap-2 text-xs font-semibold ${
            isHighContrast ? 'text-black' : isSoft ? 'text-stone-200' : 'text-slate-200'
          }`}
        >
          Bionic
          <span
            className={`relative h-6 w-11 rounded-full transition-colors duration-300 ${
              isHighContrast
                ? on
                  ? 'bg-black border border-black'
                  : 'bg-white border-2 border-black'
                : on
                  ? isSoft
                    ? 'bg-amber-400'
                    : 'bg-teal-400'
                  : 'bg-white/15'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full transition-all duration-300 ${
                isHighContrast ? (on ? 'bg-white' : 'bg-black') : 'bg-white'
              }`}
              style={{ left: on ? '1.4rem' : '0.125rem' }}
            />
          </span>
        </span>
      </div>
      <p
        className={`mt-6 sm:mt-10 max-w-xl text-base sm:text-2xl leading-relaxed ${
          isHighContrast ? 'text-black' : isSoft ? 'text-stone-200' : 'text-slate-200'
        }`}
        style={{ transform: `scale(${zoom})`, transformOrigin: 'left top' }}
      >
        {SAMPLE_WORDS.map((w, i) => {
          const k = Math.ceil(w.length * 0.45)
          return (
            <span key={i}>
              {on ? (
                <>
                  <b
                    className={`font-semibold ${
                      isHighContrast
                        ? 'text-black underline decoration-2'
                        : isSoft
                          ? 'text-amber-200'
                          : 'text-white'
                    }`}
                  >
                    {w.slice(0, k)}
                  </b>
                  <span
                    className={
                      isHighContrast ? 'text-neutral-700' : isSoft ? 'text-stone-400' : 'text-slate-400'
                    }
                  >
                    {w.slice(k)}
                  </span>
                </>
              ) : (
                w
              )}{' '}
            </span>
          )
        })}
      </p>
      <FakeCursor x={lerp(35, 93, t)} y={lerp(85, 2, t)} clicking={p > 0.24 && p < 0.34} isHighContrast={isHighContrast} />
    </div>
  )
}

function RulerScene({ p, isHighContrast, isSoft }: { p: number; isHighContrast?: boolean; isSoft?: boolean }) {
  const pos = clamp01((p - 0.05) / 0.85) * (RULER_LINES.length - 1)
  return (
    <div className="relative mt-2 sm:mt-6">
      <div
        className={`absolute inset-x-[-1rem] h-12 rounded-xl transition-transform ${
          isHighContrast
            ? 'border-2 border-black bg-yellow-300/40'
            : isSoft
              ? 'border-y-2 border-amber-400/80 bg-amber-400/15 shadow-[0_0_30px_rgba(251,191,36,0.2)]'
              : 'border-y-2 border-teal-300/70 bg-teal-400/15 shadow-[0_0_40px_rgba(45,212,191,0.25)]'
        }`}
        style={{ transform: `translateY(${pos * 3}rem)` }}
      />
      {RULER_LINES.map((line, i) => (
        <p
          key={i}
          className={`relative flex h-12 items-center text-sm sm:text-2xl font-medium ${
            isHighContrast ? 'text-black font-semibold' : 'text-white'
          }`}
          style={{ opacity: isHighContrast ? 1 : Math.max(0.22, 1 - Math.abs(i - pos) * 0.7) }}
        >
          {line}
        </p>
      ))}
      <div className="pointer-events-none absolute right-4 top-0" style={{ transform: `translateY(${pos * 3 + 0.8}rem)` }}>
        <Cursor
          size={26}
          weight="fill"
          className={
            isHighContrast
              ? 'text-black drop-shadow-[0_2px_4px_rgba(255,255,255,0.9)]'
              : 'text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]'
          }
        />
      </div>
    </div>
  )
}

function AudioScene({ p, isHighContrast, isSoft }: { p: number; isHighContrast?: boolean; isSoft?: boolean }) {
  const spoken = Math.floor(clamp01((p - 0.12) / 0.8) * SAMPLE_WORDS.length)
  const playing = p > 0.1
  return (
    <div className="relative h-full space-y-6">
      <div
        className={`flex items-center gap-4 rounded-2xl p-3 ${
          isHighContrast
            ? 'border-2 border-black bg-white'
            : isSoft
              ? 'border border-amber-500/20 bg-stone-900/60'
              : 'border border-white/10 bg-white/5'
        }`}
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            isHighContrast
              ? playing
                ? 'bg-black text-white'
                : 'bg-white text-black border-2 border-black'
              : playing
                ? isSoft
                  ? 'bg-amber-400 text-stone-950'
                  : 'bg-teal-400 text-slate-950'
                : 'bg-white/15 text-white'
          }`}
        >
          {playing ? <Pause size={16} weight="fill" /> : <Play size={16} weight="fill" />}
        </span>
        <div className="flex h-10 flex-1 items-center gap-[3px]">
          {Array.from({ length: 36 }, (_, i) => (
            <span
              key={i}
              className={`flex-1 rounded-full ${
                isHighContrast
                  ? 'bg-black'
                  : isSoft
                    ? 'bg-amber-300'
                    : 'bg-teal-300'
              }`}
              style={{ height: `${playing ? 15 + 85 * Math.abs(Math.sin(i * 0.55 + p * 40)) : 12}%` }}
            />
          ))}
        </div>
        <span
          className={`hidden sm:block font-mono text-[11px] font-semibold ${
            isHighContrast ? 'text-black' : isSoft ? 'text-amber-300' : 'text-teal-200'
          }`}
        >
          id-ID · 1.0x
        </span>
      </div>
      <p className="text-base sm:text-2xl leading-relaxed">
        {SAMPLE_WORDS.map((w, i) => (
          <span
            key={i}
            className={`rounded-md px-1 transition-colors duration-150 ${
              i === spoken
                ? isHighContrast
                  ? 'bg-yellow-300 text-black font-bold outline outline-2 outline-black'
                  : 'bg-amber-300 text-slate-950 font-medium'
                : i < spoken
                  ? isHighContrast
                    ? 'text-black'
                    : 'text-white'
                  : isHighContrast
                    ? 'text-neutral-700'
                    : isSoft
                      ? 'text-stone-500'
                      : 'text-slate-500'
            }`}
          >
            {w}{' '}
          </span>
        ))}
      </p>
      <FakeCursor x={lerp(40, 3, ease(p / 0.1))} y={lerp(80, 4, ease(p / 0.1))} clicking={p > 0.07 && p < 0.16} isHighContrast={isHighContrast} />
    </div>
  )
}

function PaletteScene({ p, isHighContrast, isSoft }: { p: number; isHighContrast?: boolean; isSoft?: boolean }) {
  const open = ease((p - 0.18) / 0.1) * (p > 0.8 ? 1 - ease((p - 0.8) / 0.06) : 1)
  const query = 'disleksia'.slice(0, Math.floor(clamp01((p - 0.32) / 0.3) * 9))
  const items = PRESETS.filter((x) => x.toLowerCase().includes(query))
  return (
    <div className="relative h-full">
      <div className={`space-y-3 ${isHighContrast ? 'opacity-20' : 'opacity-40'}`}>
        {[90, 75, 82, 60].map((w, i) => (
          <div
            key={i}
            className={`h-3 rounded-full ${isHighContrast ? 'bg-black' : 'bg-white/15'}`}
            style={{ width: `${w}%` }}
          />
        ))}
      </div>
      {p < 0.25 && (
        <div
          className="absolute inset-0 flex items-center justify-center gap-2"
          style={{ transform: `scale(${1 + 0.15 * ease(p / 0.1)})` }}
        >
          {['Ctrl', 'K'].map((k) => (
            <kbd
              key={k}
              className={`rounded-xl px-4 py-2 font-mono text-base font-semibold shadow-md ${
                isHighContrast
                  ? 'border-2 border-black bg-yellow-300 text-black'
                  : isSoft
                    ? 'border-b-4 border-amber-700 bg-amber-400 text-stone-950'
                    : 'border-b-4 border-teal-700 bg-teal-400 text-slate-950'
              }`}
            >
              {k}
            </kbd>
          ))}
        </div>
      )}
      <div
        className={`absolute inset-x-0 top-0 mx-auto max-w-md rounded-2xl shadow-2xl ${
          isHighContrast
            ? 'border-2 border-black bg-white text-black'
            : isSoft
              ? 'border border-amber-500/20 bg-stone-900/95 text-stone-100'
              : 'border border-white/15 bg-slate-950/95 text-white'
        }`}
        style={{ opacity: open, transform: `translateY(${(1 - open) * 12}px) scale(${0.96 + 0.04 * open})` }}
      >
        <div
          className={`flex items-center gap-2 px-4 py-3 text-sm ${
            isHighContrast ? 'border-b-2 border-black' : 'border-b border-white/10'
          }`}
        >
          <MagnifyingGlass
            size={16}
            className={isHighContrast ? 'text-black' : isSoft ? 'text-amber-300' : 'text-teal-300'}
          />
          <span className={isHighContrast ? 'text-black font-semibold' : 'text-white'}>{query}</span>
          <span
            className={`-ml-1.5 h-4 w-0.5 animate-pulse ${
              isHighContrast ? 'bg-black' : isSoft ? 'bg-amber-300' : 'bg-teal-300'
            }`}
          />
          {!query && (
            <span className={isHighContrast ? 'text-neutral-700' : 'text-slate-500'}>
              Cari preset atau modul…
            </span>
          )}
        </div>
        <ul className="p-2">
          {items.map((x, i) => (
            <li
              key={x}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                i === 0
                  ? isHighContrast
                    ? 'bg-black text-white font-bold'
                    : isSoft
                      ? 'bg-amber-400/20 text-amber-200'
                      : 'bg-teal-400/20 text-teal-100'
                  : isHighContrast
                    ? 'text-black'
                    : isSoft
                      ? 'text-stone-300'
                      : 'text-slate-300'
              }`}
            >
              {x}
            </li>
          ))}
        </ul>
      </div>
      {p > 0.82 && (
        <div
          className={`absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs sm:text-sm font-semibold shadow-xl ${
            isHighContrast
              ? 'border-2 border-black bg-yellow-300 text-black font-bold'
              : isSoft
                ? 'bg-amber-400 text-stone-950'
                : 'bg-teal-400 text-slate-950'
          }`}
        >
          <Check size={16} weight="bold" /> Preset Disleksia diterapkan
        </div>
      )}
    </div>
  )
}

function TourStage({
  chapterId,
  p,
  isHighContrast,
  isSoft,
}: {
  chapterId: string
  p: number
  isHighContrast?: boolean
  isSoft?: boolean
}) {
  const scene =
    chapterId === '01' ? (
      <BionicScene p={p} isHighContrast={isHighContrast} isSoft={isSoft} />
    ) : chapterId === '02' ? (
      <RulerScene p={p} isHighContrast={isHighContrast} isSoft={isSoft} />
    ) : chapterId === '03' ? (
      <AudioScene p={p} isHighContrast={isHighContrast} isSoft={isSoft} />
    ) : (
      <PaletteScene p={p} isHighContrast={isHighContrast} isSoft={isSoft} />
    )

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center p-3 pt-12 sm:p-8 sm:pt-14 ${
        isHighContrast
          ? 'bg-neutral-50'
          : isSoft
            ? 'bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.1),transparent_70%)]'
            : 'bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.14),transparent_70%)]'
      }`}
    >
      <div
        className={`flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl shadow-xl ${
          isHighContrast
            ? 'border-2 border-black bg-white'
            : isSoft
              ? 'border border-amber-500/20 bg-stone-900 shadow-2xl'
              : 'border border-white/10 bg-slate-900 shadow-2xl'
        }`}
      >
        <div
          className={`flex items-center gap-2 px-4 py-2.5 ${
            isHighContrast
              ? 'border-b-2 border-black bg-neutral-100'
              : isSoft
                ? 'border-b border-white/10 bg-stone-950/70'
                : 'border-b border-white/10 bg-slate-950/60'
          }`}
        >
          {isHighContrast ? (
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-black bg-white" />
              <span className="h-2.5 w-2.5 rounded-full border border-black bg-neutral-400" />
              <span className="h-2.5 w-2.5 rounded-full border border-black bg-black" />
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
            </div>
          )}
          <span
            className={`ml-3 truncate rounded-full px-3 py-0.5 font-mono text-[10px] ${
              isHighContrast
                ? 'border border-black bg-white text-black font-semibold'
                : 'bg-white/5 text-slate-400'
            }`}
          >
            temanakses.app/materials/udl-praktis
          </span>
        </div>
        <div key={chapterId} className="route-transition relative flex-1 overflow-hidden p-5 sm:p-8">
          {scene}
        </div>
      </div>
    </div>
  )
}

export function InteractiveVideoShowcase() {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const pageTheme = useStore((s) => s.pageTheme)
  const isHighContrast = pageTheme === 'high-contrast'
  const isSoft = pageTheme === 'soft'

  // Reduced-motion users start paused; they can still press play or scrub.
  const [isPlaying, setIsPlaying] = useState(
    () => typeof window === 'undefined' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  const [isVisible, setIsVisible] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isNarrating, setIsNarrating] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const activeChapter =
    CHAPTERS.find((c) => currentTime >= c.timeRange[0] && currentTime < c.timeRange[1]) || CHAPTERS[0]
  const chapterProgress = (currentTime - activeChapter.timeRange[0]) / 4

  // Clock only ticks while playing AND on screen: no CPU burn off-viewport.
  useEffect(() => {
    if (!isPlaying || !isVisible) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      setCurrentTime((t) => (t + dt) % DURATION)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isPlaying, isVisible])

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setIsVisible(e.isIntersecting))
    io.observe(el)
    const onFs = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => {
      io.disconnect()
      document.removeEventListener('fullscreenchange', onFs)
      window.speechSynthesis?.cancel()
    }
  }, [])

  const togglePlay = () => setIsPlaying((v) => !v)

  const jumpToChapter = (startSec: number) => {
    setCurrentTime(startSec + 0.05)
    setIsPlaying(true)
  }

  const toggleFullscreen = () => {
    const el = stageRef.current
    if (!el) return
    if (!document.fullscreenElement) el.requestFullscreen?.().catch(() => {})
    else document.exitFullscreen?.().catch(() => {})
  }

  const speakCurrentChapter = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    if (isNarrating) {
      setIsNarrating(false)
      return
    }
    const u = new SpeechSynthesisUtterance(activeChapter.narration)
    u.lang = 'id-ID'
    u.onend = () => setIsNarrating(false)
    u.onerror = () => setIsNarrating(false)
    window.speechSynthesis.speak(u)
    setIsNarrating(true)
  }

  return (
    <div
      ref={stageRef}
      className={`relative mx-4 sm:mx-6 lg:mx-auto max-w-7xl rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 lg:p-12 overflow-hidden transition-all duration-300 ${
        isHighContrast
          ? 'border-2 border-black bg-white text-black shadow-none'
          : isSoft
            ? 'border border-amber-500/20 bg-[#1c1b18] text-[#f5f1e8] shadow-[0_32px_96px_-24px_rgba(0,0,0,0.45)] ring-1 ring-amber-500/10'
            : 'border border-white/10 bg-slate-950 text-white shadow-[0_32px_96px_-24px_rgba(2,6,23,0.55)] ring-1 ring-white/10'
      }`}
    >
      {!isHighContrast && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(20,184,166,0.15),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(245,158,11,0.08),transparent_55%)]"
        />
      )}

      <div className="relative z-10 space-y-8">
        {/* Header section with spacious, luxurious breathing room */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3.5">
            <div
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-medium transition-colors ${
                isHighContrast
                  ? 'border-2 border-black bg-yellow-300 text-black font-semibold'
                  : isSoft
                    ? 'border border-amber-400/30 bg-amber-400/10 text-amber-200'
                    : 'border border-teal-400/30 bg-teal-400/10 text-teal-200'
              }`}
            >
              <Sparkle
                size={14}
                weight="fill"
                className={isHighContrast ? 'text-black' : 'text-amber-300'}
                aria-hidden="true"
              />
              <span>Lihat cara kerjanya dalam 16 detik</span>
            </div>
            <h2
              id="video-reel-heading"
              className={`text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] leading-[1.12] ${
                isHighContrast ? 'text-black' : isSoft ? 'text-[#f5f1e8]' : 'text-white'
              }`}
            >
              Tur Interaktif Ruang Baca TemanAkses.
            </h2>
            <p
              className={`text-sm sm:text-base font-normal leading-relaxed max-w-2xl ${
                isHighContrast ? 'text-neutral-700' : isSoft ? 'text-stone-300/90' : 'text-slate-300/90'
              }`}
            >
              Lihat bagaimana kursor mengaktifkan fiksasi kata Bionic, menggerakkan penggaris fokus 60fps, memutar sintesis suara Bahasa Indonesia, dan membuka Command Palette{' '}
              <code
                className={`font-mono text-xs rounded px-1.5 py-0.5 ${
                  isHighContrast
                    ? 'border border-black bg-neutral-100 text-black font-bold'
                    : isSoft
                      ? 'bg-amber-400/15 text-amber-300'
                      : 'bg-teal-400/15 text-teal-300'
                }`}
              >
                Ctrl+K
              </code>
              .
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={speakCurrentChapter}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2 text-xs font-medium spring-transition cursor-pointer ${
                isHighContrast
                  ? isNarrating
                    ? 'border-2 border-black bg-yellow-300 text-black font-bold'
                    : 'border-2 border-black bg-white text-black hover:bg-neutral-100'
                  : isNarrating
                    ? 'border-amber-400 bg-amber-300 text-slate-950 font-semibold shadow-md'
                    : isSoft
                      ? 'border border-white/15 bg-white/5 text-stone-200 hover:bg-white/10'
                      : 'border border-white/15 bg-white/10 text-white hover:bg-white/15'
              }`}
            >
              <SpeakerHigh size={15} weight="fill" aria-hidden="true" />
              <span>{isNarrating ? 'Hentikan Voiceover' : 'Voiceover Bab (id-ID)'}</span>
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold spring-transition cursor-pointer shadow-md ${
                isHighContrast
                  ? 'border-2 border-black bg-black text-white hover:bg-neutral-800'
                  : isSoft
                    ? 'bg-amber-400 text-stone-950 hover:bg-amber-300'
                    : 'bg-teal-400 text-slate-950 hover:bg-teal-300'
              }`}
            >
              {isPlaying ? <Pause size={14} weight="fill" aria-hidden="true" /> : <Play size={14} weight="fill" aria-hidden="true" />}
              <span>{isPlaying ? 'Jeda Tur' : 'Putar Tur'}</span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Keluar dari layar penuh' : 'Tampilkan layar penuh'}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-full border spring-transition cursor-pointer ${
                isHighContrast
                  ? 'border-2 border-black bg-white text-black hover:bg-neutral-100'
                  : 'border-white/15 bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {isFullscreen ? <ArrowsIn size={16} aria-hidden="true" /> : <CornersOut size={16} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Video Stage Frame */}
        <div
          data-reveal-item="scale"
          className={
            isHighContrast
              ? 'rounded-3xl border-2 border-black p-1.5 bg-white'
              : isSoft
                ? 'rounded-[2rem] border border-amber-500/20 bg-amber-500/5 p-1.5 shadow-2xl'
                : 'double-bezel-dark'
          }
        >
          <div
            className={`overflow-hidden rounded-[1.55rem] ${
              isHighContrast
                ? 'border-2 border-black bg-white'
                : isSoft
                  ? 'border border-amber-500/20 bg-[#141311]'
                  : 'double-bezel-dark-inner bg-slate-950'
            }`}
          >
            <div
              role="img"
              aria-label={`${activeChapter.title}. ${activeChapter.subtitle}`}
              onClick={togglePlay}
              className={`relative aspect-[4/5] sm:aspect-video w-full overflow-hidden cursor-pointer select-none ${
                isHighContrast ? 'bg-neutral-50' : 'bg-slate-950'
              }`}
            >
              <div aria-hidden="true">
                <TourStage chapterId={activeChapter.id} p={chapterProgress} isHighContrast={isHighContrast} isSoft={isSoft} />
              </div>

              {/* Clean Active Chapter Status Overlay */}
              <div
                className={`pointer-events-none absolute top-4 left-4 z-40 flex items-center gap-2.5 rounded-full px-3.5 py-1.5 backdrop-blur-md ${
                  isHighContrast
                    ? 'border-2 border-black bg-white text-black'
                    : 'border border-white/15 bg-slate-950/80 text-white'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isHighContrast
                      ? 'bg-black'
                      : isPlaying
                        ? 'bg-teal-400 animate-pulse'
                        : 'bg-amber-400'
                  }`}
                />
                <span
                  className={`text-xs font-medium tracking-tight ${
                    isHighContrast ? 'text-black font-semibold' : 'text-slate-200'
                  }`}
                >
                  {activeChapter.badge}
                </span>
              </div>
            </div>

            {/* Clean bottom caption without slider bar and without redundant technical timestamps */}
            <div
              className={`px-6 sm:px-8 py-5 transition-colors ${
                isHighContrast
                  ? 'border-t-2 border-black bg-neutral-100 text-black'
                  : isSoft
                    ? 'border-t border-white/10 bg-stone-900/90 text-stone-100'
                    : 'border-t border-white/10 bg-slate-900/80 text-white'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1" aria-live="polite">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                    <Sparkle
                      size={15}
                      weight="fill"
                      className={isHighContrast ? 'text-black' : 'text-amber-300'}
                      aria-hidden="true"
                    />
                    <span className={isHighContrast ? 'text-black' : isSoft ? 'text-amber-200' : 'text-teal-200'}>
                      {activeChapter.title}
                    </span>
                  </div>
                  <p
                    className={`text-xs sm:text-sm font-normal ${
                      isHighContrast ? 'text-neutral-700' : isSoft ? 'text-stone-300/80' : 'text-slate-300/80'
                    }`}
                  >
                    {activeChapter.subtitle}
                  </p>
                </div>

                <Link
                  to={activeChapter.tryRoute}
                  className={`group inline-flex items-center gap-2 self-start sm:self-auto shrink-0 rounded-full px-4 py-2 text-xs font-semibold spring-transition ${
                    isHighContrast
                      ? 'border-2 border-black bg-black text-white hover:bg-neutral-800'
                      : isSoft
                        ? 'border border-amber-400/30 bg-amber-400/10 text-amber-200 hover:bg-amber-400 hover:text-stone-950'
                        : 'border border-white/15 bg-white/10 text-white hover:bg-teal-400 hover:text-slate-950'
                  }`}
                >
                  <span>{activeChapter.tryLabel}</span>
                  <ArrowUpRight size={14} weight="bold" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Chapter cards with elegant progress bars and subtle secondary amber accents */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {CHAPTERS.map((chap) => {
            const isCurrent = chap.id === activeChapter.id
            const progress = isCurrent ? clamp01(chapterProgress) * 100 : currentTime >= chap.timeRange[1] ? 100 : 0
            return (
              <button
                key={chap.id}
                type="button"
                data-reveal-item="scale"
                onClick={() => jumpToChapter(chap.timeRange[0])}
                aria-current={isCurrent ? 'step' : undefined}
                className={`text-left rounded-3xl p-4 spring-transition cursor-pointer ${
                  isHighContrast
                    ? isCurrent
                      ? 'border-2 border-black bg-black text-white shadow-md'
                      : 'border-2 border-black bg-white text-black hover:bg-neutral-100'
                    : isCurrent
                      ? isSoft
                        ? 'border border-amber-400/70 bg-amber-400/10 text-stone-100 shadow-xl'
                        : 'border border-teal-400/70 bg-white/10 text-white shadow-xl'
                      : 'border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07] hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-[11px] font-medium ${
                      isHighContrast
                        ? isCurrent
                          ? 'text-yellow-300 font-bold'
                          : 'text-black font-semibold'
                        : isCurrent
                          ? 'text-amber-300'
                          : 'text-teal-300/80'
                    }`}
                  >
                    {chap.badge}
                  </span>
                  <span
                    className={`font-mono text-[10px] ${
                      isHighContrast ? (isCurrent ? 'text-white' : 'text-neutral-700') : 'text-slate-400'
                    }`}
                  >
                    {chap.timeRange[0]}s–{chap.timeRange[1]}s
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-semibold tracking-tight line-clamp-1">
                  {chap.title}
                </p>
                <p
                  className={`mt-1 text-xs font-normal line-clamp-2 leading-relaxed ${
                    isHighContrast ? (isCurrent ? 'text-neutral-200' : 'text-neutral-700') : 'text-slate-400/90'
                  }`}
                >
                  {chap.subtitle}
                </p>
                <div
                  className={`mt-3 h-1.5 w-full overflow-hidden rounded-full ${
                    isHighContrast ? (isCurrent ? 'bg-neutral-800' : 'bg-neutral-200') : 'bg-white/10'
                  }`}
                >
                  <div
                    className={`h-full transition-all duration-100 ${
                      isHighContrast
                        ? 'bg-yellow-300'
                        : isSoft
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                          : 'bg-gradient-to-r from-teal-400 to-amber-300'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
