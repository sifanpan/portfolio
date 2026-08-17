import type { CSSProperties } from 'react'

const BRAND = 'sifan'

const nav = [
  { label: 'AI Playground', href: '#playground' },
  { label: 'Works', href: '#works' },
  { label: 'About', href: '#about' },
] as const

type Props = {
  /** centered header sifan, letter-spacing matches hero expand */
  brandHero?: boolean
  /** undefined = normal; false = pending drop; true = letters drop in one by one */
  brandReveal?: boolean
  showNav?: boolean
  className?: string
  style?: CSSProperties
}

export function SiteHeader({
  brandHero = false,
  brandReveal,
  showNav = true,
  className,
  style,
}: Props) {
  const useCharBrand = brandHero || brandReveal !== undefined
  const brandBase = useCharBrand ? 'site-header-brand-hero' : 'site-header-brand-default'
  const centered = brandHero || brandReveal !== undefined || !showNav

  return (
    <header
      className={`fixed top-0 z-[100] w-full border-b border-white/5 bg-canvas/40 backdrop-blur-md${className ? ` ${className}` : ''}`}
      style={style}
    >
      <div
        className={`relative mx-auto flex h-14 max-w-5xl items-center px-5 sm:px-8${
          centered ? ' site-header-inner--centered justify-center' : ' justify-between'
        }`}
      >
        <a href="#" className={`site-header-brand ${brandBase}`.trim()}>
          {useCharBrand ? (
            <span
              className={`site-header-brand-track${
                brandReveal ? ' site-header-brand-track-reveal' : ''
              }`}
            >
              {BRAND.split('').map((ch, i) => (
                <span
                  key={`${ch}-${i}`}
                  className={`site-header-brand-char${
                    brandReveal ? '' : ' site-header-brand-char-pending'
                  }`}
                  style={{ '--char-i': i } as CSSProperties}
                >
                  {ch}
                </span>
              ))}
            </span>
          ) : (
            BRAND
          )}
        </a>
        {showNav ? (
          <nav
            className="absolute right-5 flex items-center gap-4 sm:right-8 sm:gap-6"
            aria-label="Primary"
          >
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-xs font-medium text-ink-subtle transition-colors hover:text-ink sm:text-sm"
              >
                {item.label}
              </a>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  )
}
