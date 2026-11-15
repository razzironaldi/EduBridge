import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  ArrowsInSimple,
  ArrowsOutSimple,
  BookOpen,
  ChatCircleDots,
  CheckCircle,
  Eye,
  GraduationCap,
  Lightning,
  Microphone,
  MicrophoneSlash,
  NotePencil,
  PaperPlaneTilt,
  SlidersHorizontal,
  Sparkle,
  SpeakerHigh,
  Stop,
  Trash,
  X,
} from '@phosphor-icons/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { learningCategories, materials, type Material } from '../data/materials'
import { useStore, type ReadingTheme } from '../store'

/* VisualViewport hook untuk handle virtual keyboard di mobile */
function useVisualViewport() {
  const [viewport, setViewport] = useState({ height: 0, offsetTop: 0 })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return
    const vp = window.visualViewport
    const update = () =>
      setViewport({
        height: vp.height,
        offsetTop: vp.offsetTop,
      })
    update()
    vp.addEventListener('resize', update)
    vp.addEventListener('scroll', update)
    return () => {
      vp.removeEventListener('resize', update)
      vp.removeEventListener('scroll', update)
    }
  }, [])

  return viewport
}

type TutorPersona = 'eli5' | 'socratic' | 'flashcard' | 'step'
type WorkspaceTab = 'chat' | 'quiz' | 'controls'

interface Citation {
  title: string
  route: string
  category?: string
}

interface SocraticChallenge {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  hint: string
}

interface Message {
  id: string
  role: 'companion' | 'learner'
  heading?: string
  summary: string
  bullets?: string[]
  analogy?: string
  persona?: TutorPersona
  actionBadge?: string
  citations?: Citation[]
  challenge?: SocraticChallenge
  selectedOption?: number
  canSaveToNote?: boolean
  savedToNote?: boolean
}

const PERSONA_CONFIG: Record<
  TutorPersona,
  { label: string; short: string; desc: string; promptPrefix: string }
> = {
  eli5: {
    label: 'Analogi Sederhana',
    short: 'Analogi',
    desc: 'Bahasa sehari-hari & perumpamaan konkret',
    promptPrefix:
      '[Mode Pedagogi: Analogi Sederhana / ELI5. Jelaskan singkat maksimal 3 kalimat dengan perumpamaan sehari-hari.]',
  },
  flashcard: {
    label: 'Poin Inti Cepat',
    short: '3 Poin Inti',
    desc: '3 butir kunci padat untuk pemindaian cepat',
    promptPrefix:
      '[Mode Pedagogi: Flashcard Poin Inti. Rangkum menjadi tepat 3 poin kunci paling esensial.]',
  },
  step: {
    label: 'Langkah Praktis',
    short: 'Langkah 1-2-3',
    desc: 'Urutan kerja sistematis yang langsung bisa dipraktikkan',
    promptPrefix:
      '[Mode Pedagogi: Langkah Praktis. Susun jawaban menjadi langkah berurutan 1, 2, 3 yang ringkas.]',
  },
  socratic: {
    label: 'Uji Pemahaman',
    short: 'Uji Kuis',
    desc: 'Penjelasan ringkas disertai tantangan soal mikro',
    promptPrefix:
      '[Mode Pedagogi: Socratic Tutor. Berikan penjelasan singkat lalu ajukan 1 pertanyaan logika.]',
  },
}

const openingMessage: Message = {
  id: 'opening-1',
  role: 'companion',
  heading: 'Halo! Aku Aksa, AI Copilot EduBridge ditenagai Gemini.',
  summary:
    'Aku siap membantumu dengan wawasan luas setara Gemini: mulai dari modul inklusif EduBridge, sains, coding, pemecahan masalah, hingga diskusi bebas.',
  bullets: [
    'Tanya apa saja: materi sekolah/kuliah, pemrograman, sains, tips belajar, atau diskusi bebas',
    'Dikte suara Bahasa Indonesia (id-ID) dengan tombol mikrofon',
    'Simpan rangkuman dan jawaban penting langsung ke Catatan Belajar',
  ],
}

const stopWords = new Set([
  'apa',
  'apakah',
  'aku',
  'bagaimana',
  'boleh',
  'dan',
  'dari',
  'di',
  'dong',
  'itu',
  'jelaskan',
  'kenapa',
  'mana',
  'materi',
  'maksud',
  'mengapa',
  'yang',
  'untuk',
  'pada',
  'dengan',
  'ini',
  'tolong',
  'tentang',
  'cara',
  'saya',
  'ya',
  'adalah',
  'arti',
  'buatkan',
  'coba',
  'kasih',
  'berikan',
])

function normalize(text: string) {
  return text
    .toLocaleLowerCase('id-ID')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
}

function getKeywords(text: string) {
  return normalize(text)
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))
}

interface ScoredSection {
  material: Material
  categoryTitle: string
  section: Material['sections'][number]
  score: number
}

function rankSections(question: string): ScoredSection[] {
  const keywords = getKeywords(question)
  if (keywords.length === 0) return []

  const results: ScoredSection[] = []

  for (const material of materials) {
    const category = learningCategories.find((c) => c.id === material.categoryId)
    for (const section of material.sections) {
      const titleNorm = normalize(`${material.title} ${section.title}`)
      const summaryNorm = normalize(`${material.description} ${section.simpleSummary}`)
      const bodyNorm = normalize([...section.keyPoints, ...section.paragraphs].join(' '))

      let score = 0
      for (const kw of keywords) {
        if (titleNorm.includes(kw)) score += 3.2
        if (summaryNorm.includes(kw)) score += 2.0
        if (bodyNorm.includes(kw)) score += 1.1
      }

      if (score > 0) {
        results.push({
          material,
          categoryTitle: category?.title ?? material.category,
          section,
          score,
        })
      }
    }
  }

  return results.sort((a, b) => b.score - a.score)
}

function createCatalogContext(question: string) {
  const topMatches = rankSections(question).slice(0, 3)

  if (topMatches.length === 0) {
    return learningCategories
      .map((category) => {
        const themes = materials.filter((material) => material.categoryId === category.id)
        return `${category.title}: ${themes.map((theme) => theme.title).join(', ')}`
      })
      .join('\n')
  }

  return JSON.stringify(
    topMatches.map(({ categoryTitle, material, section }) => ({
      category: categoryTitle,
      theme: material.title,
      subtopic: section.title,
      summary: section.simpleSummary,
      details: section.paragraphs,
      keyPoints: section.keyPoints,
    }))
  )
}

