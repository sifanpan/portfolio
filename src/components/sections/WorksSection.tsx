import { ProjectCard } from '../ProjectCard'
import { SectionHeading } from '../SectionHeading'
import { projects } from '../../data/projects'

/** Works list for full-site (cinematic) variant */
export function WorksSection() {
  return (
    <section
      aria-labelledby="works-heading"
      id="works"
      className="border-b border-white/5 px-5 py-16 sm:px-8 sm:py-24"
    >
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="02 — Works"
          title="Works"
          subtitle="Selected product design work — monetization, growth, and feature education inside consumer and health apps."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </div>
    </section>
  )
}
