import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import type { CSSProperties } from 'react'

export type HomeTab = 'work' | 'playground'

const tabs: { id: HomeTab; label: string; icon: 'folder' | 'grid' }[] = [
  { id: 'work', label: 'Work', icon: 'folder' },
  { id: 'playground', label: 'Playground', icon: 'grid' },
]

function TabIcon({ name }: { name: (typeof tabs)[number]['icon'] }) {
  const stroke = 'currentColor'

  if (name === 'folder') {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <path
          d="M2.25 5.25h4.1l1.35 1.35h7.95a1.5 1.5 0 0 1 1.5 1.5v6.6a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5V6.75a1.5 1.5 0 0 1 1.5-1.5Z"
          stroke={stroke}
          strokeWidth="1.35"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (name === 'grid') {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
        <rect x="3" y="3" width="5" height="5" rx="1" stroke={stroke} strokeWidth="1.35" />
        <rect x="10" y="3" width="5" height="5" rx="1" stroke={stroke} strokeWidth="1.35" />
        <rect x="3" y="10" width="5" height="5" rx="1" stroke={stroke} strokeWidth="1.35" />
        <rect x="10" y="10" width="5" height="5" rx="1" stroke={stroke} strokeWidth="1.35" />
      </svg>
    )
  }

  return null
}

/** outer edge highlight + inner vignette (slightly brighter on mouse side) */
function EdgeRim({ bright = false }: { bright?: boolean }) {
  const mod = bright ? ' home-tab-edge--bright' : ''
  return (
    <>
      <span className={`home-tab-edge-inner${mod}`} aria-hidden="true" />
      <span className={`home-tab-edge-rim${mod}`} aria-hidden="true" />
    </>
  )
}

type Indicator = {
  left: number
  width: number
  ready: boolean
}

const orientationRad = (x: number, y: number) => Math.atan2(x - 50, -(y - 50))

/** elliptical spot along border tangent: brightest at center, symmetric falloff */
const buildSpotGradient = (
  gx: number,
  gy: number,
  bright: boolean,
  major: number,
  minor: number,
) => {
  const peakRad = orientationRad(gx, gy)
  const absTx = Math.abs(Math.cos(peakRad))
  const absTy = Math.abs(Math.sin(peakRad))
  const w = (absTx * major + absTy * minor).toFixed(1)
  const h = (absTy * major + absTx * minor).toFixed(1)

  const stops = bright
    ? 'rgba(255,255,255,1) 0%, rgba(255,255,255,0.62) 24%, rgba(255,255,255,0.18) 48%, rgba(255,255,255,0.04) 62%, transparent 76%'
    : 'rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.55) 24%, rgba(255,255,255,0.16) 48%, rgba(255,255,255,0.03) 62%, transparent 76%'

  return `radial-gradient(ellipse ${w}% ${h}% at ${gx.toFixed(2)}% ${gy.toFixed(2)}%, ${stops})`
}

const buildRimGradient = (gx: number, gy: number) => buildSpotGradient(gx, gy, true, 56, 15)

const buildInnerSpot = (mx: number, my: number) => {
  const peakRad = orientationRad(mx, my)
  const absNx = Math.abs(Math.sin(peakRad))
  const absNy = Math.abs(Math.cos(peakRad))
  const w = (absNx * 48 + absNy * 26).toFixed(1)
  const h = (absNy * 48 + absNx * 26).toFixed(1)
  const stops =
    'rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.08) 32%, rgba(255,255,255,0.02) 56%, transparent 74%'
  return `radial-gradient(ellipse ${w}% ${h}% at ${mx.toFixed(2)}% ${my.toFixed(2)}%, ${stops})`
}

/** peak anchor → button center; peak brightest, center darkest */
const buildPeakToCenterBeam = (gx: number, gy: number) => {
  const toCenterX = 50 - gx
  const toCenterY = 50 - gy
  const dist = Math.hypot(toCenterX, toCenterY)
  if (dist < 0.5) {
    return 'radial-gradient(ellipse 50% 50% at 50% 50%, transparent 0%, transparent 100%)'
  }

  const dirRad = Math.atan2(toCenterY, toCenterX)
  const absNx = Math.abs(Math.cos(dirRad))
  const absNy = Math.abs(Math.sin(dirRad))
  const major = Math.min(dist * 2.55, 100)
  const minor = 42
  const w = (absNx * major + absNy * minor).toFixed(1)
  const h = (absNy * major + absNx * minor).toFixed(1)
  const centerPct = Math.min(85, Math.round((dist / major) * 100))
  const midPct = Math.round(centerPct * 0.38)

  return (
    `radial-gradient(ellipse ${w}% ${h}% at ${gx.toFixed(2)}% ${gy.toFixed(2)}%, ` +
    `rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.2) ${midPct}%, ` +
    `rgba(255,255,255,0.06) ${centerPct}%, rgba(0,0,0,0.32) ${Math.min(centerPct + 8, 92)}%, transparent ${Math.min(centerPct + 26, 100)}%)`
  )
}

