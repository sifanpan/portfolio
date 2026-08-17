import { useId } from 'react'

/** Figma 652:6 — decorative prototype close button (non-interactive) */
export function ClaimMedalProtoCloseIcon() {
  const filterId = useId().replace(/:/g, '')

  return (
    <svg
      className="pg-medal-figma-close__svg"
      viewBox="0 0 83 83"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g filter={`url(#${filterId})`}>
        <circle cx="41.5" cy="41.5" r="21.5" fill="white" />
        <path d="M35.5 35L48.5 48.5" stroke="black" strokeWidth="2" strokeLinecap="round" />
        <path d="M35.25 48.25L48.75 35.25" stroke="black" strokeWidth="2" strokeLinecap="round" />
      </g>
      <defs>
        <filter
          id={filterId}
          x="0"
          y="0"
          width="83"
          height="83"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="10" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape" />
        </filter>
      </defs>
    </svg>
  )
}
