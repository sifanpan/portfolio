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
    // Simulator still lives on the v1 Pages site (this repo has no /simulator/).
    // Verified 200: https://sifanpan.github.io/portfolio-v1/simulator/
    href: 'https://sifanpan.github.io/portfolio-v1/simulator/',
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
