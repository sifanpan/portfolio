import { useCallback, useEffect, useRef, useState } from 'react'
import { TypewriterText } from './TypewriterText'

/** pause after ": )" appears, then start fade */
const PAUSE_BEFORE_FADE_MS = 1_000
/** other text opacity fade (1.5s), matches index.css --typing-other-fade */
const OTHER_FADE_MS = 1_500
/** sifan pull-apart + side fade (3s), matches index.css --typing-pull-fade */
const PULL_FADE_DURATION_MS = 3_000

const KEEP_TEXT = 'sifan'
const KEEP_PREFIX = 'Hi, i am '

const SEGMENTS = [
  { text: `${KEEP_PREFIX}${KEEP_TEXT}`, pauseBefore: 1000 },
  { text: 'Nice to meet you' },
  { text: ' : )', pauseBefore: 2000, joinPrevious: true },
]

const A11Y_TEXT = 'Hi, i am sifan Nice to meet you : )'

type Props = {
  onTransferStart?: () => void
  onContentReveal?: () => void
  onIntroComplete?: () => void
}

export function HeroTyping({ onTransferStart, onContentReveal, onIntroComplete }: Props) {
  const [typingDone, setTypingDone] = useState(false)
  const [fading, setFading] = useState(false)
  const [inverted, setInverted] = useState(false)
  const [pullKeep, setPullKeep] = useState(false)

  const fadeTimerRef = useRef(0)
  const pullTimerRef = useRef(0)
  const completeTimerRef = useRef(0)

  useEffect(
    () => () => {
      window.clearTimeout(fadeTimerRef.current)
      window.clearTimeout(pullTimerRef.current)
      window.clearTimeout(completeTimerRef.current)
    },
    [],
  )

  const handleComplete = useCallback(() => {
    requestAnimationFrame(() => {
      setTypingDone(true)
      fadeTimerRef.current = window.setTimeout(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setInverted(true)
            setFading(true)
          })
        })

        pullTimerRef.current = window.setTimeout(
          () => setPullKeep(true),
          OTHER_FADE_MS,
        )

        const pullFadeEndMs = OTHER_FADE_MS + PULL_FADE_DURATION_MS

        completeTimerRef.current = window.setTimeout(() => {
          onTransferStart?.()
          onContentReveal?.()
          onIntroComplete?.()
        }, pullFadeEndMs)
      }, PAUSE_BEFORE_FADE_MS)
    })
  }, [onContentReveal, onIntroComplete, onTransferStart])

  return (
    <div className="typing-overlay" aria-label="Typing intro">
      <div
        className={`typing-canvas min-h-svh w-full${inverted ? ' typing-canvas-inverted' : ''}${fading ? ' typing-canvas-fading' : ''}`}
      >
        <TypewriterText
          segments={SEGMENTS}
          onComplete={handleComplete}
          keepText={KEEP_TEXT}
          keepPrefix={KEEP_PREFIX}
          hideCursor={typingDone}
          pullKeep={pullKeep}
        />
        <span className="sr-only">{A11Y_TEXT}</span>
      </div>
    </div>
  )
}
