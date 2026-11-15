import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MagnifyingGlass,
  BookOpen,
  SlidersHorizontal,
  SpeakerHigh,
  Target,
  ListChecks,
  Sun,
  Moon,
  CircleHalf,
  ArrowRight,
  House,
  ChartBar,
  BookmarkSimple,
  GearSix,
  Sparkle,
  X,
} from '@phosphor-icons/react'
import { materials } from '../data/materials'
import { useStore } from '../store'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

interface CommandItem {
  id: string
  category: 'Aksi Aksesibilitas' | 'Navigasi Cepat' | 'Materi Pembelajaran'
  label: string
  sublabel: string
  icon: React.ComponentType<{ size?: number; weight?: 'regular' | 'bold' | 'fill' }>
  action: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const {
    learningModes,
    toggleLearningMode,
    pageTheme,
    setPageTheme,
    readingGuideEnabled,
    setReadingGuideEnabled,
    bionicReadingEnabled,
    setBionicReadingEnabled,
  } = useStore()

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => {
      setQuery('')
      setSelectedIndex(0)
      inputRef.current?.focus()
    }, 10)
    return () => window.clearTimeout(timer)
  }, [open])

  const items = useMemo<CommandItem[]>(() => {
    const go = (to: string) => {
      navigate(to)
      onClose()
    }

    const actions: CommandItem[] = [
      {
        id: 'toggle-bionic',
        category: 'Aksi Aksesibilitas',
        label: bionicReadingEnabled ? 'Matikan Bionic Reading (Fiksasi Kata)' : 'Aktifkan Bionic Reading (Fiksasi Kata)',
        sublabel: 'Tebalkan awal kata untuk memandu mata saat membaca cepat',
        icon: Sparkle,
        action: () => {
          setBionicReadingEnabled(!bionicReadingEnabled)
          onClose()
        },
      },
      {
        id: 'toggle-guide',
        category: 'Aksi Aksesibilitas',
        label: readingGuideEnabled ? 'Matikan Penggaris Fokus Baca' : 'Aktifkan Penggaris Fokus Baca',
        sublabel: 'Pita bantu horizontal mengikuti baris bacaan',
        icon: SlidersHorizontal,
        action: () => {
          setReadingGuideEnabled(!readingGuideEnabled)
          onClose()
        },
      },
      {
        id: 'toggle-focus',
        category: 'Aksi Aksesibilitas',
        label: learningModes.includes('focus') ? 'Matikan Mode Fokus' : 'Aktifkan Mode Fokus',
        sublabel: 'Sembunyikan elemen sekunder agar konsentrasi penuh',
        icon: Target,
        action: () => {
          toggleLearningMode('focus')
          onClose()
        },
      },
      {
        id: 'toggle-simple',
        category: 'Aksi Aksesibilitas',
        label: learningModes.includes('simple') ? 'Matikan Mode Sederhana' : 'Aktifkan Mode Sederhana',
        sublabel: 'Tampilkan ringkasan cepat dan poin utama terlebih dahulu',
        icon: ListChecks,
        action: () => {
          toggleLearningMode('simple')
          onClose()
        },
      },
      {
        id: 'toggle-audio',
        category: 'Aksi Aksesibilitas',
        label: learningModes.includes('audio') ? 'Matikan Mode Audio Reader' : 'Aktifkan Mode Audio Reader',
        sublabel: 'Nyalakan pembaca suara Bahasa Indonesia otomatis di materi',
        icon: SpeakerHigh,
        action: () => {
          toggleLearningMode('audio')
          onClose()
        },
      },
      {
        id: 'theme-dark',
        category: 'Aksi Aksesibilitas',
        label: pageTheme === 'dark' ? 'Gunakan Tema Terang' : 'Gunakan Tema Gelap (OLED Nyaman)',
        sublabel: 'Kurangi paparan cahaya layar di ruangan redup',
        icon: pageTheme === 'dark' ? Sun : Moon,
        action: () => {
          setPageTheme(pageTheme === 'dark' ? 'light' : 'dark')
          onClose()
        },
      },
      {
        id: 'theme-contrast',
        category: 'Aksi Aksesibilitas',
        label: pageTheme === 'high-contrast' ? 'Matikan Kontras Tinggi' : 'Aktifkan Tema Kontras Tinggi (WCAG AAA)',
        sublabel: 'Garis tegas dan kontras maksimum untuk kejelasan visual',
        icon: CircleHalf,
        action: () => {
          setPageTheme(pageTheme === 'high-contrast' ? 'light' : 'high-contrast')
          onClose()
        },
      },
      {
        id: 'nav-dashboard',
        category: 'Navigasi Cepat',
        label: 'Buka Dashboard Belajar',
        sublabel: 'Ringkasan progres, jadwal pengulangan kuis, dan rekomendasi',
        icon: House,
        action: () => go('/dashboard'),
      },
      {
        id: 'nav-materials',
        category: 'Navigasi Cepat',
        label: 'Jelajahi Katalog Materi Inklusif',
        sublabel: '8 kategori, 17 tema, dan 52 subtema pembelajaran',
        icon: BookOpen,
        action: () => go('/materials'),
      },
      {
        id: 'nav-bookmarks',
        category: 'Navigasi Cepat',
        label: 'Buka Pusat Bookmark & Riwayat',
        sublabel: 'Daftar subtema yang disimpan dan terakhir diakses',
        icon: BookmarkSimple,
        action: () => go('/bookmarks'),
      },
      {
        id: 'nav-progress',
        category: 'Navigasi Cepat',
        label: 'Lihat Analitik Progres & Sertifikat',
        sublabel: 'Pantau penguasaan materi dan unduh ringkasan capaian',
        icon: ChartBar,
        action: () => go('/progress'),
      },
      {
        id: 'nav-settings',
        category: 'Navigasi Cepat',
        label: 'Buka Pengaturan & Ruang Baca',
        sublabel: 'Sesuaikan font, spasi baris, jarak huruf, dan animasi',
        icon: GearSix,
        action: () => go('/settings'),
      },
      ...materials.map((m) => ({
        id: `mat-${m.id}`,
        category: 'Materi Pembelajaran' as const,
        label: m.title,
        sublabel: `${m.category} · ${m.sections.length} subtema · ${m.totalDuration} menit`,
        icon: BookOpen,
        action: () => go(`/materials/${m.id}`),
      })),
    ]

    const q = query.trim().toLocaleLowerCase('id-ID')
    if (!q) return actions.slice(0, 12)
    return actions.filter((item) =>
      `${item.label} ${item.sublabel} ${item.category}`.toLocaleLowerCase('id-ID').includes(q)
    )
  }, [
    bionicReadingEnabled,
    learningModes,
    navigate,
    onClose,
    pageTheme,
    query,
    readingGuideEnabled,
    setBionicReadingEnabled,
    setPageTheme,
    setReadingGuideEnabled,
    toggleLearningMode,
  ])

  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSelectedIndex((prev) => (items.length > 0 ? (prev + 1) % items.length : 0))
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSelectedIndex((prev) => (items.length > 0 ? (prev - 1 + items.length) % items.length : 0))
      } else if (event.key === 'Enter' && items[selectedIndex]) {
        event.preventDefault()
        items[selectedIndex].action()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [items, onClose, open, selectedIndex])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/55 px-4 pt-16 pb-6 backdrop-blur-sm sm:pt-24"
      role="dialog"
      aria-modal="true"
      aria-label="Pusat Komando Aksesibilitas dan Pencarian Cepat"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="double-bezel w-full max-w-2xl overflow-hidden shadow-elevated">
        <div className="double-bezel-inner flex max-h-[75dvh] flex-col overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
            <MagnifyingGlass size={20} weight="bold" className="text-primary-600 shrink-0" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setSelectedIndex(0)
              }}
              placeholder="Cari materi, aktifkan Bionic Reading, ubah tema, atau loncat halaman..."
              className="w-full bg-transparent text-sm font-medium text-text-primary placeholder:text-text-muted focus:outline-none"
              aria-label="Ketik perintah atau judul materi"
            />
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-xs font-semibold text-text-muted hover:bg-surface-muted hover:text-text-primary cursor-pointer"
              aria-label="Tutup pusat komando"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-1" role="listbox">
            {items.length > 0 ? (
              items.map((item, idx) => {
                const active = idx === selectedIndex
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={item.action}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-primary-50 text-primary-900 ring-1 ring-primary-500/40'
                        : 'text-text-primary hover:bg-surface-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          active
                            ? 'bg-primary-600 text-white'
                            : 'bg-surface-muted text-text-secondary'
                        }`}
                      >
                        <Icon size={18} weight={active ? 'bold' : 'regular'} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-text-primary">
                            {item.label}
                          </p>
                          <span className="hidden sm:inline-block rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold text-text-muted">
                            {item.category}
                          </span>
                        </div>
                        <p className="truncate text-xs text-text-secondary mt-0.5">
                          {item.sublabel}
                        </p>
                      </div>
                    </div>
                    <ArrowRight
                      size={16}
                      className={`shrink-0 transition-transform ${
                        active ? 'translate-x-0.5 text-primary-700' : 'text-text-muted'
                      }`}
                    />
                  </button>
                )
              })
            ) : (
              <div className="py-10 text-center">
                <p className="text-sm font-semibold text-text-primary">Perintah atau materi tidak ditemukan</p>
                <p className="mt-1 text-xs text-text-secondary">
                  Coba ketik &ldquo;Bionic&rdquo;, &ldquo;Audio&rdquo;, &ldquo;UDL&rdquo;, atau &ldquo;Kontras&rdquo;.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-surface-elevated px-4 py-2.5 text-[11px] text-text-muted">
            <div className="flex items-center gap-3">
              <span><strong className="font-mono text-text-secondary">↑↓</strong> Navigasi</span>
              <span><strong className="font-mono text-text-secondary">Enter</strong> Jalankan</span>
              <span><strong className="font-mono text-text-secondary">Esc</strong> Tutup</span>
            </div>
            <span className="font-medium text-primary-700">Pintasan Global: Ctrl + K</span>
          </div>
        </div>
      </div>
    </div>
  )
}
