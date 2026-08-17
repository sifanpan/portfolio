import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import type { PlaygroundItem } from '../../data/playground'
import { PlanCoachMeet } from './planCoach/PlanCoachMeet'
import './pg-plan-coach.css'

type BentoProps = {
  item: PlaygroundItem
  style?: CSSProperties
}

function PlanCoachLightbox({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div className="pg-pc-lightbox" role="dialog" aria-modal="true" aria-label="Plan Coach" onClick={onClose}>
      <div className="pg-pc-lightbox__phone" onClick={(event) => event.stopPropagation()}>
        <PlanCoachMeet interactive />
      </div>
      <button type="button" className="pg-pc-lightbox__dismiss" onClick={onClose} aria-label="Close">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="m3 3 10 10M13 3 3 13" strokeLinecap="round" />
        </svg>
      </button>
    </div>,
    document.body,
  )
}

export function PlanCoachBento({ item, style }: BentoProps) {
  const [open, setOpen] = useState(false)
  const openPanel = useCallback(() => setOpen(true), [])
  const close = useCallback(() => setOpen(false), [])

  return (
    <>
      <article
        className="pg-bento pg-bento--demo pg-bento--plan-coach pg-pc-bento-tile"
        data-pg={item.id}
        style={style}
        aria-label={item.title}
      >
        <div className="pg-stage pg-pc-bento" aria-hidden="true">
          <PlanCoachMeet compact />
        </div>
        <button
          type="button"
          className="pg-pc-bento-hit"
          onClick={openPanel}
          aria-label={`Open ${item.title} prototype`}
        />
        <span className="pg-bento-label" aria-hidden="true">
          {item.title}
        </span>
      </article>
      {open && typeof document !== 'undefined' ? <PlanCoachLightbox onClose={close} /> : null}
    </>
  )
}
