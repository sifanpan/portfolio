import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { publicUrl } from '../publicUrl'

type Props = {
  src?: string
  alt: string
  rev?: string
  empty?: boolean
  /** vertically scrollable long image */
  scroll?: boolean
  /** eager-load long image inside lightbox */
  eager?: boolean
}

function isVideoSrc(src: string): boolean {
  return /\.(mov|mp4|webm)$/i.test(src)
}

export function IphoneMockup({ src, alt, rev, empty, scroll, eager }: Props) {
  const [missing, setMissing] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const updateScrollProgress = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    setScrollProgress(max > 0 ? el.scrollTop / max : 0)
  }, [])

  useEffect(() => {
    setMissing(false)
    setScrollProgress(0)
    scrollRef.current?.scrollTo({ top: 0 })
  }, [src, rev])

  useLayoutEffect(() => {
    if (!scroll) return
    updateScrollProgress()
  }, [scroll, src, rev, updateScrollProgress])

  if (empty || !src) {
    return (
      <div className="iphone-mockup" aria-hidden>
        <div className="iphone-mockup-bezel">
          <div className="iphone-mockup-island" />
          <div className="iphone-mockup-screen">
            <div className="iphone-mockup-placeholder iphone-mockup-placeholder--empty" />
          </div>
        </div>
      </div>
    )
  }

  const url = rev ? `${publicUrl(src)}?v=${encodeURIComponent(rev)}` : publicUrl(src)
  const isVideo = isVideoSrc(src)

  const media = missing ? (
    <div className="iphone-mockup-placeholder">
      <span>{src.split('/').pop()}</span>
    </div>
  ) : isVideo ? (
    <video
      src={url}
      autoPlay
      loop
      muted
      playsInline
      aria-label={alt}
      onError={() => setMissing(true)}
    />
  ) : scroll ? (
    <>
      <div
        ref={scrollRef}
        className="iphone-mockup-scroll"
        onScroll={updateScrollProgress}
      >
        <img
          src={url}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={updateScrollProgress}
          onError={() => setMissing(true)}
        />
      </div>
      <div className="iphone-mockup-progress" aria-hidden>
        <div
          className="iphone-mockup-progress-fill"
          style={{ transform: `scaleY(${scrollProgress})` }}
        />
      </div>
    </>
  ) : (
    <img src={url} alt={alt} loading="lazy" onError={() => setMissing(true)} />
  )

  return (
    <div className="iphone-mockup" aria-hidden={missing}>
      <div className="iphone-mockup-bezel">
        <div className="iphone-mockup-island" />
        <div className={`iphone-mockup-screen${scroll ? ' iphone-mockup-screen--scroll' : ''}`}>
          {media}
        </div>
      </div>
    </div>
  )
}
