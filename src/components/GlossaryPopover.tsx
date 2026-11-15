import { useEffect, useRef, useState } from 'react'
import { SpeakerHigh, Sparkle, Stop, X, NotePencil, CheckCircle } from '@phosphor-icons/react'
import type { GlossaryTerm } from '../data/materials'
import { useStore } from '../store'

interface GlossaryPopoverProps {
  term: GlossaryTerm | null
  onClose: () => void
}

export function GlossaryPopover({ term, onClose }: GlossaryPopoverProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [speaking, setSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedNote, setCopiedNote] = useState(false)
  const { lessonNotes, setLessonNote } = useStore()

  const speechSupported =
    typeof window !== 'undefined' &&
    typeof window.speechSynthesis !== 'undefined' &&
    typeof SpeechSynthesisUtterance !== 'undefined'

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (term && !dialog.open) {
      if (typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined') {
        window.speechSynthesis.cancel()
      }
      dialog.showModal()
    }
    if (!term && dialog.open) dialog.close()
  }, [term])

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined') {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const closeDialog = () => {
    if (dialogRef.current?.open) dialogRef.current.close()
    else onClose()
  }

  const stopPronunciation = () => {
    if (typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined') {
      window.speechSynthesis.cancel()
    }
    setSpeaking(false)
    setError(null)
  }

  const handleDialogClose = () => {
    if (typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined') {
      window.speechSynthesis.cancel()
    }
    setSpeaking(false)
    setError(null)
    setCopiedNote(false)
    onClose()
  }

  const speakTerm = () => {
    if (!term || !speechSupported) {
      setError('Pengucapan audio tidak tersedia di browser ini.')
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(term.term)
    utterance.lang = 'id-ID'
    utterance.rate = 0.95
    utterance.onend = () => {
      setSpeaking(false)
      setError(null)
    }
    utterance.onerror = (event) => {
      setSpeaking(false)
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        setError('Istilah tidak dapat dibacakan. Coba lagi atau baca definisinya.')
      }
    }

    try {
      window.speechSynthesis.speak(utterance)
      setSpeaking(true)
      setError(null)
    } catch {
      setSpeaking(false)
      setError('Istilah tidak dapat dibacakan. Coba lagi atau baca definisinya.')
    }
  }

  const handleAskAksa = () => {
    if (!term) return
    const prompt = `Bedah lebih dalam istilah "${term.term}" (${term.definition}) dengan analogi sederhana dan contoh penerapannya dalam kehidupan nyata.`
    closeDialog()
    window.dispatchEvent(
      new CustomEvent('temanakses:ask-aksa', {
        detail: { prompt, persona: 'eli5' },
      })
    )
  }

  const handleSaveToNote = () => {
    if (!term) return
    // Ambil section ID aktif dari URL jika tersedia
    const urlParams = new URLSearchParams(window.location.search)
    const activeSecId = urlParams.get('section') ?? 'catatan-umum'
    const existing = lessonNotes[activeSecId] ?? ''
    const entry = `[Glosarium: ${term.term}]\n${term.definition}\nContoh: ${term.example}`
    const updated = existing ? `${existing}\n\n${entry}` : entry
    setLessonNote(activeSecId, updated)
    setCopiedNote(true)
    setTimeout(() => setCopiedNote(false), 2000)
  }

  return (
    <dialog
      ref={dialogRef}
      className="glossary-dialog fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-auto rounded-3xl border border-border bg-surface p-0 text-text-primary shadow-2xl backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm"
      aria-labelledby="glossary-term-title"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          closeDialog()
        }
      }}
      onClose={handleDialogClose}
      onCancel={(event) => {
        event.preventDefault()
        closeDialog()
      }}
    >
      {term && (
        <div className="p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-primary-800 border border-primary-200">
                <Sparkle size={12} weight="fill" className="text-primary-600" />
                Glosarium Istilah Inklusif
              </span>
              <h2 id="glossary-term-title" className="mt-2 text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                {term.term}
              </h2>
            </div>
            <button
              type="button"
              onClick={closeDialog}
              className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary hover:bg-surface-muted transition-colors cursor-pointer"
              aria-label="Tutup definisi"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-4 space-y-3.5">
            <div className="rounded-2xl bg-surface-elevated border border-border p-4">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Definisi Inti</p>
              <p className="text-sm leading-relaxed text-text-primary font-medium">{term.definition}</p>
            </div>

            <div className="rounded-2xl bg-primary-50/50 border border-primary-100 p-4">
              <p className="text-xs font-semibold text-primary-800 uppercase tracking-wider mb-1">Contoh Nyata / Penerapan</p>
              <p className="text-xs sm:text-sm leading-relaxed text-text-secondary">{term.example}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2.5 border-t border-border pt-5">
            {/* Tombol Bedah Lebih Dalam dengan Aksa AI */}
            <button
              type="button"
              onClick={handleAskAksa}
              className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-primary-800 spring-transition cursor-pointer shadow-md"
            >
              <Sparkle size={16} weight="fill" className="text-amber-300" />
              <span>Bedah Lebih Dalam dengan Aksa AI</span>
            </button>

            {/* Tombol Dengarkan Lafal (id-ID) */}
            <button
              type="button"
              onClick={speaking ? stopPronunciation : speakTerm}
              disabled={!speechSupported && !error}
              className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface px-4 py-2 text-xs sm:text-sm font-semibold text-text-primary hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {speaking ? <Stop size={16} weight="fill" className="text-rose-600" /> : <SpeakerHigh size={16} weight="fill" className="text-primary-600" />}
              <span>{speaking ? 'Berhenti' : 'Dengarkan Lafal (id-ID)'}</span>
            </button>

            {/* Tombol Simpan ke Catatan */}
            <button
              type="button"
              onClick={handleSaveToNote}
              title="Salin definisi ke catatan refleksi subtema ini"
              className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-elevated cursor-pointer"
            >
              {copiedNote ? (
                <>
                  <CheckCircle size={15} weight="fill" className="text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Tersimpan</span>
                </>
              ) : (
                <>
                  <NotePencil size={15} weight="bold" />
                  <span>Catat</span>
                </>
              )}
            </button>

            {error && (
              <span className="w-full text-xs text-rose-600 font-medium" role="alert">
                {error}
              </span>
            )}
          </div>
        </div>
      )}
    </dialog>
  )
}
