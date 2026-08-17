import { useMemo, useState, type CSSProperties } from 'react'
import type { PlaygroundItem } from '../data/playground'
import { publicUrl } from '../publicUrl'
import { ClaimMedalDemo } from './playground/ClaimMedalDemo'

type Props = {
  item: PlaygroundItem
}

/** 12 列网格下的横向跨度，宽图占更多列 */
function columnSpan(aspectRatio: number): number {
  if (aspectRatio >= 1.85) return 8
  if (aspectRatio >= 1.35) return 6
  return 4
}

const DEMO_SPAN: Partial<Record<string, number>> = {
  'claim-medal': 4,
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

  // 必须走 publicUrl：Pages 部署在 /sifan.pan.v2/ 子路径下，写死的 /portfolio/… 会 404
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
