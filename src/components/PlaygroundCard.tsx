import { useMemo, useState, type CSSProperties } from 'react'
import type { PlaygroundItem } from '../data/playground'
import { publicUrl } from '../publicUrl'
import { ClaimMedalDemo } from './playground/ClaimMedalDemo'
import { PlanCoachBento } from './playground/PlanCoachDemo'

type Props = {
  item: PlaygroundItem
}

/** horizontal span on 12-column grid; wide images take more columns */
function columnSpan(aspectRatio: number): number {
  if (aspectRatio >= 1.85) return 8
  if (aspectRatio >= 1.35) return 6
  return 4
}

const DEMO_SPAN: Partial<Record<string, number>> = {
  'claim-medal': 4,
  'plan-coach': 4,
}

export function PlaygroundCard({ item }: Props) {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null)

  const style = useMemo((): CSSProperties | undefined => {
    if (item.demo === 'claim-medal') {
      return {
        gridColumn: `span ${DEMO_SPAN[item.id] ?? 4}`,
        aspectRatio: '1 / 1',
        maxWidth: '12rem',
      }
    }
    if (item.demo === 'plan-coach') {
      return {
        gridColumn: `span ${DEMO_SPAN[item.id] ?? 4}`,
      }
    }
    if (!aspectRatio) return undefined
    return {
      gridColumn: `span ${columnSpan(aspectRatio)}`,
      aspectRatio: String(aspectRatio),
    }
  }, [aspectRatio, item.demo, item.id])

  if (item.demo === 'claim-medal') {
    return (
      <article
        className="pg-bento pg-bento--demo"
        data-pg={item.id}
        style={style}
        aria-label={item.title}
      >
        <ClaimMedalDemo />
        <span className="pg-bento-label" aria-hidden="true">
          {item.title}
        </span>
      </article>
    )
  }

  if (item.demo === 'plan-coach') {
    return <PlanCoachBento item={item} style={style} />
  }

  // must use publicUrl: Pages deploys under /sifan.pan.v2/ subpath; hardcoded /portfolio/… 404s
  const cover = publicUrl(item.cover!)

  const tile = (
    <article
      className="pg-bento"
      data-pg={item.id}
      style={style}
      aria-label={item.title}
    >
      <img
        className="pg-bento-cover"
        src={cover}
        alt=""
        loading="lazy"
        decoding="async"
        onLoad={(event) => {
          const { naturalWidth, naturalHeight } = event.currentTarget
          if (naturalWidth > 0 && naturalHeight > 0) {
            setAspectRatio(naturalWidth / naturalHeight)
          }
        }}
      />
      <span className="pg-bento-label" aria-hidden="true">
        {item.title}
      </span>
    </article>
  )

  if (item.href) {
    return (
      <a className="pg-bento-link" href={item.href} target="_blank" rel="noreferrer">
        {tile}
      </a>
    )
  }

  return tile
}
