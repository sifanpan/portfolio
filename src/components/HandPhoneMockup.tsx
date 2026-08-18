import { useCallback, useEffect, useRef, useState } from 'react'
import { useInlineVideo } from '../lib/useInlineVideo'
import { publicUrl } from '../publicUrl'

const MOCKUP_OVERLAY = 'portfolio/project-5/hand-phone-scroll/phone mockup for scroll.png'
const MOCKUP_REV = '2025061423'

type Props = {
  src?: string
  alt: string
  rev?: string
  scroll?: boolean
}

function isVideoSrc(src: string): boolean {
  return /\.(mov|mp4|webm)$/i.test(src)
}

export function HandPhoneMockup({ src, alt, rev, scroll }: Props) {
  const [missing, setMissing] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const updateScrollProgress = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    setScrollProgress(max > 0 ? el.scrollTop / max : 0)
  }, [])

  const url = src
    ? rev
      ? `${publicUrl(src)}?v=${encodeURIComponent(rev)}`
      : publicUrl(src)
    : undefined
  const isVideo = src ? isVideoSrc(src) : false
  const overlaySrc = `${publicUrl(MOCKUP_OVERLAY)}?v=${MOCKUP_REV}`
  const videoRef = useInlineVideo(url, isVideo && !scroll && !missing)

  useEffect(() => {
    setMissing(false)
    setScrollProgress(0)
    scrollRef.current?.scrollTo({ top: 0 })
  }, [src, rev])

  return (
    <div className="hand-phone-mockup">
      <div className="hand-phone-mockup-device">
        <div
          className={`hand-phone-mockup-screen${scroll ? ' hand-phone-mockup-screen--scroll' : ''}${isVideo ? ' hand-phone-mockup-screen--video' : ''}`}
          aria-hidden={missing && !!src}
        >
          {!src ? null : missing ? (
            <div className="hand-phone-mockup-placeholder">
              <span>{src.split('/').pop()}</span>
            </div>
          ) : scroll ? (
            <>
              <div
                ref={scrollRef}
                className="hand-phone-mockup-scroll"
                onScroll={updateScrollProgress}
              >
                <img
                  src={url}
                  alt={alt}
                  loading="lazy"
                  onLoad={updateScrollProgress}
                  onError={() => setMissing(true)}
                />
              </div>
              <div className="hand-phone-mockup-progress" aria-hidden>
                <div
                  className="hand-phone-mockup-progress-fill"
                  style={{ transform: `scaleY(${scrollProgress})` }}
                />
              </div>
            </>
          ) : isVideo ? (
            <video
              ref={videoRef}
              key={url}
              className="hand-phone-mockup-media"
              src={url}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              aria-label={alt}
              onError={() => setMissing(true)}
            />
          ) : (
            <img
              className="hand-phone-mockup-media"
              src={url}
              alt={alt}
              loading="lazy"
              onError={() => setMissing(true)}
            />
          )}
        </div>

        <img
          className="hand-phone-mockup-overlay"
          src={overlaySrc}
          alt=""
          aria-hidden
          draggable={false}
        />
      </div>
    </div>
  )
}
