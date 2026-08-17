import { useId } from 'react'

type SparkleStarProps = {
  size?: number
  looping?: boolean
  glints?: boolean
  className?: string
}

/** 4-point soft sparkle — core spins on its centroid; glints stay fixed */
export function SparkleStar({
  size = 64,
  looping = true,
  glints = true,
  className,
}: SparkleStarProps) {
  const fillId = useId().replace(/:/g, '')
  const halo = glints ? size * 0.42 : 0
  const box = size + halo * 2

  return (
    <span
      className={`pg-pc-star${looping ? ' is-looping' : ''}${className ? ` ${className}` : ''}`}
      style={{ width: box, height: box }}
      aria-hidden="true"
    >
      {glints ? (
        <svg className="pg-pc-star__glints" viewBox="0 0 100 100" width={box} height={box}>
          <circle className="pg-pc-star__dot" cx="50" cy="14" r="1.6" />
          <polygon className="pg-pc-star__mini" points="62,18 64.2,22.4 69,23 65.2,26.2 66.2,31 62,28.4 57.8,31 58.8,26.2 55,23 59.8,22.4" />
          <circle className="pg-pc-star__dot pg-pc-star__dot--b" cx="86" cy="50" r="1.5" />
          <polygon className="pg-pc-star__mini pg-pc-star__mini--b" points="72,68 74,72 78.4,73 75,76 76,80.4 72,77.6 68,80.4 69,76 65.6,73 70,72" />
          <circle className="pg-pc-star__dot pg-pc-star__dot--c" cx="50" cy="86" r="1.6" />
          <circle className="pg-pc-star__dot pg-pc-star__dot--d" cx="18" cy="58" r="1.4" />
          <polygon className="pg-pc-star__mini pg-pc-star__mini--c" points="22,24 24,28 28.2,29 25,32 26,36.2 22,33.4 18,36.2 19,32 15.8,29 20,28" />
          <circle className="pg-pc-star__dot pg-pc-star__dot--e" cx="28" cy="22" r="1.3" />
        </svg>
      ) : null}
      <span className="pg-pc-star__spin" style={{ width: size, height: size }}>
        <svg className="pg-pc-star__core" viewBox="0 0 64 64" width={size} height={size}>
          <defs>
            <linearGradient id={fillId} x1="40%" y1="0%" x2="70%" y2="100%">
              <stop offset="31%" stopColor="#40C4EC" />
              <stop offset="49%" stopColor="#17ACDA" />
              <stop offset="79%" stopColor="#E1F3F7" />
            </linearGradient>
          </defs>
          <path
            fill={`url(#${fillId})`}
            d="M32 4 C33.4 16.4 36.6 22.6 48 24 C36.6 25.4 33.4 31.6 32 44 C30.6 31.6 27.4 25.4 16 24 C27.4 22.6 30.6 16.4 32 4 Z"
          />
        </svg>
      </span>
    </span>
  )
}
