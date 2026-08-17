import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { publicUrl } from '../../publicUrl'
import { ClaimMedalMockupBoard } from './ClaimMedalMockupBoard'

const BENTO_COVER = '/playground/medal/bento1.png'

/** Bento: static cover; click opens Figma 652:44 three-screen mockup board */
export function ClaimMedalDemo() {
  const [open, setOpen] = useState(false)

  const close = useCallback(() => setOpen(false), [])
  const openMockup = useCallback(() => setOpen(true), [])

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  const mockupPage =
    open && typeof document !== 'undefined' ? (
      <div
        className="pg-medal-mockup-page"
        role="dialog"
        aria-modal="true"
        aria-label="Claim Medal interactive mockup"
        onClick={close}
      >
        <div className="pg-medal-mockup-page__bg" aria-hidden="true">
          <div className="pg-medal-mockup-page__bg-base" />
          <div className="pg-medal-mockup-page__bg-flow">
            <span className="pg-medal-mockup-page__blob pg-medal-mockup-page__blob--1" />
            <span className="pg-medal-mockup-page__blob pg-medal-mockup-page__blob--2" />
            <span className="pg-medal-mockup-page__blob pg-medal-mockup-page__blob--3" />
            <span className="pg-medal-mockup-page__blob pg-medal-mockup-page__blob--4" />
          </div>
        </div>

        <div className="pg-medal-mockup-page__content" onClick={(e) => e.stopPropagation()}>
          <ClaimMedalMockupBoard />
        </div>

        <button type="button" className="pg-medal-mockup-page__dismiss" onClick={close} aria-label="Close mockup">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="m3 3 10 10M13 3 3 13" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    ) : null

  return (
    <>
      <button
        type="button"
        className="pg-stage pg-medal-stage pg-medal-bento pg-medal-bento-cover"
        onClick={openMockup}
        aria-label="Open Claim Medal interactive mockup"
      >
        <img
          className="pg-medal-bento-cover__img"
          src={publicUrl(BENTO_COVER)}
          alt=""
          draggable={false}
        />
      </button>

      {mockupPage ? createPortal(mockupPage, document.body) : null}
    </>
  )
}