/**
 * Track light only on the active tab; dim and freeze angle when hovering other tabs.
 */
function useEdgeLight(
  trackRef: RefObject<HTMLDivElement | null>,
  indicatorRef: RefObject<HTMLDivElement | null>,
  tabRefs: RefObject<(HTMLButtonElement | null)[]>,
  active: HomeTab,
  indicator: Indicator,
  lastPointerRef: RefObject<{ x: number; y: number } | null>,
) {
  const updateLightRef = useRef<(x: number, y: number) => void>(() => {})

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (reduced || !finePointer) return

    let targetProx = 0
    let targetGlowX = 50
    let targetGlowY = 50
    let targetMidX = 50
    let targetMidY = 50
    let currentProx = 0
    let currentGlowX = 50
    let currentGlowY = 50
    let currentMidX = 50
    let currentMidY = 50
    let tracking = false
    let raf = 0

    const activeBtn = () => {
      const index = tabs.findIndex((t) => t.id === active)
      return tabRefs.current[index] ?? null
    }

    const isOverInactiveTab = (x: number, y: number, btn: HTMLButtonElement) => {
      for (const tab of tabRefs.current) {
        if (!tab || tab === btn) continue
        const r = tab.getBoundingClientRect()
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return true
      }
      return false
    }

    const lightRect = (btn: HTMLButtonElement) => {
      const ind = indicatorRef.current
      if (ind) {
        const r = ind.getBoundingClientRect()
        if (r.width > 1 && r.height > 1) return r
      }
      return btn.getBoundingClientRect()
    }

    const apply = (prox: number, gx: number, gy: number, midX: number, midY: number) => {
      const angle = orientationRad(gx, gy) * (180 / Math.PI)
      track.style.setProperty('--lg-angle', `${angle}deg`)
      track.style.setProperty('--lg-prox', prox.toFixed(3))
      track.style.setProperty('--lg-glow-x', `${gx.toFixed(2)}%`)
      track.style.setProperty('--lg-glow-y', `${gy.toFixed(2)}%`)
      track.style.setProperty('--lg-mid-x', `${midX.toFixed(2)}%`)
      track.style.setProperty('--lg-mid-y', `${midY.toFixed(2)}%`)
      track.style.setProperty('--lg-rim-gradient', buildRimGradient(gx, gy))
      track.style.setProperty('--lg-inner-spot', buildInnerSpot(midX, midY))
      track.style.setProperty('--lg-inner-beam', buildPeakToCenterBeam(gx, gy))
    }

    /** center → mouse direction, intersect pill ellipse → percentage (no angle jump) */
    const edgeGlowFromMouse = (rect: DOMRect, x: number, y: number) => {
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = x - cx
      const dy = y - cy
      if (dx === 0 && dy === 0) {
        return { gx: 50, gy: 0, midX: 50, midY: 0 }
      }

      const rx = rect.width / 2
      const ry = rect.height / 2
      const t = 1 / Math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2)
      const gx = ((cx + dx * t - rect.left) / rect.width) * 100
      const gy = ((cy + dy * t - rect.top) / rect.height) * 100
      const midX = 50 + (gx - 50) * 0.52
      const midY = 50 + (gy - 50) * 0.52
      return { gx, gy, midX, midY }
    }

    const tick = () => {
      if (tracking) {
        currentGlowX += (targetGlowX - currentGlowX) * 0.13
        currentGlowY += (targetGlowY - currentGlowY) * 0.13
        currentMidX += (targetMidX - currentMidX) * 0.13
        currentMidY += (targetMidY - currentMidY) * 0.13
      }
      currentProx += (targetProx - currentProx) * 0.13
      apply(currentProx, currentGlowX, currentGlowY, currentMidX, currentMidY)
      raf = requestAnimationFrame(tick)
    }

    const updateLight = (x: number, y: number) => {
      lastPointerRef.current = { x, y }

      const btn = activeBtn()
      if (!btn) return

      if (isOverInactiveTab(x, y, btn)) {
        tracking = false
        targetProx = 0
        return
      }

      const rect = lightRect(btn)
      const glow = edgeGlowFromMouse(rect, x, y)

      tracking = true
      targetGlowX = glow.gx
      targetGlowY = glow.gy
      targetMidX = glow.midX
      targetMidY = glow.midY

      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dist = Math.hypot(x - cx, y - cy)
      const radius = Math.hypot(rect.width, rect.height) / 2
      const orbit = 120
      targetProx = Math.min(1, Math.max(0, 1.05 - Math.max(0, dist - radius * 0.82) / orbit))
    }

    updateLightRef.current = updateLight

    const onPointer = (e: PointerEvent) => {
      updateLight(e.clientX, e.clientY)
    }

    apply(currentProx, currentGlowX, currentGlowY, currentMidX, currentMidY)
    raf = requestAnimationFrame(tick)
    window.addEventListener('pointermove', onPointer, { passive: true })
    track.addEventListener('pointerenter', onPointer, { passive: true })
    track.addEventListener('pointerover', onPointer, { passive: true })

    if (lastPointerRef.current) {
      updateLight(lastPointerRef.current.x, lastPointerRef.current.y)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointer)
      track.removeEventListener('pointerenter', onPointer)
      track.removeEventListener('pointerover', onPointer)
      updateLightRef.current = () => {}
    }
  }, [trackRef, indicatorRef, tabRefs, active, lastPointerRef])

  useLayoutEffect(() => {
    if (!indicator.ready || indicator.width <= 0) return

    const track = trackRef.current
    const last = lastPointerRef.current

    if (last) {
      updateLightRef.current(last.x, last.y)
      return
    }

    // after refresh, mouse may already be on tab without pointermove — sample via :hover
    if (track?.matches(':hover')) {
      const index = tabs.findIndex((t) => t.id === active)
      const btn = tabRefs.current[index]
      if (btn) {
        const r = btn.getBoundingClientRect()
        updateLightRef.current(r.left + r.width / 2, r.top + r.height / 2)
      }
    }
  }, [indicator.ready, indicator.width, indicator.left, active, lastPointerRef, trackRef, tabRefs])
}

