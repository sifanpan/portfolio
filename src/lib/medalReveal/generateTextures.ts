const SIZE = 512

export type MedalTextures = {
  baseCanvas: HTMLCanvasElement
  normalCanvas: HTMLCanvasElement
  heightCanvas: HTMLCanvasElement
  backgroundCanvas: HTMLCanvasElement
  revealCanvas: HTMLCanvasElement
  bgRevealCanvas: HTMLCanvasElement
  size: number
  backgroundAspect: number
}

const MEDAL_BASE_URL = '/playground/medal/base.png'
const MEDAL_NORMAL_URL = '/playground/medal/normal.png'
const MEDAL_HEIGHT_URL = '/playground/medal/height.png'
const MEDAL_BACKGROUND_URL = '/playground/medal/background-cycling-wild-portrait.png'
const MEDAL_BACKGROUND_FALLBACK_URL = '/playground/medal/background.png'

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load ${url}`))
    img.src = url
  })
}

function imageToCanvas(img: HTMLImageElement, size: number) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, size, size)
  return canvas
}

function emptyRevealCanvas(size: number) {
  const revealCanvas = document.createElement('canvas')
  revealCanvas.width = size
  revealCanvas.height = size
  const rctx = revealCanvas.getContext('2d')!
  rctx.fillStyle = '#000'
  rctx.fillRect(0, 0, size, size)
  return revealCanvas
}

function imageCoverCanvas(img: HTMLImageElement, size: number) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const scale = Math.max(size / img.width, size / img.height)
  const w = img.width * scale
  const h = img.height * scale
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
  return canvas
}

/** prefer PS assets under public/playground/medal/ */
export async function loadMedalTextures(): Promise<MedalTextures> {
  const [baseImg, normalImg, heightImg, backgroundImg] = await Promise.all([
    loadImage(MEDAL_BASE_URL),
    loadImage(MEDAL_NORMAL_URL),
    loadImage(MEDAL_HEIGHT_URL),
    loadImage(MEDAL_BACKGROUND_URL).catch(() => loadImage(MEDAL_BACKGROUND_FALLBACK_URL)),
  ])
  const size = baseImg.width
  return {
    baseCanvas: imageToCanvas(baseImg, size),
    normalCanvas: imageToCanvas(normalImg, size),
    heightCanvas: imageToCanvas(heightImg, size),
    backgroundCanvas: imageCoverCanvas(backgroundImg, size),
    revealCanvas: emptyRevealCanvas(size),
    bgRevealCanvas: emptyRevealCanvas(size),
    size,
    backgroundAspect: backgroundImg.width / backgroundImg.height,
  }
}

function drawMedalHeight(ctx: CanvasRenderingContext2D, size: number) {
  const cx = size * 0.5
  const cy = size * 0.46
  const r = size * 0.29

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, size, size)

  // ribbon tails
  ctx.save()
  ctx.translate(cx, cy + r * 0.55)
  ctx.beginPath()
  ctx.moveTo(-r * 0.55, -r * 0.05)
  ctx.lineTo(-r * 0.72, r * 0.95)
  ctx.lineTo(-r * 0.18, r * 0.72)
  ctx.closePath()
  ctx.fillStyle = '#fff'
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(r * 0.55, -r * 0.05)
  ctx.lineTo(r * 0.72, r * 0.95)
  ctx.lineTo(r * 0.18, r * 0.72)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // ribbon band
  ctx.fillStyle = '#ddd'
  ctx.fillRect(cx - r * 0.62, cy - r * 0.08, r * 1.24, r * 0.22)

  // medal disc
  const disc = ctx.createRadialGradient(cx - r * 0.22, cy - r * 0.28, r * 0.05, cx, cy, r)
  disc.addColorStop(0, '#fff')
  disc.addColorStop(0.45, '#c8c8c8')
  disc.addColorStop(0.82, '#707070')
  disc.addColorStop(1, '#404040')
  ctx.fillStyle = disc
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()

  // inner ring emboss
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  ctx.lineWidth = r * 0.045
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = 'rgba(0,0,0,0.35)'
  ctx.lineWidth = r * 0.03
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2)
  ctx.stroke()

  // star emblem
  ctx.save()
  ctx.translate(cx, cy)
  ctx.beginPath()
  const spikes = 5
  const outer = r * 0.34
  const inner = r * 0.14
  for (let i = 0; i < spikes * 2; i++) {
    const rad = (Math.PI / spikes) * i - Math.PI / 2
    const radius = i % 2 === 0 ? outer : inner
    const x = Math.cos(rad) * radius
    const y = Math.sin(rad) * radius
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = '#f0f0f0'
  ctx.fill()
  ctx.restore()
}

function heightToNormal(height: Float32Array, size: number, strength = 3.2) {
  const normal = new Uint8ClampedArray(size * size * 4)
  const at = (x: number, y: number) => height[y * size + x]

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const xl = at(Math.max(x - 1, 0), y)
      const xr = at(Math.min(x + 1, size - 1), y)
      const yt = at(x, Math.max(y - 1, 0))
      const yb = at(x, Math.min(y + 1, size - 1))
      let nx = -(xr - xl) * strength
      let ny = -(yb - yt) * strength
      let nz = 1
      const len = Math.hypot(nx, ny, nz) || 1
      nx /= len
      ny /= len
      nz /= len
      const i = (y * size + x) * 4
      normal[i] = Math.round((nx * 0.5 + 0.5) * 255)
      normal[i + 1] = Math.round((ny * 0.5 + 0.5) * 255)
      normal[i + 2] = Math.round((nz * 0.5 + 0.5) * 255)
      normal[i + 3] = 255
    }
  }
  return normal
}

export function createMedalTextures(): MedalTextures {
  const heightCanvas = document.createElement('canvas')
  heightCanvas.width = SIZE
  heightCanvas.height = SIZE
  const hctx = heightCanvas.getContext('2d', { willReadFrequently: true })!
  drawMedalHeight(hctx, SIZE)
  const heightData = hctx.getImageData(0, 0, SIZE, SIZE)
  const heights = new Float32Array(SIZE * SIZE)
  for (let i = 0; i < heights.length; i++) {
    heights[i] = heightData.data[i * 4] / 255
  }

  const baseCanvas = document.createElement('canvas')
  baseCanvas.width = SIZE
  baseCanvas.height = SIZE
  const bctx = baseCanvas.getContext('2d')!
  bctx.fillStyle = '#0e0e12'
  bctx.fillRect(0, 0, SIZE, SIZE)

  const cx = SIZE * 0.5
  const cy = SIZE * 0.46
  const r = SIZE * 0.29

  // ribbon
  bctx.save()
  bctx.translate(cx, cy + r * 0.55)
  bctx.fillStyle = '#8b2942'
  bctx.beginPath()
  bctx.moveTo(-r * 0.55, -r * 0.05)
  bctx.lineTo(-r * 0.72, r * 0.95)
  bctx.lineTo(-r * 0.18, r * 0.72)
  bctx.closePath()
  bctx.fill()
  bctx.fillStyle = '#6b1c32'
  bctx.beginPath()
  bctx.moveTo(r * 0.55, -r * 0.05)
  bctx.lineTo(r * 0.72, r * 0.95)
  bctx.lineTo(r * 0.18, r * 0.72)
  bctx.closePath()
  bctx.fill()
  bctx.restore()

  bctx.fillStyle = '#7a2038'
  bctx.fillRect(cx - r * 0.62, cy - r * 0.08, r * 1.24, r * 0.22)

  const gold = bctx.createRadialGradient(cx - r * 0.25, cy - r * 0.32, r * 0.08, cx, cy, r)
  gold.addColorStop(0, '#fff4d6')
  gold.addColorStop(0.35, '#e8c06a')
  gold.addColorStop(0.72, '#b8862a')
  gold.addColorStop(1, '#6b4a12')
  bctx.fillStyle = gold
  bctx.beginPath()
  bctx.arc(cx, cy, r, 0, Math.PI * 2)
  bctx.fill()

  bctx.strokeStyle = 'rgba(255,240,200,0.45)'
  bctx.lineWidth = r * 0.04
  bctx.beginPath()
  bctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2)
  bctx.stroke()

  bctx.save()
  bctx.translate(cx, cy)
  bctx.beginPath()
  const spikes = 5
  const outer = r * 0.34
  const inner = r * 0.14
  for (let i = 0; i < spikes * 2; i++) {
    const rad = (Math.PI / spikes) * i - Math.PI / 2
    const radius = i % 2 === 0 ? outer : inner
    const x = Math.cos(rad) * radius
    const y = Math.sin(rad) * radius
    if (i === 0) bctx.moveTo(x, y)
    else bctx.lineTo(x, y)
  }
  bctx.closePath()
  bctx.fillStyle = '#fff8e8'
  bctx.fill()
  bctx.restore()

  const normalCanvas = document.createElement('canvas')
  normalCanvas.width = SIZE
  normalCanvas.height = SIZE
  const nctx = normalCanvas.getContext('2d')!
  const normalData = nctx.createImageData(SIZE, SIZE)
  normalData.data.set(heightToNormal(heights, SIZE))
  nctx.putImageData(normalData, 0, 0)

  const revealCanvas = emptyRevealCanvas(SIZE)
  const bgRevealCanvas = emptyRevealCanvas(SIZE)
  const backgroundCanvas = document.createElement('canvas')
  backgroundCanvas.width = SIZE
  backgroundCanvas.height = SIZE
  const bgctx = backgroundCanvas.getContext('2d')!
  bgctx.fillStyle = '#f2f2ee'
  bgctx.fillRect(0, 0, SIZE, SIZE)

  return {
    baseCanvas,
    normalCanvas,
    heightCanvas,
    backgroundCanvas,
    revealCanvas,
    bgRevealCanvas,
    size: SIZE,
    backgroundAspect: 1,
  }
}

export async function createMedalTexturesAsync(): Promise<MedalTextures> {
  try {
    return await loadMedalTextures()
  } catch {
    return createMedalTextures()
  }
}
