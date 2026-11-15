import type { GlossaryTerm } from '../data/materials'
import { useStore } from '../store'

interface GlossaryTextProps {
  text: string
  terms: GlossaryTerm[]
  onSelect: (term: GlossaryTerm) => void
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function renderBionicSegment(segment: string) {
  return segment.split(/(\s+)/).map((token, idx) => {
    if (!token || /^\s+$/.test(token)) return token
    const cleanLen = token.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, '').length
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

export function GlossaryText({ text, terms, onSelect }: GlossaryTextProps) {
  const bionicReadingEnabled = useStore((s) => s.bionicReadingEnabled)

  const formatPlain = (plain: string) => (bionicReadingEnabled ? renderBionicSegment(plain) : plain)

  if (terms.length === 0) return <>{formatPlain(text)}</>

  const termByName = new Map(terms.map((term) => [term.term.toLocaleLowerCase(), term]))
  const pattern = new RegExp(`\\b(${terms.map((term) => escapeRegExp(term.term)).sort((a, b) => b.length - a.length).join('|')})\\b`, 'gi')
  const parts = text.split(pattern)

  return (
    <>
      {parts.map((part, index) => {
        const term = termByName.get(part.toLocaleLowerCase())
        if (!term) return <span key={index}>{formatPlain(part)}</span>

        return (
          <button
            key={`${term.term}-${index}`}
            type="button"
            onClick={() => onSelect(term)}
            className="cursor-help rounded-sm border-b-2 border-dotted border-primary-600 bg-primary-50/70 px-1 font-medium text-inherit underline decoration-dotted underline-offset-2 transition-colors hover:bg-primary-100"
            aria-label={`Lihat arti ${term.term}`}
          >
            {part}
          </button>
        )
      })}
    </>
  )
}