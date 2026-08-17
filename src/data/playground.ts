export type PlaygroundDemo = 'claim-medal'

export type PlaygroundItem = {
  id: string
  title: string
  /** 相对 public/ 的封面图路径（demo 条目可省略） */
  cover?: string
  href?: string
  /** 交互 demo，渲染在 bento tile 内 */
  demo?: PlaygroundDemo
}

/** 按展示顺序排列；封面条目尺寸由 cover 宽高比自动推导 */
export const playgroundItems: PlaygroundItem[] = [
  {
    id: 'cove-watch',
    title: 'Cove Watch — Comfort Field',
    cover: 'portfolio/cove-watch/cover.png',
    // 可交互整机模拟器：外形工作室 / 3D 白膜 / 正视预览 / 整机交互
    href: 'https://446500261psf.github.io/portfolio/simulator/',
  },
  {
    id: 'claim-medal',
    title: 'Claim Medal',
    demo: 'claim-medal',
  },
]
