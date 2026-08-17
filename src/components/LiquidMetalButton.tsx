import { useRef, useState, type ReactNode } from 'react'
import { useLiquidMetalLight } from '../hooks/useLiquidMetalLight'

type Props = {
  children: ReactNode
  className?: string
  /** parent stage provides --lg-* variables */
  inheritLight?: boolean
}

function EdgeRim() {
  return (
    <>
      <span className="home-tab-edge-inner home-tab-edge--bright" aria-hidden="true" />
      <span className="home-tab-edge-rim home-tab-edge--bright" aria-hidden="true" />
    </>
  )
}

export function LiquidMetalButton({ children, className, inheritLight = false }: Props) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const [hovered, setHovered] = useState(false)

  useLiquidMetalLight(btnRef, inheritLight ? false : hovered)

  return (
    <button
      ref={btnRef}
      type="button"
      className={`lm-btn${inheritLight ? ' lm-btn-inherit' : ''}${className ? ` ${className}` : ''}`}
      onPointerEnter={() => !inheritLight && setHovered(true)}
      onPointerLeave={() => !inheritLight && setHovered(false)}
      onFocus={() => !inheritLight && setHovered(true)}
      onBlur={() => !inheritLight && setHovered(false)}
    >
      <span className="lm-btn-rim" aria-hidden="true">
        <EdgeRim />
      </span>
      <span className="lm-btn-label">{children}</span>
    </button>
  )
}
