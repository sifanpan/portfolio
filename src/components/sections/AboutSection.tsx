import { SectionHeading } from '../SectionHeading'

type Props = {
  cardLayout?: boolean
}

const highlights = [
  'Product design for conversion, engagement, and in-app education',
  'Comfortable with AI-assisted prototyping and design–engineering handoff',
  'Background in structured case storytelling and measurable impact',
] as const

export function AboutSection({ cardLayout = false }: Props) {
  return (
    <section
      aria-labelledby="about-heading"
      id="about"
      className={
        cardLayout
          ? 'open-home-card scroll-mt-24'
          : 'px-5 py-16 sm:px-8 sm:py-24'
      }
    >
      <div
        className={
          cardLayout
            ? 'grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12'
            : 'mx-auto grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-16'
        }
      >
        <div
          className="open-card flex aspect-[4/5] max-w-sm items-center justify-center text-sm text-ink-muted"
          aria-label="Portrait placeholder"
        >
          Portrait / photo
          <br />
          public/portfolio/about/
        </div>
        <div>
          {!cardLayout && (
            <SectionHeading
              eyebrow="03 — About me"
              title="About"
              subtitle="I'm Sifan Pan, a product designer focused on growth, conversion, and making complex features easy to adopt."
            />
          )}
          <p className={`open-desc text-base leading-relaxed text-ink${cardLayout ? '' : ' mt-6'}`}>
            I connect business goals, user behavior, and product capabilities in one narrative—from
            campaigns and membership to high-visibility surfaces and onboarding.
            This v2 site splits <strong className="font-medium text-ink">AI Playground</strong>,{' '}
            <strong className="font-medium text-ink">Works</strong>, and About into three sections
            so you can quickly explore experiments and case studies.
          </p>
          <ul className="mt-8 space-y-3">
            {highlights.map((line) => (
              <li key={line} className="open-desc flex gap-3 text-sm leading-relaxed text-ink">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
          <div id="contact" className="mt-10 flex flex-wrap gap-3 scroll-mt-20">
            <a
              href="mailto:hello@example.com"
              className="inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Contact me
            </a>
            <a
              href="https://github.com/sifanpan"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full border border-white/10 bg-surface px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-white/20"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
