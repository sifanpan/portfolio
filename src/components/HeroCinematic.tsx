import { CinematicLetters, cinematicEndTime } from './CinematicLetters'

const SIFAN = 'sifan'

/** Open-style intro: reveal Sifan letter by letter, then tagline */
const fullNameEnd = cinematicEndTime(SIFAN.length)
const taglineDelay = fullNameEnd + 0.35
const subtitleDelay = taglineDelay + 1.0

export function HeroCinematic() {
  return (
    <section
      className="relative flex min-h-svh flex-col items-center justify-center px-5 pb-24 pt-20 sm:px-8"
      aria-label="Introduction"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_45%,rgba(212,132,106,0.14),transparent_65%)]"
        aria-hidden
      />

      <div className="relative z-10 text-center">
        <h1 className="open-display text-[clamp(2rem,6.5vw,3.75rem)] font-medium leading-none text-ink">
          <span
            className="hero-name-track inline-block"
            style={{ animationDuration: `${fullNameEnd}s` }}
            aria-hidden="true"
          >
            <CinematicLetters text={SIFAN} />
          </span>
          <span className="sr-only">sifan</span>
        </h1>

        <p
          className="hero-line open-section-label mt-10 text-ink-subtle"
          style={{ animationDelay: `${taglineDelay}s` }}
        >
          Product Designer
        </p>

        <p
          className="hero-line open-desc mx-auto mt-8 max-w-md text-sm leading-relaxed text-ink sm:text-base"
          style={{ animationDelay: `${subtitleDelay}s` }}
        >
          Enter a space for growth, conversion, and clarity — through design.
        </p>
      </div>
    </section>
  )
}
