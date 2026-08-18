export type PlaygroundDemo = 'claim-medal' | 'plan-coach'

export type PlaygroundItem = {
  id: string
  title: string
  /** cover path relative to public/ (optional for demo entries) */
  cover?: string
  href?: string
  /** interactive demo rendered inside a bento tile */
  demo?: PlaygroundDemo
}

/** display order; tile size derived from cover aspect ratio */
export const playgroundItems: PlaygroundItem[] = [
  {
    id: 'cove-watch',
    title: 'Cove Watch — Comfort Field',
    cover: 'portfolio/cove-watch/cover.png',
    // interactive device simulator: shape studio / 3D wireframe / front preview / full interaction
    href: 'https://sifanpan.github.io/portfolio/simulator/',
  },
  {
    id: 'claim-medal',
    title: 'Claim Medal',
    demo: 'claim-medal',
  },
  {
    id: 'plan-coach',
    title: 'Plan Coach',
    demo: 'plan-coach',
  },
]
