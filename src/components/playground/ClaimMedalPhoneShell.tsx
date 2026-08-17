import type { MouseEvent, ReactNode } from 'react'
import { ClaimMedalProtoCloseIcon } from './ClaimMedalProtoCloseIcon'

export type ClaimMedalCtaVariant = 'locked' | 'active' | 'share'
export type ClaimMedalSceneMode = 'interactive' | 'static' | 'showcase'

type Props = {
  scene: ReactNode
  sceneMode?: ClaimMedalSceneMode
  ctaLabel: string
  ctaVariant: ClaimMedalCtaVariant
  ctaInteractive?: boolean
  onCtaClick?: () => void
  onSceneMouseMove?: (e: MouseEvent<HTMLDivElement>) => void
}

/** Figma 652:3 — single phone frame + popup chrome */
export function ClaimMedalPhoneShell({
  scene,
  sceneMode = 'static',
  ctaLabel,
  ctaVariant,
  ctaInteractive = false,
  onCtaClick,
  onSceneMouseMove,
}: Props) {
  const ctaClass =
    ctaVariant === 'share'
      ? ' is-active is-unlocked is-display'
      : ctaVariant === 'active'
        ? ' is-active'
        : ''

  return (
    <div className="pg-medal-mockup-device">
      <div
        className="pg-medal-figma-popup"
        data-scene={sceneMode}
        onMouseMove={sceneMode === 'interactive' ? onSceneMouseMove : undefined}
      >
        <div className="pg-medal-figma-scene">{scene}</div>

        <span className="pg-medal-figma-close" aria-hidden="true">
          <ClaimMedalProtoCloseIcon />
        </span>

        <h2 className="pg-medal-figma-title">
          World Cycling Day
          <br />
          2026
        </h2>

        <p className="pg-medal-figma-sub">Two Wheels, Wild Encounters.</p>

        <div className="pg-medal-figma-footer">
          <button
            type="button"
            className={`pg-medal-figma-cta${ctaClass}`}
            onClick={ctaInteractive ? onCtaClick : undefined}
            disabled={!ctaInteractive}
            tabIndex={ctaInteractive ? 0 : -1}
            aria-disabled={!ctaInteractive}
          >
            <span className="pg-medal-figma-cta__label">{ctaLabel}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
