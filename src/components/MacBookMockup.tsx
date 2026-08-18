import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useInlineVideo } from '../lib/useInlineVideo'
import { publicUrl } from '../publicUrl'

const MOCKUP_OVERLAY = 'portfolio/mockups/macbook-pro-14/mockup-overlay.png'
const MOCKUP_REV = '20250610g'

type Props = {
  src?: string
  alt: string
  rev?: string
  /** campaign long image: vertical scroll inside browser viewport */
  scroll?: boolean
  /** address bar URL; defaults from alt */
  pageUrl?: string
}

function isVideoSrc(src: string): boolean {
  return /\.(mov|mp4|webm)$/i.test(src)
}

function pageUrlFromAlt(alt: string): string {
  const slug = alt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/-\d+$/, '')
  return `health.huawei.com/campaigns/${slug || 'preview'}`
}

function BrowserChrome({ url, children }: { url: string; children: ReactNode }) {
  return (
    <div className="macbook-mockup-browser">
      <div className="macbook-mockup-browser-toolbar" aria-hidden="true">
        <div className="macbook-mockup-browser-dots">
          <span className="macbook-mockup-browser-dot macbook-mockup-browser-dot--close" />
          <span className="macbook-mockup-browser-dot macbook-mockup-browser-dot--min" />
          <span className="macbook-mockup-browser-dot macbook-mockup-browser-dot--max" />
        </div>
        <div className="macbook-mockup-browser-nav">
          <span className="macbook-mockup-browser-nav-btn">
            <svg viewBox="0 0 8 12" width="6" height="9" aria-hidden>
              <path d="M5.5 1 1.5 6l4 5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="macbook-mockup-browser-nav-btn">
            <svg viewBox="0 0 8 12" width="6" height="9" aria-hidden>
              <path d="M2.5 1 6.5 6l-4 5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
        <div className="macbook-mockup-browser-url">
          <svg className="macbook-mockup-browser-lock" viewBox="0 0 10 12" width="7" height="8" aria-hidden>
            <rect x="1.5" y="5" width="7" height="6" rx="1.2" fill="currentColor" opacity="0.55" />
            <path d="M3 5V3.5a2 2 0 0 1 4 0V5" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          <span>{url}</span>
        </div>
        <div className="macbook-mockup-browser-actions">
          <span className="macbook-mockup-browser-action" />
          <span className="macbook-mockup-browser-action" />
        </div>
      </div>
      <div className="macbook-mockup-browser-viewport">{children}</div>
    </div>
  )
}

export function MacBookMockup({ src, alt, rev, scroll, pageUrl }: Props) {
  const [missing, setMissing] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const updateScrollProgress = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    setScrollProgress(max > 0 ? el.scrollTop / max : 0)
  }, [])

  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [src, rev])

  const url = src
    ? rev
      ? `${publicUrl(src)}?v=${encodeURIComponent(rev)}`
      : publicUrl(src)
    : undefined
  const isVideo = src ? isVideoSrc(src) : false
  const videoRef = useInlineVideo(url, isVideo && !scroll && !missing)
  const frameSrc = `${publicUrl(MOCKUP_OVERLAY)}?v=${MOCKUP_REV}`
  const barUrl = pageUrl ?? pageUrlFromAlt(alt)

  const renderContent = () => {
    if (!src) {
      return <div className="macbook-mockup-placeholder" />
    }

    if (missing) {
      return (
        <div className="macbook-mockup-placeholder">
          <span>{src.split('/').pop()}</span>
        </div>
      )
    }

    if (scroll) {
      return (
        <>
          <div
            ref={scrollRef}
            className="macbook-mockup-scroll"
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
          <div className="macbook-mockup-progress" aria-hidden>
            <div
              className="macbook-mockup-progress-fill"
              style={{ transform: `scaleY(${scrollProgress})` }}
            />
          </div>
        </>
      )
    }

    if (isVideo) {
      return (
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
      )
    }

    return (
      <img src={url} alt={alt} loading="lazy" onError={() => setMissing(true)} />
    )
  }

  return (
    <div className="macbook-mockup" aria-hidden={missing && !!src}>
      <div className="macbook-mockup-device">
        <div
          className={`macbook-mockup-display${scroll ? ' macbook-mockup-display--scroll' : ''}`}
        >
          <BrowserChrome url={barUrl}>{renderContent()}</BrowserChrome>
        </div>

        <img
          className="macbook-mockup-frame"
          src={frameSrc}
          alt=""
          aria-hidden
          draggable={false}
        />
      </div>
    </div>
  )
}
