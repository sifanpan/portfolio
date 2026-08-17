import { useCallback, useEffect, useRef, useState } from 'react'
import { publicUrl } from '../publicUrl'

type Props = {
  src?: string
  alt: string
  rev?: string
  /** campaign long image: vertical scroll inside screen viewport */
  scroll?: boolean
}

function isVideoSrc(src: string): boolean {
  return /\.(mov|mp4|webm)$/i.test(src)
}

export function AngledPhoneMockup({ src, alt, rev, scroll }: Props) {
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

  const url = src
    ? rev
      ? `${publicUrl(src)}?v=${encodeURIComponent(rev)}`
      : publicUrl(src)
    : undefined
  const isVideo = src ? isVideoSrc(src) : false

  return (
    <div className="angled-phone-mockup" aria-hidden={missing && !!src}>
      <div className="angled-phone-mockup-shadow" aria-hidden />
      <div className="angled-phone-mockup-perspective">
        <div className="angled-phone-mockup-tilt">
          <div className="angled-phone-mockup-body">
            <div className="angled-phone-mockup-edge angled-phone-mockup-edge--left" aria-hidden />
            <div className="angled-phone-mockup-edge angled-phone-mockup-edge--right" aria-hidden />
            <div className="angled-phone-mockup-bezel">
              <div className="angled-phone-mockup-island" />
              <div
                className={`angled-phone-mockup-screen${scroll ? ' angled-phone-mockup-screen--scroll' : ''}`}
              >
                {!src ? (
                  <div className="angled-phone-mockup-placeholder" />
                ) : missing ? (
                  <div className="angled-phone-mockup-placeholder">
                    <span>{src.split('/').pop()}</span>
                  </div>
                ) : scroll ? (
                  <>
                    <div
                      ref={scrollRef}
                      className="angled-phone-mockup-scroll"
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
                    <div className="angled-phone-mockup-progress" aria-hidden>
                      <div
                        className="angled-phone-mockup-progress-fill"
                        style={{ transform: `scaleY(${scrollProgress})` }}
                      />
                    </div>
                  </>
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
                ) : (
                  <img src={url} alt={alt} loading="lazy" onError={() => setMissing(true)} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
