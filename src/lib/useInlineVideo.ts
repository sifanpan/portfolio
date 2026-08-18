import { useEffect, useRef } from 'react'

/** Keep muted inline videos playing on iOS Safari (autoplay is flaky until visible / tapped). */
export function useInlineVideo(src: string | undefined, enabled: boolean) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video || !enabled || !src) return

    const play = () => {
      void video.play().catch(() => {})
    }

    const onPointer = () => play()
    video.addEventListener('canplay', play)
    video.addEventListener('pointerdown', onPointer)
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) play()

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio > 0.2)) {
          play()
        }
      },
      { threshold: [0.2, 0.5] },
    )
    io.observe(video)

    return () => {
      video.removeEventListener('canplay', play)
      video.removeEventListener('pointerdown', onPointer)
      io.disconnect()
    }
  }, [src, enabled])

  return ref
}