type Props = {
  active: HomeTab
  onChange: (tab: HomeTab) => void
  className?: string
  style?: CSSProperties
}

export function HomeTabs({ active, onChange, className, style }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null)
  const [indicator, setIndicator] = useState<Indicator>({ left: 0, width: 0, ready: false })

  useEdgeLight(trackRef, indicatorRef, tabRefs, active, indicator, lastPointerRef)

  const syncIndicator = useCallback(() => {
    const track = trackRef.current
    const index = tabs.findIndex((t) => t.id === active)
    const btn = tabRefs.current[index]
    if (!track || !btn) return

    const trackRect = track.getBoundingClientRect()
    const btnRect = btn.getBoundingClientRect()
    setIndicator({
      left: btnRect.left - trackRect.left,
      width: btnRect.width,
      ready: true,
    })
  }, [active])

  useLayoutEffect(() => {
    let raf = 0
    const measure = () => {
      raf = requestAnimationFrame(() => syncIndicator())
    }

    measure()
    const afterReveal = window.setTimeout(syncIndicator, 1200)

    const track = trackRef.current
    if (!track) {
      return () => {
        cancelAnimationFrame(raf)
        window.clearTimeout(afterReveal)
      }
    }

    const ro = new ResizeObserver(measure)
    ro.observe(track)
    window.addEventListener('resize', measure)

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(afterReveal)
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [syncIndicator])

  return (
    <nav
      className={`home-tabs${className ? ` ${className}` : ''}`}
      style={style}
      aria-label="Sections"
    >
      <div className="home-tabs-track" ref={trackRef} role="tablist">
        <div
          ref={indicatorRef}
          className={`home-tabs-indicator${indicator.ready ? ' is-ready' : ''}`}
          style={{
            width: indicator.width,
            transform: `translateX(${indicator.left}px)`,
          }}
          aria-hidden="true"
        >
          <EdgeRim bright />
        </div>

        {tabs.map((tab, i) => {
          const isActive = active === tab.id

          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[i] = el
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`home-tab${isActive ? ' home-tab-active' : ''}`}
              onClick={() => onChange(tab.id)}
            >
              <span className="home-tab-inner">
                <TabIcon name={tab.icon} />
                <span>{tab.label}</span>
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
