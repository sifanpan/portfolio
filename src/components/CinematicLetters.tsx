type Props = {
  text: string
  /** global start delay (seconds) */
  baseDelay?: number
  /** letter index offset after prior text, for continuous stagger */
  letterOffset?: number
  className?: string
}

const STAGGER_S = 0.16
const CHAR_DURATION_S = 1.15

export function cinematicEndTime(
  charCount: number,
  baseDelay = 0,
  letterOffset = 0,
): number {
  const lastIndex = letterOffset + Math.max(0, charCount - 1)
  return baseDelay + lastIndex * STAGGER_S + CHAR_DURATION_S
}

export function CinematicLetters({
  text,
  baseDelay = 0,
  letterOffset = 0,
  className = '',
}: Props) {
  return (
    <span className={className}>
      {text.split('').map((char, i) => (
        <span
          key={`${letterOffset + i}-${char}`}
          className="hero-char"
          style={{
            animationDelay: `${baseDelay + (letterOffset + i) * STAGGER_S}s`,
          }}
          aria-hidden
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  )
}
