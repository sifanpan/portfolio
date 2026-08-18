import { useMemo, useState } from 'react'
import type { WorkExposureCase, WorkProject, WorkScreen } from '../data/workShowcase'
import { useInlineVideo } from '../lib/useInlineVideo'
import { publicUrl } from '../publicUrl'
import { StackedCardCycle } from './StackedCardCycle'

function isVideoFile(file: string): boolean {
  return /\.(mov|mp4|webm)$/i.test(file)
}

function ExposureHeroMedia({ screen }: { screen: WorkScreen }) {
  const [missing, setMissing] = useState(false)
  const url = screen.file
    ? screen.rev
      ? `${publicUrl(screen.file)}?v=${encodeURIComponent(screen.rev)}`
      : publicUrl(screen.file)
    : undefined
  const isVideo = Boolean(
    screen.file && (screen.kind === 'video' || isVideoFile(screen.file)),
  )
  const videoRef = useInlineVideo(url, isVideo && !missing)

  if (!screen.file || !url) return null

  if (missing) {
    return (
      <div className="work-exposure-hero-media-placeholder">{screen.alt}</div>
    )
  }

  if (isVideo) {
    return (
      <video
        ref={videoRef}
        className="work-exposure-hero-video"
        src={url}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-label={screen.alt}
        onError={() => setMissing(true)}
      />
    )
  }

  return (
    <img
      className="work-exposure-hero-video"
      src={url}
      alt={screen.alt}
      loading="lazy"
      onError={() => setMissing(true)}
    />
  )
}

function ExposureFlatImage({
  screen,
  className,
}: {
  screen: WorkScreen
  className?: string
}) {
  if (!screen.file) return null

  const url = screen.rev
    ? `${publicUrl(screen.file)}?v=${encodeURIComponent(screen.rev)}`
    : publicUrl(screen.file)

  return (
    <img
      className={className}
      src={url}
      alt={screen.alt}
      loading="lazy"
    />
  )
}

type Props = {
  project: WorkProject
}

function ExposureCaseBlock({ caseItem }: { caseItem: WorkExposureCase }) {
  const featureStackSlides = useMemo(
    () =>
      caseItem.featureStackScreens?.map((screen) => ({
        file: screen.file!,
        alt: screen.alt,
      })) ?? [],
    [caseItem.featureStackScreens],
  )

  if (caseItem.layout === 'hero' && caseItem.screen) {
    const bgLightUrl = caseItem.backgroundLight?.file
      ? caseItem.backgroundLight.rev
        ? `${publicUrl(caseItem.backgroundLight.file)}?v=${encodeURIComponent(caseItem.backgroundLight.rev)}`
        : publicUrl(caseItem.backgroundLight.file)
      : null

    return (
      <section className="work-exposure-hero" aria-labelledby={`case-${caseItem.title}`}>
        <div className="work-exposure-hero-inner">
          <div className="work-exposure-hero-media">
            {bgLightUrl ? (
              <img
                className="work-exposure-hero-bg-light"
                src={bgLightUrl}
                alt=""
                aria-hidden
                draggable={false}
              />
            ) : (
              <div className="work-exposure-hero-glow" aria-hidden>
                <span className="work-exposure-hero-glow-core" />
                <span className="work-exposure-hero-glow-bloom" />
              </div>
            )}
            <ExposureHeroMedia screen={caseItem.screen} />
          </div>
          <div className="work-exposure-hero-copy">
            <h3 id={`case-${caseItem.title}`} className="work-exposure-case-title">
              {caseItem.title}
            </h3>
            <p className="work-exposure-case-desc">{caseItem.description}</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="work-exposure-module" aria-labelledby={`case-${caseItem.title}`}>
      <div className="work-exposure-module-head">
        <div className="work-exposure-module-copy">
          <h3 id={`case-${caseItem.title}`} className="work-exposure-case-title">
            {caseItem.title}
          </h3>
          <p className="work-exposure-case-desc">{caseItem.description}</p>
        </div>
        {caseItem.featureStackScreens && caseItem.featureStackScreens.length > 0 ? (
          <div className="work-exposure-module-feature work-exposure-module-feature--stack">
            <StackedCardCycle
              slides={featureStackSlides}
              rev={caseItem.featureStackScreens[0]?.rev}
            />
          </div>
        ) : caseItem.featureScreen ? (
          <div className="work-exposure-module-feature">
            <ExposureFlatImage screen={caseItem.featureScreen} />
          </div>
        ) : null}
      </div>
      {caseItem.journey || caseItem.journeyScreen ? (
        <div
          className="work-exposure-module-journey"
          aria-labelledby={
            caseItem.journey ? `journey-${caseItem.title}` : undefined
          }
        >
          <div className="work-exposure-module-journey-media">
            <ExposureFlatImage
              screen={caseItem.journey?.screen ?? caseItem.journeyScreen!}
              className="work-exposure-module-journey-img"
            />
          </div>
          {caseItem.journey ? (
            <div className="work-exposure-module-journey-copy">
              <h3
                id={`journey-${caseItem.title}`}
                className="work-exposure-case-title"
              >
                {caseItem.journey.title}
              </h3>
              <p className="work-exposure-case-desc">{caseItem.journey.description}</p>
            </div>
          ) : null}
        </div>
      ) : caseItem.flowScreens && caseItem.flowScreens.length > 0 ? (
        <div className="work-exposure-module-flow">
          {caseItem.flowScreens.map((screen, index) => (
            <div key={`${screen.file ?? index}-flow`} className="work-exposure-module-flow-step">
              <div className="work-exposure-module-flow-phone">
                <ExposureFlatImage screen={screen} />
              </div>
              {index < caseItem.flowScreens!.length - 1 ? (
                <div className="work-exposure-module-flow-arrow" aria-hidden />
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}

export function WorkExposurePanel({ project }: Props) {
  const cases = project.exposureCases ?? []

  return (
    <div className="work-exposure">
      <h2 id={`${project.id}-title`} className="work-showcase-title work-exposure-title">
        {project.title}
      </h2>
      {cases.map((caseItem) => (
        <ExposureCaseBlock key={caseItem.title} caseItem={caseItem} />
      ))}
    </div>
  )
}
