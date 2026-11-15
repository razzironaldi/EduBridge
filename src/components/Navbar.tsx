import { Link, useLocation } from 'react-router-dom'
import {
  House,
  Compass,
  BookmarkSimple,
  ChartBar,
  User,
  GearSix,
  List,
  X,
  MagnifyingGlass,
  Sparkle,
} from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { cn } from '../lib/cn'
import { useStore } from '../store'
import { getModeSummary } from '../data/modes'
import { CommandPalette } from './CommandPalette'

const nav = [
  { to: '/dashboard', label: 'Beranda', icon: House },
  { to: '/materials', label: 'Materi', icon: Compass },
  { to: '/bookmarks', label: 'Bookmark', icon: BookmarkSimple },
  { to: '/progress', label: 'Progres', icon: ChartBar },
  { to: '/settings', label: 'Pengaturan', icon: GearSix },
  { to: '/profile', label: 'Profil', icon: User },
]

export function Navbar() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { learningModes, pageTheme, bionicReadingEnabled, setBionicReadingEnabled } = useStore()
  const preferenceSummary = getModeSummary(learningModes, pageTheme)

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <>
      <nav
        className="sticky top-0 z-40 border-b border-border/80 bg-surface/85 backdrop-blur-xl"
        aria-label="Navigasi utama"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5" aria-label="EduBridge Beranda">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-700 text-white font-extrabold text-sm shadow-soft">
              EB
            </div>
            <span className="font-extrabold text-lg text-text-primary tracking-tight hidden sm:inline">
              EduBridge
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1 rounded-full border border-border bg-surface-elevated/80 p-1">
            {nav.map((n) => {
              const active = pathname === n.to || pathname.startsWith(n.to + '/')
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
                    active
                      ? 'bg-primary-700 text-white shadow-soft'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted'
                  )}
                >
                  <n.icon size={16} weight={active ? 'bold' : 'regular'} />
                  {n.label}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border-strong bg-surface-elevated px-3.5 text-xs font-medium text-text-secondary hover:border-primary-500 hover:text-text-primary transition-colors cursor-pointer"
              aria-label="Buka pencarian cepat dan komando aksesibilitas (Ctrl+K)"
            >
              <MagnifyingGlass size={15} weight="bold" aria-hidden="true" className="text-primary-700" />
              <span className="hidden sm:inline">Cari & Komando</span>
              <kbd className="hidden lg:inline-block rounded bg-surface px-1.5 py-0.5 font-mono text-[10px] font-bold text-text-muted border border-border">
                Ctrl K
              </kbd>
            </button>

            <button
              type="button"
              onClick={() => setBionicReadingEnabled(!bionicReadingEnabled)}
              aria-pressed={bionicReadingEnabled}
              title="Aktifkan/Matikan Bionic Reading (Penebalan Suku Kata Awal)"
              className={cn(
                'hidden sm:inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-colors cursor-pointer',
                bionicReadingEnabled
                  ? 'border-primary-600 bg-primary-50 text-primary-800'
                  : 'border-border bg-surface text-text-secondary hover:bg-surface-muted'
              )}
            >
              <Sparkle size={14} weight={bionicReadingEnabled ? 'fill' : 'regular'} aria-hidden="true" className="text-primary-600" />
              <span>Bionic</span>
            </button>

            <span
              className="hidden max-w-40 truncate rounded-full bg-surface-muted px-3 py-1.5 text-xs font-medium text-text-secondary xl:inline-flex"
              aria-label={`Preferensi aktif: ${preferenceSummary}`}
              title={`Preferensi aktif: ${preferenceSummary}`}
            >
              {preferenceSummary}
            </span>
            <button
              className="md:hidden flex h-11 w-11 items-center justify-center rounded-lg hover:bg-surface-muted transition-colors cursor-pointer"
              onClick={() => setOpen(!open)}
              aria-label={open ? 'Tutup menu' : 'Buka menu'}
              aria-expanded={open}
            >
              {open ? <X size={22} /> : <List size={22} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden border-t border-border bg-surface px-4 py-3 space-y-1">
            {nav.map((n) => {
              const active = pathname === n.to
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-text-secondary hover:bg-surface-muted'
                  )}
                >
                  <n.icon size={18} weight={active ? 'bold' : 'regular'} />
                  {n.label}
                </Link>
              )
            })}
          </div>
        )}
      </nav>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/90 backdrop-blur-lg md:hidden"
        role="navigation"
        aria-label="Navigasi mobile"
      >
        <div className="flex justify-around py-2">
          {nav.slice(0, 4).map((n) => {
            const active = pathname === n.to || pathname.startsWith(n.to + '/')
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-2 text-[11px] font-medium transition-colors min-h-[44px] min-w-[44px]',
                  active ? 'text-primary-600' : 'text-text-muted'
                )}
              >
                <n.icon size={22} weight={active ? 'bold' : 'regular'} />
                {n.label}
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