function buildStructuredResponse(
  persona: TutorPersona,
  title: string,
  summary: string,
  keyPoints: string[],
  customAnalogy?: string
): Pick<Message, 'heading' | 'summary' | 'bullets' | 'analogy'> {
  if (persona === 'flashcard') {
    return {
      heading: title,
      summary,
      bullets: keyPoints.slice(0, 3),
    }
  }

  if (persona === 'step') {
    return {
      heading: `Langkah Praktis · ${title}`,
      summary: `Ikuti urutan sistematis berikut untuk menerapkan konsep ini:`,
      bullets: [
        `Pahami inti: ${summary}`,
        ...keyPoints.slice(0, 2).map((pt) => `Terapkan: ${pt}`),
      ],
    }
  }

  if (persona === 'socratic') {
    return {
      heading: `Uji Logika · ${title}`,
      summary,
      bullets: keyPoints.slice(0, 2),
    }
  }

  return {
    heading: title,
    summary,
    analogy:
      customAnalogy ??
      `Analogi: Bayangkan konsep ini seperti menyediakan jalur landai dan penunjuk suara di gedung kampus agar setiap mahasiswa tiba di tujuan tanpa hambatan.`,
    bullets: keyPoints.slice(0, 2),
  }
}

interface AgentExecutionResult {
  handled: boolean
  heading?: string
  summary: string
  actionBadge?: string
  citations?: Citation[]
}

function renderInlineTokens(text: string) {
  const tokens = text.split(/(\*\*.*?\*\*|`.*?`)/g)
  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong key={i} className="font-bold text-text-primary">
          {token.slice(2, -2)}
        </strong>
      )
    }
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return (
        <code
          key={i}
          className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[11px] font-semibold text-primary-800 border border-border/70"
        >
          {token.slice(1, -1)}
        </code>
      )
    }
    return token
  })
}

