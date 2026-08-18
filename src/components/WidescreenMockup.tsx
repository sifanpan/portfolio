import { useCallback, useEffect, useRef, useState } from 'react'
import { useInlineVideo } from '../lib/useInlineVideo'
import { publicUrl } from '../publicUrl'

type Props = {
  src?: string
  alt: string
  rev?: string
  /** campaign long image: vertical scroll inside 16:9 viewport */
  scroll?: boolean
}

function isVideoSrc(src: string): boolean {
  return /\.(mov|mp4|webm)$/i.test(src)
}

export function WidescreenMockup({ src, alt, rev, scroll }: Props) {
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
  const videoRef = useInlineVideo(url, isVideo && !scroll && !missing)

  if (!src) {
    return (
      <div className="widescreen-mockup" aria-hidden>
        <div className="widescreen-mockup-bezel">
          <div className="widescreen-mockup-screen">
            <div className="widescreen-mockup-placeholder" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="widescreen-mockup" aria-hidden={missing}>
      <div className="widescreen-mockup-bezel">
        <div className={`widescreen-mockup-screen${scroll ? ' widescreen-mockup-screen--scroll' : ''}`}>
          {missing ? (
            <div className="widescreen-mockup-placeholder">
              <span>{src.split('/').pop()}</span>
            </div>
          ) : isVideo ? (
            <video
              ref={videoRef}
              src={url}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              aria-label={alt}
              onError={() => setMissing(true)}
            />
          ) : scroll ? (
            <>
              <div
                ref={scrollRef}
                className="widescreen-mockup-scroll"
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
              <div className="widescreen-mockup-progress" aria-hidden>
                <div
                  className="widescreen-mockup-progress-fill"
                  style={{ transform: `scaleY(${scrollProgress})` }}
                />
              </div>
            </>
          ) : (
            <img src={url} alt={alt} loading="lazy" onError={() => setMissing(true)} />
          )}
        </div>
      </div>
    </div>
  )
}
