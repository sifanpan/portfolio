export type Project = {
  id: string
  index: string
  label: string
  title: string
  summary: string
  tags: string[]
  /** case detail page or external link; can wire to routing later */
  href?: string
}

export const projects: Project[] = [
  {
    id: 'monetization',
    index: '01',
    label: 'Monetization & Conversion',
    title: 'Campaign & Conversion Design',
    summary:
      'Urgency, value bundles, and landing flows that reduce friction and lift paid conversion.',
    tags: ['Growth', 'E-commerce', 'In-app'],
  },
  {
    id: 'engagement',
    index: '02',
    label: 'User Growth & Engagement',
    title: 'High-Exposure Communication',
    summary:
      'Banners, targeting, and incentive visuals that capture attention and support retention.',
    tags: ['Activation', 'Banners', 'Gamification'],
  },
  {
    id: 'education',
    index: '03',
    label: 'Product Education & Adoption',
    title: 'Feature Guidance System',
    summary:
      'In-app education for complex hardware features—clear paths from selling point to usage.',
    tags: ['Onboarding', 'Education', 'Hardware'],
  },
]
