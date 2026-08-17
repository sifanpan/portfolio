import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import {
  beatForUserTurn,
  isPlanConfirm,
  isPlanFeedback,
  PLAN_COACH_FEEDBACK_CHIPS,
  PLAN_COACH_HI,
  PLAN_COACH_MEET_CHIPS,
  PLAN_COACH_READY_MESSAGE,
  PLAN_COACH_SUB,
  PLAN_COACH_THINKING_LINES,
  PLAN_COACH_TIP,
  PLAN_COACH_WEEKS,
  type ChatMessage,
  type ChatTurnState,
  type CoachPhase,
  type WeekPlan,
} from '../../../data/planCoach'
import { SparkleStar } from './SparkleStar'

const INTRO_MS = 6800
const HI_START = 0.47
const HI_END = 0.59
const COACH_START = 0.605
const COACH_END = 0.735
const TIP_START = 0.75
const CHROME_START = 0.85
const CHROME_END = 0.94
const STREAM_TICK_MS = 28
const GENERATE_HOLD_MS = 850
const THINK_FADE_MS = 280
const THINK_HOLD_MS = 1100

function ramp(t: number, a: number, b: number) {
  if (t <= a) return 0
  if (t >= b) return 1
  const x = (t - a) / (b - a)
  return 1 - (1 - x) ** 3
}

function typed(full: string, progress: number) {
  if (progress <= 0) return ''
  if (progress >= 1) return full
  return full.slice(0, Math.ceil(full.length * progress))
}

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('aborted', 'AbortError'))
      return
    }
    const timer = window.setTimeout(resolve, ms)
    const onAbort = () => {
      window.clearTimeout(timer)
      reject(new DOMException('aborted', 'AbortError'))
    }
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

type MeetProps = {
  compact?: boolean
  interactive?: boolean
}

