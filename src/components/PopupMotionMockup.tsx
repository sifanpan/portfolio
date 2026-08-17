import { publicUrl } from '../publicUrl'

type Props = {
  base: string
  popup: string
  /** popup height as fraction of screen (0–1) */
  popupHeightRatio: number
  alt: string
  rev?: string
  delay?: number
}

export function PopupMotionMockup({ base, popup, popupHeightRatio, alt, rev, delay = 0 }: Props) {
  const q = rev ? `?v=${encodeURIComponent(rev)}` : ''
  const popupHeight = `${popupHeightRatio * 100}%`
  const motionStyle = { animationDelay: `${delay}s` } as const

  return (
    <div className="iphone-mockup" aria-label={alt}>
      <div className="iphone-mockup-bezel">
        <div className="iphone-mockup-island" />
        <div className="iphone-mockup-screen popup-motion-screen">
          <img
            className="popup-motion-base"
            src={`${publicUrl(base)}${q}`}
            alt=""
            aria-hidden
          />
          <div className="popup-motion-backdrop popup-motion-animate" style={motionStyle} aria-hidden />
          <img
            className="popup-motion-sheet popup-motion-animate"
            src={`${publicUrl(popup)}${q}`}
            alt=""
            aria-hidden
            style={{ height: popupHeight, ...motionStyle }}
          />
        </div>
      </div>
    </div>
  )
}
