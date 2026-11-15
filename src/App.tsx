import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, Suspense, lazy } from 'react'
import { useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { StudyCompanion } from './components/StudyCompanion'
import { useStore } from './store'

const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })))
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const MaterialsListPage = lazy(() => import('./pages/MaterialsListPage').then(m => ({ default: m.MaterialsListPage })))
const MaterialDetailPage = lazy(() => import('./pages/MaterialDetailPage').then(m => ({ default: m.MaterialDetailPage })))
const ProgressPage = lazy(() => import('./pages/ProgressPage').then(m => ({ default: m.ProgressPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const BookmarksPage = lazy(() => import('./pages/BookmarksPage').then(m => ({ default: m.BookmarksPage })))

function LoadingFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-600 border-t-transparent" aria-label="Memuat halaman..." />
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return null
}

function ScrollRevealObserver() {
  const { pathname } = useLocation()

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    function observeTargets() {
      const targets = document.querySelectorAll<HTMLElement>(
        '[data-scroll-reveal]:not(.is-revealed), [data-reveal-item]:not(.is-revealed)'
      )

      if (reducedMotion || !('IntersectionObserver' in window)) {
        targets.forEach((target) => target.classList.add('is-revealed'))
        return undefined
      }

      if (targets.length === 0) return undefined

      // Auto-stagger sibling items inside each parent container
      const parentCounters = new WeakMap<Element, number>()
      targets.forEach((el) => {
        if (el.hasAttribute('data-reveal-item') && !el.style.getPropertyValue('--stagger-idx')) {
          const parent = el.parentElement || document.body
          const idx = parentCounters.get(parent) ?? 0
          el.style.setProperty('--stagger-idx', String(idx))
          parentCounters.set(parent, idx + 1)
        }
      })

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return
            entry.target.classList.add('is-revealed')
            observer.unobserve(entry.target)
          })
        },
        { threshold: 0.08, rootMargin: '0px 0px -4% 0px' }
      )

      targets.forEach((target) => observer.observe(target))
      return observer
    }

    let observer: IntersectionObserver | undefined
    const scheduleRevealCheck = () => {
      if (typeof window === 'undefined') return

      window.requestAnimationFrame(() => {
        observer?.disconnect()
        observer = observeTargets()
      })
    }

    scheduleRevealCheck()

    const mutationObserver = new MutationObserver(() => {
      const unrevealed = document.querySelectorAll<HTMLElement>(
        '[data-scroll-reveal]:not(.is-revealed), [data-reveal-item]:not(.is-revealed)'
      )
      if (unrevealed.length > 0) {
        scheduleRevealCheck()
      }
    })
    mutationObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer?.disconnect()
      mutationObserver.disconnect()
    }
  }, [pathname])

  return null
}

function RouteContent() {
  const { pathname } = useLocation()

  return (
    <div key={pathname} className="route-transition">
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/materials" element={<MaterialsListPage />} />
            <Route path="/materials/:id" element={<MaterialDetailPage />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default function App() {
  const isQuizActive = useStore((state) => state.isQuizActive)

  const routerBasename = (() => {
    if (typeof window === 'undefined') return import.meta.env.BASE_URL || '/'
    const firstSegment = window.location.pathname.split('/')[1]
    if (firstSegment && /^(edubridge|teman)/i.test(firstSegment)) {
      return `/${firstSegment}`
    }
    return import.meta.env.BASE_URL || '/'
  })()

  return (
    <BrowserRouter basename={routerBasename}>
      <ScrollToTop />
      <ScrollRevealObserver />
      <RouteContent />
      <StudyCompanion key={isQuizActive ? 'quiz-active' : 'quiz-inactive'} />
    </BrowserRouter>
  )
}
