type Props = {
  minimal?: boolean
  showNav?: boolean
  className?: string
  style?: React.CSSProperties
}

export function Footer({ minimal = false, showNav = true, className, style }: Props) {
  return (
    <footer
      className={
        minimal
          ? `px-5 py-10 sm:px-8${className ? ` ${className}` : ''}`
          : `border-t border-white/5 px-5 py-8 sm:px-8${className ? ` ${className}` : ''}`
      }
      style={style}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-muted">© {new Date().getFullYear()} Sifan Pan · sifanpan.github.io/portfolio</p>
        {showNav ? (
          <p className="text-sm text-ink-muted">
            <a href="#playground" className="hover:text-ink">
              Playground
            </a>
            {' · '}
            <a href="#works" className="hover:text-ink">
              Works
            </a>
            {' · '}
            <a href="#about" className="hover:text-ink">
              About
            </a>
          </p>
        ) : null}
      </div>
    </footer>
  )
}
