import { useEffect, useRef, type RefObject } from 'react'
import { applyLiquidMetalVars, edgeGlowFromPointer } from '../lib/liquidMetalLight'

/** track pointer on hover; prox eases back to 0 on leave */
export function useLiquidMetalLight(
  surfaceRef: RefObject<HTMLElement | null>,
  active: boolean,
) {
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const surface = surfaceRef.current
    if (!surface) return

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

    const apply = (prox: number, gx: number, gy: number, midX: number, midY: number) => {
      applyLiquidMetalVars(surface, prox, gx, gy, midX, midY)
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
      const rect = surface.getBoundingClientRect()
      const glow = edgeGlowFromPointer(rect, x, y)

      tracking = true
      targetGlowX = glow.gx
      targetGlowY = glow.gy
      targetMidX = glow.midX
      targetMidY = glow.midY
      targetProx = active ? 1 : 0
    }

    targetProx = active ? 1 : 0
    if (!active) tracking = false

    if (active && lastPointerRef.current) {
      updateLight(lastPointerRef.current.x, lastPointerRef.current.y)
    }

    const onPointer = (e: PointerEvent) => {
      if (!active) return
      updateLight(e.clientX, e.clientY)
    }

    apply(currentProx, currentGlowX, currentGlowY, currentMidX, currentMidY)
    raf = requestAnimationFrame(tick)
    window.addEventListener('pointermove', onPointer, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointer)
    }
  }, [surfaceRef, active])
}
