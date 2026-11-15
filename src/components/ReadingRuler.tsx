import { useEffect, useRef } from 'react'
import { useStore } from '../store'

export function ReadingRuler() {
  const readingGuideEnabled = useStore((s) => s.readingGuideEnabled)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!readingGuideEnabled) return

    const updateY = (clientY: number) => {
      if (!barRef.current) return
      barRef.current.style.transform = `translate3d(0, ${Math.max(40, clientY - 26)}px, 0)`
    }

    const handlePointerMove = (e: PointerEvent) => {
      updateY(e.clientY)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) updateY(e.touches[0].clientY)
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [readingGuideEnabled])

  if (!readingGuideEnabled) return null

  return (
    <div
      ref={barRef}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 right-0 z-30 h-13 border-y-2 border-primary-500/75 bg-accent-200/20 shadow-[0_0_0_9999px_rgba(15,23,42,0.18)] transition-transform duration-75 ease-out"
      style={{ transform: 'translate3d(0, 220px, 0)' }}
    />
  )
}