export function PlanCoachMeet({ compact = false, interactive = false }: MeetProps) {
  const [introT, setIntroT] = useState(0)
  const [phase, setPhase] = useState<CoachPhase>('meet')
  const [turn, setTurn] = useState<ChatTurnState>('idle')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [followUps, setFollowUps] = useState<string[]>([])
  const [weeks, setWeeks] = useState<WeekPlan[]>([])
  const [weeksAfter, setWeeksAfter] = useState<number | null>(null)
  const [thinkingLine, setThinkingLine] = useState<string | null>(null)
  const [thinkingOpacity, setThinkingOpacity] = useState(0)
  const [draft, setDraft] = useState('')
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const reduced = useRef(false)

  const introDone = introT >= CHROME_END
  const inChat = phase !== 'meet'
  const busy = turn === 'generating' || turn === 'streaming' || turn === 'planThinking'

  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useEffect(() => {
    if (reduced.current) {
      setIntroT(1)
      return
    }

    let frame = 0
    let start = 0
    let stopped = false

    const tick = (now: number) => {
      if (stopped) return
      if (!start) start = now
      const t = Math.min(1, (now - start) / INTRO_MS)
      setIntroT(t)
      if (t < 1) {
        frame = window.requestAnimationFrame(tick)
        return
      }
      if (compact) {
        window.setTimeout(() => {
          if (stopped) return
          start = 0
          setIntroT(0)
          frame = window.requestAnimationFrame(tick)
        }, 1400)
      }
    }

    frame = window.requestAnimationFrame(tick)
    return () => {
      stopped = true
      window.cancelAnimationFrame(frame)
    }
  }, [compact])

  const scrollToEnd = useCallback(() => {
    window.requestAnimationFrame(() => {
      const node = scrollRef.current
      if (!node) return
      node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' })
    })
  }, [])

  const streamText = useCallback(
    async (id: string, full: string, signal: AbortSignal) => {
      for (let i = 1; i <= full.length; i += 1) {
        await sleep(STREAM_TICK_MS, signal)
        setMessages((current) =>
          current.map((message) =>
            message.id === id ? { ...message, text: full.slice(0, i) } : message,
          ),
        )
        if (i % 12 === 0 || i === full.length) scrollToEnd()
      }
    },
    [scrollToEnd],
  )

  const runPlanThinking = useCallback(
    async (signal: AbortSignal) => {
      const steps = 8
      const stepWait = THINK_FADE_MS / steps
      for (const line of PLAN_COACH_THINKING_LINES) {
        setThinkingLine(line)
        setThinkingOpacity(0)
        for (let s = 1; s <= steps; s += 1) {
          await sleep(stepWait, signal)
          setThinkingOpacity(s / steps)
        }
        await sleep(THINK_HOLD_MS, signal)
        for (let s = steps - 1; s >= 0; s -= 1) {
          await sleep(stepWait, signal)
          setThinkingOpacity(s / steps)
        }
      }
    },
    [],
  )

  const sendMessage = useCallback(
    async (raw: string) => {
      const text = raw.trim()
      if (!text || busy || !interactive) return
      if (!introDone && phase === 'meet') return

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      const { signal } = controller

      const userTurn = messages.filter((message) => message.role === 'user').length + 1
      const userId = `u-${userTurn}`
      const assistantId = `a-${userTurn}`

      setDraft('')

      try {
        if (isPlanConfirm(text)) {
          setPhase('planGenerating')
          setFollowUps([])
          setWeeks([])
          setWeeksAfter(null)
          setMessages((current) => [...current, { id: userId, role: 'user', text }])
          setTurn('planThinking')
          setThinkingLine(PLAN_COACH_THINKING_LINES[0] ?? null)
          setThinkingOpacity(0)
          scrollToEnd()
          await runPlanThinking(signal)
          setTurn('awaitingUser')
          setPhase('planReady')
          setThinkingLine(null)
          setThinkingOpacity(0)
          setWeeks(PLAN_COACH_WEEKS)
          setWeeksAfter(messages.length + 1)
          setFollowUps([...PLAN_COACH_FEEDBACK_CHIPS])
          scrollToEnd()
          return
        }

        if (phase === 'planReady' && weeks.length > 0) {
          setFollowUps([])
          setMessages((current) => [...current, { id: userId, role: 'user', text }])
          setTurn('generating')
          scrollToEnd()
          await sleep(650, signal)
          setTurn('streaming')
          setMessages((current) => [
            ...current,
            { id: 'a-plan-ready', role: 'assistant', text: '', isStreaming: true },
          ])
          scrollToEnd()
          await streamText('a-plan-ready', PLAN_COACH_READY_MESSAGE, signal)
          setMessages((current) =>
            current.map((message) =>
              message.id === 'a-plan-ready' ? { ...message, isStreaming: false } : message,
            ),
          )
          setTurn('idle')
          setFollowUps([])
          scrollToEnd()
          return
        }

        setPhase('chat')
        setFollowUps([])
        setMessages((current) => [...current, { id: userId, role: 'user', text }])
        setTurn('generating')
        scrollToEnd()
        await sleep(GENERATE_HOLD_MS, signal)
        const beat = beatForUserTurn(userTurn, text)
        setTurn('streaming')
        setMessages((current) => [
          ...current,
          { id: assistantId, role: 'assistant', text: '', isStreaming: true },
        ])
        scrollToEnd()
        await streamText(assistantId, beat.assistantFull, signal)
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId ? { ...message, isStreaming: false } : message,
          ),
        )
        setTurn('awaitingUser')
        setFollowUps(beat.followUps)
        scrollToEnd()
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        throw error
      }
    },
    [
      busy,
      interactive,
      introDone,
      messages,
      phase,
      runPlanThinking,
      scrollToEnd,
      streamText,
      weeks.length,
    ],
  )

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const hiP = ramp(introT, HI_START, HI_END)
  const coachP = ramp(introT, COACH_START, COACH_END)
  const tip = ramp(introT, TIP_START, TIP_START + 0.136)
  const chrome = inChat ? 1 : ramp(introT, CHROME_START, CHROME_END)
  const hiText = introT >= HI_END ? PLAN_COACH_HI : typed(PLAN_COACH_HI, hiP)
  const coachText = introT >= COACH_END ? PLAN_COACH_SUB : typed(PLAN_COACH_SUB, coachP)

  const composerChips = inChat ? followUps : [...PLAN_COACH_MEET_CHIPS]
  const showChips =
    interactive &&
    !busy &&
    composerChips.length > 0 &&
    (inChat ? turn === 'awaitingUser' : chrome > 0.5 && introDone)

  const generating = turn === 'generating'
  const planThinking = turn === 'planThinking'
  const insertAt = Math.min(weeksAfter ?? messages.length, messages.length)
  const showWeeks = weeks.length > 0 && !planThinking

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    void sendMessage(draft)
  }

  const onDraftKey = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      void sendMessage(draft)
    }
  }

  return (
    <div className={`pg-pc-meet${compact ? ' is-compact' : ''}${inChat ? ' is-chat' : ''}`}>
      <div className="pg-pc-status">
        <span>9:41</span>
        <span>100%</span>
      </div>

      <header className="pg-pc-topbar" style={{ opacity: chrome, transform: `translateY(${12 * (1 - chrome)}px)` }}>
        <span className="pg-pc-topbar__back" aria-hidden="true">
          ←
        </span>
        <span className="pg-pc-topbar__brand">
          <SparkleStar size={18} looping={false} glints={false} />
          Premium
        </span>
        <span className="pg-pc-topbar__spacer" />
      </header>

      <div className="pg-pc-body" ref={scrollRef}>
        {inChat ? (
          <div className="pg-pc-transcript">
            {messages.slice(0, insertAt).map((message) => (
              <Bubble key={message.id} message={message} />
            ))}
            {showWeeks ? (
              <WeekCards
                weeks={weeks}
                expandedId={expandedWeek}
                onToggle={(id) => setExpandedWeek((current) => (current === id ? null : id))}
              />
            ) : null}
            {messages.slice(insertAt).map((message) => (
              <Bubble key={message.id} message={message} />
            ))}
            {generating ? <ThinkingBubble /> : null}
            {planThinking ? (
              <ThinkingBubble line={thinkingLine} opacity={thinkingOpacity} />
            ) : null}
          </div>
        ) : (
          <div className="pg-pc-hero">
            <SparkleStar size={compact ? 48 : 64} />
            <p className="pg-pc-hero__title" aria-hidden={introT < HI_START}>
              {hiText || '\u00a0'}
            </p>
            <p className="pg-pc-hero__title" aria-hidden={introT < COACH_START}>
              {coachText || '\u00a0'}
            </p>
            <p
              className="pg-pc-hero__tip"
              style={{ opacity: tip, transform: `translateY(${18 * (1 - tip)}px)` }}
            >
              {PLAN_COACH_TIP}
            </p>
          </div>
        )}
      </div>

      <form
        className="pg-pc-composer"
        style={{ opacity: chrome, transform: `translateY(${12 * (1 - chrome)}px)` }}
        onSubmit={onSubmit}
        aria-hidden={compact || undefined}
      >
        {showChips ? (
          <div className="pg-pc-chips" role="list">
            {composerChips.map((chip) => (
              <button
                key={chip}
                type="button"
                className={`pg-pc-chip${isPlanFeedback(chip) ? ' is-mood' : ''}`}
                onClick={() => void sendMessage(chip)}
                tabIndex={compact ? -1 : undefined}
              >
                {isPlanFeedback(chip) ? <MoodChip label={chip} /> : chip}
              </button>
            ))}
          </div>
        ) : (
          <div className="pg-pc-chips pg-pc-chips--slot" aria-hidden="true" />
        )}
        <div className="pg-pc-input">
          <input
            type="text"
            value={draft}
            disabled={!interactive || busy}
            readOnly={compact}
            placeholder="e.g. Lose 3 kg in 15 days"
            aria-label="Message Plan Coach"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onDraftKey}
            tabIndex={compact ? -1 : undefined}
          />
          <button
            type="submit"
            className="pg-pc-send"
            disabled={!interactive || busy}
            aria-label="Send"
            tabIndex={compact ? -1 : undefined}
          >
            ↑
          </button>
        </div>
      </form>
    </div>
  )
}

function Bubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return <p className="pg-pc-bubble pg-pc-bubble--user">{message.text}</p>
  }
  return (
    <div className="pg-pc-bubble pg-pc-bubble--ai">
      <p className="pg-pc-label">Plan Coach</p>
      <p className="pg-pc-bubble__text">{message.text || '…'}</p>
    </div>
  )
}

function ThinkingBubble({ line, opacity = 0 }: { line?: string | null; opacity?: number }) {
  const gradId = useId()
  return (
    <div className="pg-pc-bubble pg-pc-bubble--ai pg-pc-bubble--think">
      <div className="pg-pc-think-row">
        <span className="pg-pc-label is-shimmer">Plan Coach</span>
        <SparkleStar size={14} />
      </div>
      {line ? (
        <p className="pg-pc-think-line" style={{ opacity }}>
          {line}
        </p>
      ) : null}
      <svg width="0" height="0" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} />
        </defs>
      </svg>
    </div>
  )
}

function MoodChip({ label }: { label: string }) {
  const like = label.includes('☺')
  const emoji = like ? '☺' : '☹'
  const text = label.replace(emoji, '').trim()
  return (
    <span className={`pg-pc-mood${like ? ' is-like' : ' is-dislike'}`}>
      <span>{emoji}</span>
      {text}
    </span>
  )
}

function WeekCards({
  weeks,
  expandedId,
  onToggle,
}: {
  weeks: WeekPlan[]
  expandedId: string | null
  onToggle: (id: string) => void
}) {
  return (
    <div className="pg-pc-weeks">
      <p className="pg-pc-weeks__title">Your 15-day plan</p>
      {weeks.map((week) => {
        const expanded = expandedId === week.id
        return (
          <button
            key={week.id}
            type="button"
            className={`pg-pc-week${expanded ? ' is-open' : ''}`}
            onClick={() => onToggle(week.id)}
          >
            <span className="pg-pc-week__head">
              <span className="pg-pc-week__mark">✦</span>
              <span className="pg-pc-week__copy">
                <strong>{week.title}</strong>
                <span>
                  {week.dayRange} · {week.sessions} sessions
                </span>
                <em>{week.summary}</em>
              </span>
              <span className="pg-pc-week__chevron">›</span>
            </span>
            {expanded ? (
              <span className="pg-pc-week__body">
                {week.days.map((day) => (
                  <span key={day.label} className="pg-pc-day">
                    <strong>{day.label}</strong>
                    <span>{day.focus}</span>
                    <span className="pg-pc-day__dur">{day.duration}</span>
                    {day.moves.map((move) => (
                      <span key={move} className="pg-pc-day__move">
                        {move}
                      </span>
                    ))}
                    {day.note ? <span className="pg-pc-day__note">{day.note}</span> : null}
                  </span>
                ))}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
