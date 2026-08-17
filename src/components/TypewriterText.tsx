import { useEffect, useState, type CSSProperties } from 'react'

const CHAR_MS = 68
const SPACE_MS = 46
const PAUSE_BETWEEN_LINES_MS = 520
const PUNCT_PAUSE_MS = 140

export type TypewriterSegment = {
  text: string
  /** pause before this segment (e.g. 2s after "you") */
  pauseBefore?: number
  /** continue on same line as previous (e.g. ":)") */
  joinPrevious?: boolean
}

type TypingEvent =
  | { kind: 'char'; value: string }
  | { kind: 'pause'; ms: number }
  | { kind: 'break' }

type Props = {
  segments: TypewriterSegment[]
  className?: string
  onComplete?: () => void
  /** text kept visible when background turns black */
  keepText?: string
  /** fixed prefix before keepText on line 1 (avoids DOM churn while typing) */
  keepPrefix?: string
  hideCursor?: boolean
  /** pull apart → fade sides */
  pullKeep?: boolean
}

function renderKeepText(keep: string, keepText: string, pullKeep: boolean) {
  const isComplete = keep.length >= keepText.length
  const pulling = pullKeep && isComplete

  if (!isComplete) {
    return <span className="typewriter-keep">{keep}</span>
  }

  return (
    <span className={`typewriter-keep${pulling ? ' typewriter-keep-pull-fade' : ''}`}>
      {keepText.split('').map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          className="typewriter-keep-char"
          style={{ '--char-i': i } as CSSProperties}
        >
          {ch}
        </span>
      ))}
    </span>
  )
}

function renderKeepLine(
  line: string,
  keepText: string,
  keepPrefix: string,
  pullKeep: boolean,
  showCursor: boolean,
) {
  const before = line.slice(0, Math.min(line.length, keepPrefix.length))
  const rest = line.slice(keepPrefix.length)
  const keep = rest.slice(0, Math.min(rest.length, keepText.length))
  const after = rest.slice(keepText.length)
  const stillOnPrefix = keep.length === 0

  return (
    <span className="typewriter-keep-wrap">
      <span className="typewriter-prefix-slot">
        <span className="typewriter-prefix-rail">{keepPrefix}</span>
        <span className="typewriter-prefix-live">
          {before ? <span className="typewriter-fade-out typewriter-fade-prefix">{before}</span> : null}
          {showCursor && stillOnPrefix ? <span className="typewriter-cursor" aria-hidden /> : null}
        </span>
      </span>
      {renderKeepText(keep, keepText, pullKeep)}
      {after ? <span className="typewriter-fade-out">{after}</span> : null}
      {showCursor && !stillOnPrefix ? <span className="typewriter-cursor" aria-hidden /> : null}
    </span>
  )
}

function charDelay(ch: string): number {
  if (ch === ' ') return SPACE_MS
  if (',:;'.includes(ch)) return CHAR_MS + PUNCT_PAUSE_MS * 0.55
  if ('.!?'.includes(ch)) return CHAR_MS + PUNCT_PAUSE_MS
  return CHAR_MS
}

function buildEvents(segments: TypewriterSegment[]): TypingEvent[] {
  const events: TypingEvent[] = []

  segments.forEach((seg, i) => {
    if (i > 0 && !seg.joinPrevious) {
      events.push({ kind: 'pause', ms: PAUSE_BETWEEN_LINES_MS })
      events.push({ kind: 'break' })
    }

    if (seg.pauseBefore) {
      events.push({ kind: 'pause', ms: seg.pauseBefore })
    }

    for (const ch of seg.text) {
      events.push({ kind: 'char', value: ch })
    }
  })

  return events
}

function rowsFromEvents(events: TypingEvent[], count: number): string[] {
  const rows = ['']

  for (const event of events.slice(0, count)) {
    if (event.kind === 'char') {
      rows[rows.length - 1] += event.value
    } else if (event.kind === 'break') {
      rows.push('')
    }
  }

  return rows
}

function fullRows(segments: TypewriterSegment[]): string[] {
  return rowsFromEvents(buildEvents(segments), Number.MAX_SAFE_INTEGER)
}

export function TypewriterText({
  segments,
  className = '',
  onComplete,
  keepText,
  keepPrefix,
  hideCursor = false,
  pullKeep = false,
}: Props) {
  const [rows, setRows] = useState<string[]>([''])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      setRows(fullRows(segments))
      onComplete?.()
      return
    }

    const events = buildEvents(segments)
    let eventIdx = 0
    let timeoutId = 0

    const step = () => {
      if (eventIdx >= events.length) {
        onComplete?.()
        return
      }

      const event = events[eventIdx]
      eventIdx += 1
      setRows(rowsFromEvents(events, eventIdx))

      if (eventIdx >= events.length) {
        onComplete?.()
        return
      }

      let delay = 0
      if (event.kind === 'pause') delay = event.ms
      else if (event.kind === 'char') delay = charDelay(event.value)

      timeoutId = window.setTimeout(step, delay)
    }

    timeoutId = window.setTimeout(step, 0)

    return () => window.clearTimeout(timeoutId)
  }, [segments, onComplete])

  const lastRowIndex = rows.length - 1

  return (
    <div className={`typewriter-block ${className}`.trim()}>
      {rows.map((line, i) => {
        const showCursor = i === lastRowIndex && !hideCursor
        const isKeepLine = Boolean(keepText && keepPrefix && i === 0)

        return (
          <p
            key={i}
            className={`typewriter-line${isKeepLine ? ' typewriter-line-keep' : ''}`}
          >
            <span className="typewriter-line-inner">
              {isKeepLine ? (
                renderKeepLine(line, keepText!, keepPrefix!, pullKeep, showCursor)
              ) : keepText && i > 0 ? (
                <span className="typewriter-fade-out">{line}</span>
              ) : (
                <span className="typewriter-text">{line}</span>
              )}
              {showCursor && !isKeepLine ? <span className="typewriter-cursor" aria-hidden /> : null}
            </span>
          </p>
        )
      })}
    </div>
  )
}
