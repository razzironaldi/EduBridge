import { useStore } from '../store'
import type { ReadingTheme } from '../store'
import { cn } from '../lib/cn'
import { Sparkle, SlidersHorizontal, ArrowCounterClockwise } from '@phosphor-icons/react'

interface ReadingStudioProps {
  compact?: boolean
}

const themes: { id: ReadingTheme; label: string; swatch: string }[] = [
  { id: 'light', label: 'Terang', swatch: 'bg-white' },
  { id: 'soft', label: 'Kertas Lembut', swatch: 'bg-amber-50' },
  { id: 'dark', label: 'Gelap Nyaman', swatch: 'bg-slate-900' },
  { id: 'high-contrast', label: 'Kontras AAA', swatch: 'bg-black' },
]

const presets = [
  {
    name: 'Standar Nyaman',
    desc: 'Seimbang untuk layar laptop & HP',
    apply: { fontSize: 16, lineHeight: 1.65, letterSpacing: 0, pageTheme: 'light' as ReadingTheme, bionic: false, ruler: false },
  },
  {
    name: 'Ramah Disleksia & Fokus',
    desc: 'Huruf renggang + Bionic + Penggaris baca',
    apply: { fontSize: 19, lineHeight: 1.85, letterSpacing: 0.05, pageTheme: 'soft' as ReadingTheme, bionic: true, ruler: true },
  },
  {
    name: 'Low Vision / Kontras Maks',
    desc: 'Teks besar 22px + Kontras hitam-putih',
    apply: { fontSize: 22, lineHeight: 1.9, letterSpacing: 0.03, pageTheme: 'high-contrast' as ReadingTheme, bionic: false, ruler: false },
  },
]

