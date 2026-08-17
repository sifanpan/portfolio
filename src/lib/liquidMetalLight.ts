export const orientationRad = (x: number, y: number) => Math.atan2(x - 50, -(y - 50))

export const buildSpotGradient = (
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

export const buildRimGradient = (gx: number, gy: number) => buildSpotGradient(gx, gy, true, 56, 15)

export const buildInnerSpot = (mx: number, my: number) => {
  const peakRad = orientationRad(mx, my)
  const absNx = Math.abs(Math.sin(peakRad))
  const absNy = Math.abs(Math.cos(peakRad))
  const w = (absNx * 48 + absNy * 26).toFixed(1)
  const h = (absNy * 48 + absNx * 26).toFixed(1)
  const stops =
    'rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.08) 32%, rgba(255,255,255,0.02) 56%, transparent 74%'
  return `radial-gradient(ellipse ${w}% ${h}% at ${mx.toFixed(2)}% ${my.toFixed(2)}%, ${stops})`
}

export const buildPeakToCenterBeam = (gx: number, gy: number) => {
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

/** center → pointer direction, intersect pill ellipse → percentage */
export const edgeGlowFromPointer = (rect: DOMRect, x: number, y: number) => {
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

export const applyLiquidMetalVars = (
  el: HTMLElement,
  prox: number,
  gx: number,
  gy: number,
  midX: number,
  midY: number,
) => {
  const angle = orientationRad(gx, gy) * (180 / Math.PI)
  el.style.setProperty('--lg-angle', `${angle}deg`)
  el.style.setProperty('--lg-prox', prox.toFixed(3))
  el.style.setProperty('--lg-glow-x', `${gx.toFixed(2)}%`)
  el.style.setProperty('--lg-glow-y', `${gy.toFixed(2)}%`)
  el.style.setProperty('--lg-mid-x', `${midX.toFixed(2)}%`)
  el.style.setProperty('--lg-mid-y', `${midY.toFixed(2)}%`)
  el.style.setProperty('--lg-rim-gradient', buildRimGradient(gx, gy))
  el.style.setProperty('--lg-inner-spot', buildInnerSpot(midX, midY))
  el.style.setProperty('--lg-inner-beam', buildPeakToCenterBeam(gx, gy))

  const ux = (gx - 50) / 50
  const uy = (gy - 50) / 50
  const len = Math.hypot(ux, uy) || 1
  const sh = 4 + prox * 3
  el.style.setProperty('--lg-shadow-x', `${((-ux / len) * sh).toFixed(2)}px`)
  el.style.setProperty('--lg-shadow-y', `${((-uy / len) * sh).toFixed(2)}px`)
}