function FormattedMessageContent({ content }: { content: string }) {
  if (!content) return null

  const parts = content.split(/(```[\s\S]*?```)/g)

  return (
    <div className="space-y-2 mt-1">
      {parts.map((part, idx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const firstLineEnd = part.indexOf('\n')
          const lang = firstLineEnd !== -1 ? part.slice(3, firstLineEnd).trim() : ''
          const code = firstLineEnd !== -1 ? part.slice(firstLineEnd + 1, -3) : part.slice(3, -3)
          return (
            <div
              key={idx}
              className="my-2 rounded-xl bg-slate-900 text-slate-100 p-3 text-[11px] sm:text-xs font-mono overflow-x-auto shadow-inner border border-slate-800"
            >
              {lang && (
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">
                  {lang}
                </div>
              )}
              <pre className="whitespace-pre">
                <code>{code}</code>
              </pre>
            </div>
          )
        }

        const paragraphs = part.split(/\n{2,}/)
        return (
          <div key={idx} className="space-y-1.5">
            {paragraphs.map((para, pIdx) => {
              const lines = para.split('\n')
              const isList = lines.length > 0 && lines.every((l) => /^[-*•]\s+/.test(l.trim()))
              if (isList) {
                return (
                  <ul key={pIdx} className="space-y-1 pl-1">
                    {lines.map((line, lIdx) => (
                      <li
                        key={lIdx}
                        className="flex items-start gap-2 text-xs sm:text-[13px] text-text-secondary leading-relaxed"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary-600 shrink-0" />
                        <span>{renderInlineTokens(line.replace(/^[-*•]\s+/, ''))}</span>
                      </li>
                    ))}
                  </ul>
                )
              }
              return (
                <p
                  key={pIdx}
                  className="text-xs sm:text-[13px] leading-relaxed text-text-secondary whitespace-pre-wrap"
                >
                  {renderInlineTokens(para)}
                </p>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

export function StudyCompanion() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()

  const isQuizActive = useStore((state) => state.isQuizActive)
  const bionicReadingEnabled = useStore((state) => state.bionicReadingEnabled)
  const setBionicReadingEnabled = useStore((state) => state.setBionicReadingEnabled)
  const readingGuideEnabled = useStore((state) => state.readingGuideEnabled)
  const setReadingGuideEnabled = useStore((state) => state.setReadingGuideEnabled)
  const pageTheme = useStore((state) => state.pageTheme)
  const setPageTheme = useStore((state) => state.setPageTheme)
  const fontSize = useStore((state) => state.fontSize)
  const setFontSize = useStore((state) => state.setFontSize)
  const learningModes = useStore((state) => state.learningModes)
  const toggleLearningMode = useStore((state) => state.toggleLearningMode)
  const lessonNotes = useStore((state) => state.lessonNotes)
  const setLessonNote = useStore((state) => state.setLessonNote)

  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('chat')
  const [persona, setPersona] = useState<TutorPersona>('eli5')
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<Message[]>([openingMessage])
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null)
  const [aiModelName, setAiModelName] = useState<string>('Gemini 3.5 AI')
  const [isSending, setIsSending] = useState(false)
  const [isListeningMic, setIsListeningMic] = useState(false)
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null)
  const [selectedQuote, setSelectedQuote] = useState<string>('')
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizPicked, setQuizPicked] = useState<number | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const messageListRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  const visualViewport = useVisualViewport()

  const activeMaterial = useMemo(() => {
    const materialId = pathname.match(/^\/materials\/([^/]+)/)?.[1]
    return materials.find((material) => material.id === materialId)
  }, [pathname])

  const activeSectionId = new URLSearchParams(search).get('section')

  // Daftar kuis untuk tab "Uji Kuis"
  const activeQuizPool = useMemo(() => {
    if (activeMaterial && activeMaterial.quiz.length > 0) {
      return activeMaterial.quiz.map((q) => ({ ...q, materialTitle: activeMaterial.title }))
    }
    return materials.slice(0, 6).flatMap((m) =>
      m.quiz.slice(0, 1).map((q) => ({ ...q, materialTitle: m.title }))
    )
  }, [activeMaterial])

  const currentTabQuiz = activeQuizPool[quizIndex % activeQuizPool.length]

  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection()?.toString().trim() ?? ''
      if (sel.length >= 12 && sel.length <= 220) {
        setSelectedQuote(sel)
      } else if (sel.length === 0) {
        setSelectedQuote('')
      }
    }
    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    if (activeTab === 'chat') inputRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, activeTab])

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/companion/status', { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((status: { configured?: boolean; model?: string }) => {
        setAiConfigured(Boolean(status.configured))
        if (status.model) {
          const cleanModel = status.model
            .replace(/^models\//, '')
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase())
          setAiModelName(cleanModel.includes('Gemini') ? cleanModel : `Gemini ${cleanModel}`)
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setAiConfigured(false)
      })
    return () => controller.abort()
  }, [isOpen])

  useEffect(() => {
    if (activeTab === 'chat') {
      messageListRef.current?.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [messages, isOpen, activeTab])

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const messageToPlainText = (msg: Message) => {
    return [msg.heading, msg.summary, ...(msg.bullets ?? []), msg.analogy]
      .filter(Boolean)
      .join('. ')
  }

  const speakMessage = useCallback(
    (msg: Message) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
      window.speechSynthesis.cancel()
      if (speakingMessageId === msg.id) {
        setSpeakingMessageId(null)
        return
      }
      const utterance = new SpeechSynthesisUtterance(messageToPlainText(msg))
      utterance.lang = 'id-ID'
      utterance.rate = 0.96
      utterance.onend = () => setSpeakingMessageId(null)
      utterance.onerror = () => setSpeakingMessageId(null)
      setSpeakingMessageId(msg.id)
      window.speechSynthesis.speak(utterance)
    },
    [speakingMessageId]
  )

  const toggleVoiceDictation = useCallback(() => {
    if (isListeningMic) {
      recognitionRef.current?.stop?.()
      setIsListeningMic(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as unknown as Record<string, any>
    const SpeechRecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SpeechRecognitionCtor) {
      setMessages((curr) => [
        ...curr,
        {
          id: `mic-unsupported-${Date.now()}`,
          role: 'companion',
          heading: 'Dikte Suara Tidak Tersedia',
          summary:
            'Browser ini belum mendukung Web Speech API. Silakan ketik pertanyaan atau gunakan tab Kontrol Cepat.',
        },
      ])
      return
    }

    const recognition = new SpeechRecognitionCtor()
    recognition.lang = 'id-ID'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event?.results?.[0]?.[0]?.transcript ?? ''
      if (transcript) {
        setDraft((prev) => (prev ? `${prev} ${transcript}` : transcript))
      }
      setIsListeningMic(false)
    }
    recognition.onerror = () => setIsListeningMic(false)
    recognition.onend = () => setIsListeningMic(false)

    recognitionRef.current = recognition
    setIsListeningMic(true)
    recognition.start()
  }, [isListeningMic])

  const executeAgenticCommand = useCallback(
    (rawQuestion: string): AgentExecutionResult => {
      const q = normalize(rawQuestion).trim()

      // Hanya jalankan perintah sistem bila memang ada kata kerja perintah eksplisit
      const hasActionVerb = /^(nyalakan|aktifkan|matikan|nonaktifkan|ubah|ganti|pakai|setel|atur|perbesar|perkecil|buka|pergi ke)\b/.test(
        q
      )
      if (!hasActionVerb) {
        return { handled: false, summary: '' }
      }

      if (/\bbionic\b|tebalkan kata|fiksasi kata/.test(q)) {
        const shouldDisable = /matikan|nonaktif|off|hapus|tutup/.test(q)
        const nextState = shouldDisable
          ? false
          : /nyalakan|aktifkan|on|pakai/.test(q)
            ? true
            : !bionicReadingEnabled
        setBionicReadingEnabled(nextState)
        return {
          handled: true,
          actionBadge: `Bionic Reading ${nextState ? 'Aktif' : 'Nonaktif'}`,
          heading: nextState ? 'Bionic Reading Diaktifkan' : 'Bionic Reading Dimatikan',
          summary: nextState
            ? 'Suku kata awal pada seluruh paragraf materi kini ditebalkan untuk membantu mata memindai baris lebih stabil.'
            : 'Teks bacaan dikembalikan ke ketebalan reguler.',
        }
      }

      if (/penggaris|reading ruler|garis baca|baris fokus/.test(q)) {
        const shouldDisable = /matikan|nonaktif|off|tutup/.test(q)
        const nextState = shouldDisable
          ? false
          : /nyalakan|aktifkan|on|pakai/.test(q)
            ? true
            : !readingGuideEnabled
        setReadingGuideEnabled(nextState)
        return {
          handled: true,
          actionBadge: `Penggaris Baca ${nextState ? 'Aktif' : 'Nonaktif'}`,
          heading: nextState ? 'Penggaris Baca 60fps Aktif' : 'Penggaris Baca Dimatikan',
          summary: nextState
            ? 'Gerakkan kursor atau sentuh layar untuk menyorot baris bacaan aktif.'
            : 'Sorotan penggaris baris telah ditutup.',
        }
      }

      if (/\b(tema|mode gelap|dark mode|kontras tinggi|high contrast|sepia|mode terang|tema krem)\b/.test(q)) {
        let targetTheme: ReadingTheme = pageTheme
        let label = 'Terang'
        if (/kontras tinggi|high contrast/.test(q)) {
          targetTheme = 'high-contrast'
          label = 'Kontras Tinggi (WCAG AAA)'
        } else if (/gelap|dark|malam/.test(q)) {
          targetTheme = 'dark'
          label = 'Gelap Nyaman'
        } else if (/sepia|lembut|hangat|krem|soft/.test(q)) {
          targetTheme = 'soft'
          label = 'Krem Hangat (Sepia)'
        } else if (/terang|light|normal|putih/.test(q)) {
          targetTheme = 'light'
          label = 'Terang Bersih'
        } else {
          targetTheme = pageTheme === 'dark' ? 'light' : 'dark'
          label = targetTheme === 'dark' ? 'Gelap Nyaman' : 'Terang Bersih'
        }
        setPageTheme(targetTheme)
        return {
          handled: true,
          actionBadge: `Tema · ${label}`,
          heading: `Tema Diubah ke ${label}`,
          summary: 'Seluruh kontras latar dan teks halaman telah disesuaikan secara otomatis.',
        }
      }

      if (/perbesar huruf|perbesar teks|huruf besar|ukuran teks|perkecil huruf|perkecil teks/.test(q)) {
        const shrink = /perkecil|kecilkan/.test(q)
        const nextSize = shrink ? Math.max(14, fontSize - 2) : Math.min(24, fontSize + 2)
        setFontSize(nextSize)
        return {
          handled: true,
          actionBadge: `Ukuran Teks · ${nextSize}px`,
          heading: `Ukuran Huruf Diatur ke ${nextSize}px`,
          summary: 'Proporsi teks pada ruang baca telah diperbarui.',
        }
      }

      if (/mode fokus|fokus tenang|sembunyikan distraksi|calm mode/.test(q)) {
        const willBeActive = !learningModes.includes('focus')
        toggleLearningMode('focus')
        return {
          handled: true,
          actionBadge: `Mode Fokus ${willBeActive ? 'Aktif' : 'Nonaktif'}`,
          heading: willBeActive ? 'Mode Fokus Tenang Aktif' : 'Mode Fokus Tenang Dimatikan',
          summary: willBeActive
            ? 'Animasi dekoratif diredam agar kamu bisa berkonsentrasi penuh pada materi.'
            : 'Tampilan kembali ke mode standar.',
        }
      }

      if (/^(buka|pergi ke|navigasi ke|arahkan ke)\s+/.test(q)) {
        if (/progres|analitik|statistik/.test(q)) {
          navigate('/progress')
          return {
            handled: true,
            actionBadge: 'Navigasi · Progres',
            heading: 'Membuka Halaman Progres',
            summary: 'Menampilkan analitik belajar dan jadwal Spaced Repetition.',
          }
        }
        const matchedMat = rankSections(rawQuestion)[0]?.material
        if (matchedMat) {
          navigate(`/materials/${matchedMat.id}`)
          return {
            handled: true,
            actionBadge: `Navigasi · ${matchedMat.category}`,
            heading: matchedMat.title,
            summary: `Membuka ruang baca untuk modul "${matchedMat.title}".`,
            citations: [
              {
                title: matchedMat.title,
                route: `/materials/${matchedMat.id}`,
                category: matchedMat.category,
              },
            ],
          }
        }
      }

      return { handled: false, summary: '' }
    },
    [
      bionicReadingEnabled,
      fontSize,
      learningModes,
      navigate,
      pageTheme,
      readingGuideEnabled,
      setBionicReadingEnabled,
      setFontSize,
      setPageTheme,
      setReadingGuideEnabled,
      toggleLearningMode,
    ]
  )

  const buildLocalIntelligence = useCallback(
    (
      question: string,
      currentPersona: TutorPersona
    ): Pick<Message, 'heading' | 'summary' | 'bullets' | 'analogy' | 'citations' | 'challenge' | 'canSaveToNote'> => {
      const normalizedQuestion = normalize(question)
      const section =
        activeMaterial?.sections.find((item) => item.id === activeSectionId) ??
        activeMaterial?.sections[0]
      const allGlossary = materials.flatMap((material) =>
        material.glossary.map((term) => ({
          ...term,
          materialId: material.id,
          materialTitle: material.title,
          categoryTitle: material.category,
        }))
      )

      // 1. Jika meminta kuis / uji pemahaman / mode socratic
      if (
        currentPersona === 'socratic' ||
        /uji aku|tes aku|kuis|latihan soal|tantangan/.test(normalizedQuestion)
      ) {
        const pool = activeMaterial
          ? activeMaterial.quiz.map((q) => ({ ...q, mat: activeMaterial }))
          : materials.flatMap((m) => m.quiz.map((q) => ({ ...q, mat: m })))
        const rankedQuiz = rankSections(question)[0]?.material
        const chosenQuizPool = rankedQuiz
          ? rankedQuiz.quiz.map((q) => ({ ...q, mat: rankedQuiz }))
          : pool
        const pick =
          chosenQuizPool[Math.floor(Math.random() * chosenQuizPool.length)] ?? pool[0]

        if (pick) {
          const targetSec = pick.mat.sections[0]
          return {
            ...buildStructuredResponse(
              'socratic',
              pick.mat.title,
              targetSec?.simpleSummary ?? pick.mat.description,
              targetSec?.keyPoints ?? []
            ),
            citations: [
              {
                title: pick.mat.title,
                route: `/materials/${pick.mat.id}`,
                category: pick.mat.category,
              },
            ],
            challenge: {
              question: pick.question,
              options: pick.options,
              correctIndex: Math.max(0, pick.options.indexOf(pick.answer)),
              explanation: pick.explanation,
              hint: pick.hint,
            },
            canSaveToNote: true,
          }
        }
      }

      // 2. Ringkas materi yang sedang dibuka
      if (/ringkas|jelaskan materi ini|materi yang sedang|poin penting|rangkum/.test(normalizedQuestion)) {
        if (activeMaterial && section) {
          return {
            ...buildStructuredResponse(
              currentPersona,
              `${activeMaterial.title} — ${section.title}`,
              section.simpleSummary,
              section.keyPoints
            ),
            citations: [
              {
                title: `${activeMaterial.title} · ${section.title}`,
                route: `/materials/${activeMaterial.id}?section=${section.id}`,
                category: activeMaterial.category,
              },
            ],
            canSaveToNote: true,
          }
        }
      }

      // 3. Pencarian Glosarium Presisi
      const exactTerm = allGlossary.find((term) => normalizedQuestion.includes(normalize(term.term)))
      if (exactTerm) {
        return {
          ...buildStructuredResponse(
            currentPersona,
            `Istilah Glosarium · ${exactTerm.term}`,
            exactTerm.definition,
            [`Contoh penerapan: ${exactTerm.example}`, `Modul: ${exactTerm.materialTitle}`],
            `Contoh konkret: ${exactTerm.example}`
          ),
          citations: [
            {
              title: exactTerm.materialTitle,
              route: `/materials/${exactTerm.materialId}`,
              category: exactTerm.categoryTitle,
            },
          ],
          canSaveToNote: true,
        }
      }

      // 4. Hybrid BM25-like Section Search
      const ranked = rankSections(question)
      if (ranked.length > 0) {
        const best = ranked[0]
        const citations: Citation[] = ranked.slice(0, 2).map((item) => ({
          title: `${item.material.title} · ${item.section.title}`,
          route: `/materials/${item.material.id}?section=${item.section.id}`,
          category: item.categoryTitle,
        }))

        return {
          ...buildStructuredResponse(
            currentPersona,
            `${best.material.title} — ${best.section.title}`,
            best.section.simpleSummary,
            best.section.keyPoints
          ),
          citations,
          canSaveToNote: true,
        }
      }

      // 5. Fallback Kontekstual jika sedang di dalam halaman materi
      if (activeMaterial && section) {
        return {
          ...buildStructuredResponse(
            currentPersona,
            `${activeMaterial.title} — ${section.title}`,
            section.simpleSummary,
            section.keyPoints
          ),
          citations: [
            {
              title: activeMaterial.title,
              route: `/materials/${activeMaterial.id}`,
              category: activeMaterial.category,
            },
          ],
          canSaveToNote: true,
        }
      }

      const topCategories = learningCategories.slice(0, 5).map((c) => c.title)
      return {
        heading: 'Panduan Topik EduBridge',
        summary:
          'Aku siap merangkum 25+ modul pembelajaran inklusif atau mengatur preferensi ruang bacamu.',
        bullets: [
          `Rumpun materi: ${topCategories.join(', ')}`,
          'Ketik "Nyalakan Bionic" atau buka tab Kontrol Cepat untuk mengubah tampilan',
        ],
        citations: [
          { title: 'Buka Katalog Materi', route: '/materials', category: 'Kurikulum' },
        ],
        canSaveToNote: false,
      }
    },
    [activeMaterial, activeSectionId]
  )

  const handleSaveToNote = useCallback(
    (msg: Message) => {
      // Prioritaskan section ID dari URL aktif, atau dari route sitasi pesan jika ada
      const citedSectionId = msg.citations?.[0]?.route
        ? new URLSearchParams(msg.citations[0].route.split('?')[1] ?? '').get('section')
        : null

      const targetId =
        activeSectionId ??
        citedSectionId ??
        activeMaterial?.sections[0]?.id ??
        activeMaterial?.id ??
        'catatan-umum'

      const existing = lessonNotes[targetId] ?? ''
      const timestamp = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      })
      const bodyLines = [
        msg.heading ? `### ${msg.heading}` : '',
        msg.summary,
        ...(msg.bullets ?? []).map((b) => `- ${b}`),
      ]
        .filter(Boolean)
        .join('\n')
      const formattedAddition = `[Catatan Aksa · ${timestamp}]\n${bodyLines}`
      const nextNote = existing ? `${existing}\n\n${formattedAddition}` : formattedAddition
      setLessonNote(targetId, nextNote)

      // Jika ada catatan lama yang tertinggal di level ID modul, gabungkan agar tidak orphaned
      if (activeMaterial && targetId !== activeMaterial.id && lessonNotes[activeMaterial.id]) {
        setLessonNote(targetId, `${lessonNotes[activeMaterial.id]}\n\n${nextNote}`)
        setLessonNote(activeMaterial.id, '')
      }

      setMessages((curr) =>
        curr.map((item) => (item.id === msg.id ? { ...item, savedToNote: true } : item))
      )
    },
    [activeMaterial, activeSectionId, lessonNotes, setLessonNote]
  )

  const handleAnswerChallenge = useCallback((messageId: string, optionIdx: number) => {
    setMessages((curr) =>
      curr.map((item) =>
        item.id === messageId ? { ...item, selectedOption: optionIdx } : item
      )
    )
  }, [])

  const submitPromptText = useCallback(
    async (rawQuestion: string, overridePersona?: TutorPersona) => {
      const question = rawQuestion.trim()
      if (!question || isSending) return

      setActiveTab('chat')
      const activePersona = overridePersona ?? persona
      const learnerMsg: Message = {
        id: `learner-${Date.now()}`,
        role: 'learner',
        summary: question,
      }

      setMessages((current) => [...current, learnerMsg].slice(-14))
      setDraft('')
      setSelectedQuote('')

      const agentResult = executeAgenticCommand(question)
      if (agentResult.handled) {
        setMessages((current) =>
          [
            ...current,
            {
              id: `companion-agent-${Date.now()}`,
              role: 'companion' as const,
              heading: agentResult.heading,
              summary: agentResult.summary,
              actionBadge: agentResult.actionBadge,
              citations: agentResult.citations,
            },
          ].slice(-14)
        )
        return
      }

      const localResult = buildLocalIntelligence(question, activePersona)

      setIsSending(true)

      const contextSection = activeMaterial?.sections.find((item) => item.id === activeSectionId)
      const context = activeMaterial
        ? JSON.stringify({
            category: activeMaterial.category,
            material: activeMaterial.title,
            activeSection: contextSection?.title ?? null,
            sections: activeMaterial.sections.map((section) => ({
              title: section.title,
              summary: section.simpleSummary,
              keyPoints: section.keyPoints,
              details: section.paragraphs,
            })),
            glossary: activeMaterial.glossary,
          })
        : createCatalogContext(question)

      const history = messages
        .slice(1)
        .slice(-6)
        .map((message) => ({
          role: message.role === 'learner' ? 'user' : 'assistant',
          content: message.summary,
        }))

      const augmentedQuestion = `${PERSONA_CONFIG[activePersona].promptPrefix}\nPertanyaan: ${question}`

      try {
        const response = await fetch('/api/companion', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ question: augmentedQuestion, context, history }),
        })
        const result = (await response.json()) as {
          answer?: string
          code?: string
          model?: string
        }

        if (response.ok && result.answer) {
          setAiConfigured(true)
          if (result.model) {
            const clean = result.model
              .replace(/^models\//, '')
              .replace(/[-_]/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase())
            setAiModelName(clean.includes('Gemini') ? clean : `Gemini ${clean}`)
          }

          const raw = result.answer.trim()
          const lines = raw.split('\n')
          let heading: string | undefined
          let cleanContent = raw
          if (lines[0]?.startsWith('#')) {
            heading = lines[0].replace(/^#+\s*/, '').trim()
            cleanContent = lines.slice(1).join('\n').trim()
          }

          setMessages((current) =>
            [
              ...current,
              {
                id: `companion-ai-${Date.now()}`,
                role: 'companion' as const,
                heading: heading ?? localResult.heading ?? 'Aksa · Gemini AI',
                summary: cleanContent,
                persona: activePersona,
                citations: localResult.citations,
                canSaveToNote: true,
              },
            ].slice(-14)
          )
        } else {
          if (result.code === 'AI_NOT_CONFIGURED') setAiConfigured(false)
          setMessages((current) =>
            [
              ...current,
              {
                id: `companion-fallback-${Date.now()}`,
                role: 'companion' as const,
                persona: activePersona,
                ...localResult,
              },
            ].slice(-14)
          )
        }
      } catch {
        setAiConfigured(false)
        setMessages((current) =>
          [
            ...current,
            {
              id: `companion-offline-${Date.now()}`,
              role: 'companion' as const,
              persona: activePersona,
              ...localResult,
            },
          ].slice(-14)
        )
      } finally {
        setIsSending(false)
      }
    },
    [
      activeMaterial,
      activeSectionId,
      buildLocalIntelligence,
      executeAgenticCommand,
      isSending,
      messages,
      persona,
    ]
  )

  function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void submitPromptText(draft)
  }

  useEffect(() => {
    const handleAskEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ prompt?: string; persona?: TutorPersona }>).detail
      setIsVisible(true)
      setIsOpen(true)
      setActiveTab('chat')
      if (detail?.persona) setPersona(detail.persona)
      if (detail?.prompt) void submitPromptText(detail.prompt, detail.persona)
    }

    const handleToggleEvent = () => {
      setIsVisible(true)
      setIsOpen((prev) => !prev)
    }

    window.addEventListener('edubridge:ask-aksa', handleAskEvent)
    window.addEventListener('edubridge:toggle-aksa', handleToggleEvent)
    return () => {
      window.removeEventListener('edubridge:ask-aksa', handleAskEvent)
      window.removeEventListener('edubridge:toggle-aksa', handleToggleEvent)
    }
  }, [submitPromptText])

  if (isQuizActive) return null

  if (!isVisible) {
    return (
      <button
        type="button"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-50 inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border-strong bg-surface px-4 text-xs font-bold text-text-primary shadow-elevated hover:border-primary-600 focus-visible:outline-offset-4 cursor-pointer"
      >
        <Eye size={16} aria-hidden="true" className="text-primary-700" />
        <span>Tampilkan Aksa</span>
      </button>
    )
  }

  const keyboardOffset =
    visualViewport.height > 0
      ? window.innerHeight - (visualViewport.offsetTop + visualViewport.height)
      : 0
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const defaultBottom = isMobile ? 20 : 24
  const bottomPosition = keyboardOffset > 10 ? keyboardOffset + 16 : defaultBottom

  const quickPrompts = activeMaterial
    ? [
        { label: 'Ringkas Bab Ini', prompt: `Ringkas materi ${activeMaterial.title}` },
        {
          label: activeMaterial.glossary[0]
            ? `Arti ${activeMaterial.glossary[0].term}`
            : 'Poin Kunci',
          prompt: activeMaterial.glossary[0]
            ? `Apa arti ${activeMaterial.glossary[0].term}?`
            : `Apa poin penting ${activeMaterial.title}?`,
        },
        { label: 'Langkah Praktis', prompt: `Bagaimana langkah menerapkan ${activeMaterial.title}?`, persona: 'step' as TutorPersona },
        { label: 'Tanya Bebas', prompt: 'Berikan tips belajar yang efektif untuk materi ini' },
      ]
    : [
        { label: 'Apa itu UDL?', prompt: 'Jelaskan apa itu Universal Design for Learning dan penerapannya' },
        { label: 'Tanya Coding / Web', prompt: 'Jelaskan perbedaan synchronous dan asynchronous di JavaScript dengan contoh' },
        { label: 'Tipografi Disleksia', prompt: 'Bagaimana aturan tipografi ramah disleksia?' },
        { label: 'Tips Belajar Cepat', prompt: 'Berikan 3 teknik belajar berbasis sains otak (cognitive science)' },
      ]

  return (
    <div
      className="fixed right-3 sm:right-6 z-50 flex flex-col items-end gap-2.5 transition-all duration-300"
      style={{ bottom: `${bottomPosition}px` }}
    >
      {/* Floating Selection Chip saat pengguna memblok kalimat */}
      {!isOpen && selectedQuote && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true)
            void submitPromptText(`Jelaskan maksud kutipan ini: "${selectedQuote}"`, 'eli5')
          }}
          className="inline-flex min-h-[40px] max-w-xs items-center gap-2 rounded-full border border-primary-300 bg-surface px-3.5 py-1.5 text-xs font-semibold text-primary-900 shadow-card hover:border-primary-600 cursor-pointer"
        >
          <Sparkle size={14} weight="fill" aria-hidden="true" className="text-primary-600 shrink-0" />
          <span className="truncate">Tanya Aksa: &ldquo;{selectedQuote}&rdquo;</span>
        </button>
      )}

      {isOpen && (
        <section
          id="study-companion-panel"
          aria-label="Asisten belajar Aksa"
          className={`flex flex-col overflow-hidden rounded-3xl border border-border-strong bg-surface shadow-elevated transition-all duration-200 ${
            isExpanded
              ? 'h-[min(42rem,calc(100dvh-5rem))] w-[min(32rem,calc(100vw-1.5rem))]'
              : 'h-[min(35rem,calc(100dvh-7rem))] w-[min(24rem,calc(100vw-1.5rem))] md:h-[min(36rem,calc(100dvh-3rem))]'
          }`}
        >
          {/* 1. HEADER BERSIH & TERSTRUKTUR */}
          <header className="border-b border-border bg-surface-elevated px-4 pt-3.5 pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`companion-avatar shrink-0${isListeningMic || isSending ? ' is-listening' : ''}`}
                  aria-hidden="true"
                >
                  <span className="companion-eye" />
                  <span className="companion-eye" />
                  <span className="companion-mouth" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-extrabold tracking-tight text-text-primary">
                      Aksa Copilot
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition-colors ${
                        aiConfigured
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          : 'bg-primary-50 text-primary-800 border-primary-200'
                      }`}
                    >
                      <Sparkle
                        size={11}
                        weight="fill"
                        className={aiConfigured ? 'text-emerald-600' : 'text-primary-600'}
                      />
                      <span>{aiConfigured ? aiModelName : 'Lokal Pintar'}</span>
                    </span>
                  </div>
                  <p className="truncate text-[11px] text-text-secondary">
                    {activeMaterial ? activeMaterial.title : 'Pendamping Kurikulum & Aksesibilitas'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-muted hover:text-text-primary cursor-pointer"
                  aria-label={isExpanded ? 'Perkecil panel' : 'Perluas panel'}
                  title={isExpanded ? 'Perkecil' : 'Perluas'}
                >
                  {isExpanded ? <ArrowsInSimple size={16} /> : <ArrowsOutSimple size={16} />}
                </button>
                <button
                  type="button"
                  onClick={() => setMessages([openingMessage])}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-muted hover:text-text-primary cursor-pointer"
                  aria-label="Reset percakapan"
                  title="Bersihkan chat"
                >
                  <Trash size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsVisible(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-muted hover:text-text-primary cursor-pointer"
                  aria-label="Sembunyikan tombol Aksa"
                  title="Sembunyikan"
                >
                  <Eye size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-muted hover:text-text-primary cursor-pointer"
                  aria-label="Tutup panel Aksa"
                  title="Tutup"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* Navigasi 3 Tab Utama: Diskusi | Uji Kuis | Kontrol Cepat */}
            <div
              className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-surface-muted p-1 border border-border"
              role="tablist"
              aria-label="Mode ruang kerja Aksa"
            >
              {[
                { id: 'chat' as WorkspaceTab, label: 'Diskusi', icon: ChatCircleDots },
                { id: 'quiz' as WorkspaceTab, label: 'Uji Kuis', icon: GraduationCap },
                { id: 'controls' as WorkspaceTab, label: 'Kontrol', icon: SlidersHorizontal },
              ].map((t) => {
                const active = activeTab === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-surface text-primary-800 shadow-soft border border-border/80'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <t.icon size={14} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
                    <span>{t.label}</span>
                  </button>
                )
              })}
            </div>
          </header>

          {/* 2A. TAB DISKUSI (CHAT TERSTRUKTUR) */}
          {activeTab === 'chat' && (
            <>
              {/* Baris Gaya Penjelasan (4 Pilihan Rapi) */}
              <div className="flex items-center justify-between gap-2 border-b border-border bg-surface px-3.5 py-2">
                <span className="text-[11px] font-semibold text-text-muted shrink-0">Gaya:</span>
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {(Object.keys(PERSONA_CONFIG) as TutorPersona[]).map((key) => {
                    const active = persona === key
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPersona(key)}
                        aria-pressed={active}
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                          active
                            ? 'bg-primary-800 text-white'
                            : 'bg-surface-muted text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {PERSONA_CONFIG[key].short}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Area Pesan Terstruktur */}
              <div
                ref={messageListRef}
                className="flex-1 space-y-3 overflow-y-auto px-3.5 py-3.5"
                role="log"
                aria-live="polite"
              >
                {messages.map((message) => {
                  const isSpeaking = speakingMessageId === message.id
                  if (message.role === 'learner') {
                    return (
                      <div key={message.id} className="flex justify-end">
                        <div className="max-w-[85%] rounded-2xl rounded-br-xs bg-primary-800 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-white">
                          {message.summary}
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div key={message.id} className="flex flex-col items-start">
                      <div className="w-full rounded-2xl border border-border bg-surface-elevated p-3.5 shadow-soft">
                        {/* Badge Konfirmasi bila baru menjalankan perintah */}
                        {message.actionBadge && (
                          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-0.5 text-[10px] font-bold text-primary-800 border border-primary-200">
                            <Lightning size={11} weight="fill" aria-hidden="true" />
                            <span>{message.actionBadge}</span>
                          </div>
                        )}

                        {/* Judul Jawaban */}
                        {message.heading && (
                          <h3 className="text-xs font-extrabold text-text-primary">
                            {message.heading}
                          </h3>
                        )}

                        {/* Paragraf Inti / Format Konten */}
                        <FormattedMessageContent content={message.summary} />

                        {/* Kotak Analogi (jika ada) */}
                        {message.analogy && (
                          <div className="mt-2.5 rounded-xl border-l-2 border-primary-600 bg-surface px-3 py-2 text-xs text-text-primary">
                            {message.analogy}
                          </div>
                        )}

                        {/* Daftar Poin Kunci */}
                        {message.bullets && message.bullets.length > 0 && (
                          <ul className="mt-2.5 space-y-1.5 border-t border-border/70 pt-2 text-xs text-text-primary">
                            {message.bullets.map((b) => (
                              <li key={b} className="flex items-start gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary-600 shrink-0" />
                                <span className="leading-relaxed">{b}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Kuis Sokratik Inline (jika mode Uji Kuis dipakai di chat) */}
                        {message.challenge && (
                          <div className="mt-3 rounded-xl border border-primary-200 bg-surface p-2.5">
                            <p className="text-xs font-bold text-text-primary">
                              {message.challenge.question}
                            </p>
                            <div className="mt-2 space-y-1">
                              {message.challenge.options.map((opt, idx) => {
                                const answered = typeof message.selectedOption === 'number'
                                const isSelected = message.selectedOption === idx
                                const isCorrect = message.challenge!.correctIndex === idx
                                let style =
                                  'border-border bg-surface-elevated text-text-primary hover:border-primary-500'
                                if (answered) {
                                  if (isCorrect)
                                    style =
                                      'border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold'
                                  else if (isSelected)
                                    style = 'border-amber-500 bg-amber-50 text-amber-950'
                                }
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    disabled={answered}
                                    onClick={() => handleAnswerChallenge(message.id, idx)}
                                    className={`w-full rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer ${style}`}
                                  >
                                    {opt}
                                  </button>
                                )
                              })}
                            </div>
                            {typeof message.selectedOption === 'number' && (
                              <p className="mt-2 text-[11px] font-medium text-primary-900">
                                {message.selectedOption === message.challenge.correctIndex
                                  ? `Benar! ${message.challenge.explanation}`
                                  : `Petunjuk: ${message.challenge.hint}`}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Baris Bawah Kartu: Sitasi + Tombol Suara & Simpan Catatan */}
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2">
                          <div className="flex flex-wrap items-center gap-1">
                            {message.citations?.map((cit) => (
                              <button
                                key={cit.route}
                                type="button"
                                onClick={() => navigate(cit.route)}
                                className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-800 hover:bg-primary-100 cursor-pointer"
                              >
                                <BookOpen size={11} weight="bold" aria-hidden="true" />
                                <span className="truncate max-w-[140px]">{cit.title}</span>
                              </button>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 ml-auto">
                            <button
                              type="button"
                              onClick={() => speakMessage(message)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-secondary hover:text-primary-800 cursor-pointer"
                              aria-label={isSpeaking ? 'Hentikan suara' : 'Dengarkan jawaban'}
                            >
                              {isSpeaking ? (
                                <>
                                  <Stop size={12} weight="fill" className="text-amber-600" />
                                  <span>Stop</span>
                                </>
                              ) : (
                                <>
                                  <SpeakerHigh size={12} weight="bold" />
                                  <span>Suara</span>
                                </>
                              )}
                            </button>

                            {message.canSaveToNote && (
                              <button
                                type="button"
                                disabled={message.savedToNote}
                                onClick={() => handleSaveToNote(message)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-secondary hover:text-primary-800 disabled:text-emerald-700 cursor-pointer"
                              >
                                {message.savedToNote ? (
                                  <>
                                    <CheckCircle size={12} weight="fill" />
                                    <span>Tersimpan</span>
                                  </>
                                ) : (
                                  <>
                                    <NotePencil size={12} weight="bold" />
                                    <span>Catat</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {isSending && (
                  <div
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-3 py-2 text-xs text-text-secondary"
                    role="status"
                  >
                    <Sparkle size={13} weight="fill" className="animate-spin text-primary-600" />
                    <span>Menyusun jawaban terstruktur...</span>
                  </div>
                )}
              </div>

              {/* Saran Pertanyaan Kontekstual (1 Baris Bersih) */}
              <div className="flex items-center gap-1.5 overflow-x-auto border-t border-border bg-surface-elevated/60 px-3 py-2 no-scrollbar">
                {quickPrompts.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      if (item.persona) setPersona(item.persona)
                      void submitPromptText(item.prompt, item.persona)
                    }}
                    className="shrink-0 rounded-full border border-border-strong bg-surface px-2.5 py-1 text-[11px] font-semibold text-text-secondary hover:border-primary-600 hover:text-primary-800 transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Input Bar */}
              <form
                onSubmit={submitQuestion}
                className="flex items-center gap-1.5 border-t border-border bg-surface p-2.5"
              >
                <button
                  type="button"
                  onClick={toggleVoiceDictation}
                  aria-pressed={isListeningMic}
                  aria-label={isListeningMic ? 'Hentikan dikte suara' : 'Dikte suara Bahasa Indonesia'}
                  title="Dikte Suara (id-ID)"
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                    isListeningMic
                      ? 'border-amber-500 bg-amber-50 text-amber-800 animate-pulse'
                      : 'border-border bg-surface-elevated text-text-secondary hover:text-primary-800'
                  }`}
                >
                  {isListeningMic ? (
                    <MicrophoneSlash size={18} weight="fill" />
                  ) : (
                    <Microphone size={18} weight="bold" />
                  )}
                </button>

                <label htmlFor="companion-question" className="sr-only">
                  Tulis pertanyaan untuk Aksa
                </label>
                <input
                  ref={inputRef}
                  id="companion-question"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={
                    isListeningMic
                      ? 'Mendengarkan suaramu...'
                      : 'Tanya apa saja ke Aksa (Gemini AI)...'
                  }
                  className="h-10 min-w-0 flex-1 rounded-xl border border-border-strong bg-surface px-3 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus-visible:border-primary-600"
                  maxLength={600}
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || isSending}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-800 text-white hover:bg-primary-900 disabled:opacity-40 cursor-pointer"
                  aria-label="Kirim pertanyaan"
                >
                  <PaperPlaneTilt size={17} weight="fill" />
                </button>
              </form>
            </>
          )}

          {/* 2B. TAB UJI KUIS (SOCRATIC FLASH-QUIZ TERPISAH & FOKUS) */}
          {activeTab === 'quiz' && currentTabQuiz && (
            <div className="flex flex-1 flex-col justify-between overflow-y-auto p-4">
              <div>
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span className="font-bold uppercase tracking-wider text-primary-700">
                    {currentTabQuiz.materialTitle}
                  </span>
                  <span className="font-mono font-semibold">
                    Soal {(quizIndex % activeQuizPool.length) + 1} / {activeQuizPool.length}
                  </span>
                </div>

                <h3 className="mt-2.5 text-sm font-extrabold leading-snug text-text-primary">
                  {currentTabQuiz.question}
                </h3>

                <div className="mt-3.5 space-y-2">
                  {currentTabQuiz.options.map((opt, idx) => {
                    const correctIdx = Math.max(0, currentTabQuiz.options.indexOf(currentTabQuiz.answer))
                    const answered = quizPicked !== null
                    const isSelected = quizPicked === idx
                    const isCorrect = correctIdx === idx

                    let cls =
                      'border-border bg-surface-elevated text-text-primary hover:border-primary-500'
                    if (answered) {
                      if (isCorrect)
                        cls = 'border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold'
                      else if (isSelected) cls = 'border-amber-500 bg-amber-50 text-amber-950'
                    }

                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={answered}
                        onClick={() => setQuizPicked(idx)}
                        className={`w-full rounded-xl border p-3 text-left text-xs leading-relaxed transition-all cursor-pointer ${cls}`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>

                {quizPicked !== null && (
                  <div className="mt-3.5 rounded-xl border border-primary-200 bg-primary-50 p-3 text-xs text-primary-950">
                    <p className="font-bold">
                      {quizPicked === Math.max(0, currentTabQuiz.options.indexOf(currentTabQuiz.answer))
                        ? 'Jawaban Tepat!'
                        : `Petunjuk: ${currentTabQuiz.hint}`}
                    </p>
                    <p className="mt-1 leading-relaxed">{currentTabQuiz.explanation}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => setQuizPicked(null)}
                  className="text-xs font-semibold text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  Ulangi Soal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuizPicked(null)
                    setQuizIndex((i) => i + 1)
                  }}
                  className="rounded-full bg-primary-800 px-4 py-2 text-xs font-bold text-white hover:bg-primary-900 cursor-pointer"
                >
                  Soal Berikutnya
                </button>
              </div>
            </div>
          )}

          {/* 2C. TAB KONTROL CEPAT AKSESIBILITAS (TANPA PERLU KETIK) */}
          {activeTab === 'controls' && (
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-text-muted">
                  Alat Bantu Baca Instan
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBionicReadingEnabled(!bionicReadingEnabled)}
                    aria-pressed={bionicReadingEnabled}
                    className={`flex flex-col items-start rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                      bionicReadingEnabled
                        ? 'border-primary-600 bg-primary-50 text-primary-950'
                        : 'border-border bg-surface-elevated text-text-primary hover:border-primary-400'
                    }`}
                  >
                    <span className="text-xs font-extrabold">Bionic Reading</span>
                    <span className="mt-0.5 text-[11px] text-text-secondary">
                      {bionicReadingEnabled ? 'Aktif (Tebal Awal)' : 'Nonaktif'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReadingGuideEnabled(!readingGuideEnabled)}
                    aria-pressed={readingGuideEnabled}
                    className={`flex flex-col items-start rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                      readingGuideEnabled
                        ? 'border-primary-600 bg-primary-50 text-primary-950'
                        : 'border-border bg-surface-elevated text-text-primary hover:border-primary-400'
                    }`}
                  >
                    <span className="text-xs font-extrabold">Penggaris Baca</span>
                    <span className="mt-0.5 text-[11px] text-text-secondary">
                      {readingGuideEnabled ? 'Aktif (60fps)' : 'Nonaktif'}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-text-muted">
                    Ukuran Huruf Materi
                  </p>
                  <span className="font-mono text-xs font-bold text-primary-800">{fontSize}px</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {[
                    { label: 'Kecilkan (-)', size: Math.max(14, fontSize - 2) },
                    { label: 'Standar (16px)', size: 16 },
                    { label: 'Besarkan (+)', size: Math.min(24, fontSize + 2) },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={() => setFontSize(btn.size)}
                      className="rounded-xl border border-border bg-surface-elevated py-2 text-xs font-semibold text-text-primary hover:border-primary-500 cursor-pointer"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-text-muted">
                  Tema Kontras Layar
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'light', label: 'Terang Bersih' },
                      { id: 'soft', label: 'Krem Sepia' },
                      { id: 'dark', label: 'Gelap Nyaman' },
                      { id: 'high-contrast', label: 'Kontras AAA' },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPageTheme(t.id)}
                      aria-pressed={pageTheme === t.id}
                      className={`rounded-xl border px-3 py-2 text-left text-xs font-bold transition-all cursor-pointer ${
                        pageTheme === t.id
                          ? 'border-primary-600 bg-primary-50 text-primary-950'
                          : 'border-border bg-surface-elevated text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* TOMBOL PELUNCUR RINGKAS */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="companion-launcher flex min-h-[52px] items-center gap-2.5 rounded-full border border-border-strong bg-surface py-1.5 pl-2 pr-4 text-sm font-bold text-text-primary shadow-elevated hover:border-primary-600 focus-visible:outline-offset-4 cursor-pointer"
          aria-expanded={false}
          aria-label="Buka Aksa Copilot"
        >
          <span
            className={`companion-avatar${draft.length > 0 ? ' is-listening' : ''}`}
            aria-hidden="true"
          >
            <span className="companion-eye" />
            <span className="companion-eye" />
            <span className="companion-mouth" />
          </span>
          <span className="text-xs font-extrabold tracking-tight">Tanya Aksa</span>
          <ChatCircleDots size={18} weight="fill" aria-hidden="true" className="text-primary-700" />
        </button>
      )}
    </div>
  )
}