export function ReadingStudio({ compact = false }: ReadingStudioProps) {
  const {
    fontSize,
    setFontSize,
    lineHeight,
    setLineHeight,
    letterSpacing,
    setLetterSpacing,
    pageTheme,
    setPageTheme,
    readingGuideEnabled,
    setReadingGuideEnabled,
    bionicReadingEnabled,
    setBionicReadingEnabled,
  } = useStore()

  const applyPreset = (p: (typeof presets)[number]['apply']) => {
    setFontSize(p.fontSize)
    setLineHeight(p.lineHeight)
    setLetterSpacing(p.letterSpacing)
    setPageTheme(p.pageTheme)
    setBionicReadingEnabled(p.bionic)
    setReadingGuideEnabled(p.ruler)
  }

  return (
    <section aria-label="Kontrol Ruang Baca Adaptif" className="space-y-5">
      {!compact && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-text-primary">Ruang Baca Adaptif</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Sesuaikan tipografi, tema kontras, fiksasi kata Bionic, dan penggaris fokus.
            </p>
          </div>
          <button
            type="button"
            onClick={() => applyPreset(presets[0].apply)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-surface-muted hover:text-text-primary cursor-pointer"
          >
            <ArrowCounterClockwise size={14} />
            Reset ke Standar
          </button>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
          Preset Cepat Satu Klik
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {presets.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset.apply)}
              className="flex flex-col items-start rounded-xl border border-border bg-surface-elevated px-3.5 py-2.5 text-left transition-all hover:border-primary-500 hover:bg-primary-50/40 cursor-pointer"
            >
              <span className="text-xs font-bold text-text-primary">{preset.name}</span>
              <span className="mt-0.5 text-[11px] text-text-secondary">{preset.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="reader-font-size" className="flex items-center justify-between gap-2 text-sm font-medium text-text-primary">
            Ukuran teks
            <output htmlFor="reader-font-size" className="font-mono text-xs font-semibold text-primary-700">{fontSize} px</output>
          </label>
          <input
            id="reader-font-size"
            type="range"
            min="16"
            max="28"
            step="1"
            value={fontSize}
            onChange={(event) => setFontSize(Number(event.target.value))}
            className="mt-2 min-h-11 w-full cursor-pointer accent-primary-600"
          />
          <div className="flex justify-between text-xs text-text-muted" aria-hidden="true">
            <span>16 px</span>
            <span>28 px</span>
          </div>
        </div>

        <div>
          <label htmlFor="reader-line-height" className="flex items-center justify-between gap-2 text-sm font-medium text-text-primary">
            Jarak baris
            <output htmlFor="reader-line-height" className="font-mono text-xs font-semibold text-primary-700">{lineHeight.toFixed(2)}×</output>
          </label>
          <input
            id="reader-line-height"
            type="range"
            min="1.3"
            max="2.1"
            step="0.05"
            value={lineHeight}
            onChange={(event) => setLineHeight(Number(event.target.value))}
            className="mt-2 min-h-11 w-full cursor-pointer accent-primary-600"
          />
          <div className="flex justify-between text-xs text-text-muted" aria-hidden="true">
            <span>Rapat</span>
            <span>Renggang</span>
          </div>
        </div>

        <div>
          <label htmlFor="reader-letter-spacing" className="flex items-center justify-between gap-2 text-sm font-medium text-text-primary">
            Jarak huruf
            <output htmlFor="reader-letter-spacing" className="font-mono text-xs font-semibold text-primary-700">
              {letterSpacing === 0 ? 'Normal' : `${Math.round(letterSpacing * 100)}%`}
            </output>
          </label>
          <input
            id="reader-letter-spacing"
            type="range"
            min="0"
            max="0.12"
            step="0.01"
            value={letterSpacing}
            onChange={(event) => setLetterSpacing(Number(event.target.value))}
            className="mt-2 min-h-11 w-full cursor-pointer accent-primary-600"
          />
          <div className="flex justify-between text-xs text-text-muted" aria-hidden="true">
            <span>Normal</span>
            <span>Lebar</span>
          </div>
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-text-primary">Tema halaman</legend>
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-4" role="group" aria-label="Pilih tema halaman">
          {themes.map((theme) => {
            const active = pageTheme === theme.id
            return (
              <button
                key={theme.id}
                type="button"
                aria-pressed={active}
                onClick={() => setPageTheme(theme.id)}
                className={cn(
                  'flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs sm:text-sm font-semibold transition-colors min-w-[44px] cursor-pointer',
                  active
                    ? 'border-primary-600 bg-primary-50 text-primary-800 ring-1 ring-primary-600'
                    : 'border-border bg-surface text-text-secondary hover:border-primary-400'
                )}
              >
                <span className={cn('h-4 w-4 rounded-full border border-border-strong shrink-0', theme.swatch)} aria-hidden="true" />
                <span className="truncate">{theme.label}</span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2 pt-1">
        <button
          type="button"
          aria-pressed={bionicReadingEnabled}
          onClick={() => setBionicReadingEnabled(!bionicReadingEnabled)}
          className={cn(
            'flex items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-all cursor-pointer',
            bionicReadingEnabled
              ? 'border-primary-600 bg-primary-50/80 ring-1 ring-primary-600'
              : 'border-border bg-surface hover:border-primary-400'
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', bionicReadingEnabled ? 'bg-primary-600 text-white' : 'bg-surface-muted text-text-secondary')}>
              <Sparkle size={18} weight={bionicReadingEnabled ? 'fill' : 'regular'} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary">Bionic Reading</p>
              <p className="text-xs text-text-secondary truncate">Tebalkan suku kata awal untuk pemindaian mata</p>
            </div>
          </div>
          <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-bold', bionicReadingEnabled ? 'bg-primary-700 text-white' : 'bg-surface-muted text-text-muted')}>
            {bionicReadingEnabled ? 'Aktif' : 'Mati'}
          </span>
        </button>

        <button
          type="button"
          aria-pressed={readingGuideEnabled}
          onClick={() => setReadingGuideEnabled(!readingGuideEnabled)}
          className={cn(
            'flex items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-all cursor-pointer',
            readingGuideEnabled
              ? 'border-primary-600 bg-primary-50/80 ring-1 ring-primary-600'
              : 'border-border bg-surface hover:border-primary-400'
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', readingGuideEnabled ? 'bg-primary-600 text-white' : 'bg-surface-muted text-text-secondary')}>
              <SlidersHorizontal size={18} weight={readingGuideEnabled ? 'bold' : 'regular'} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary">Penggaris Fokus Baca</p>
              <p className="text-xs text-text-secondary truncate">Pita sorot horizontal mengikuti kursor/sentuhan</p>
            </div>
          </div>
          <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-bold', readingGuideEnabled ? 'bg-primary-700 text-white' : 'bg-surface-muted text-text-muted')}>
            {readingGuideEnabled ? 'Aktif' : 'Mati'}
          </span>
        </button>
      </div>
    </section>
  )
}