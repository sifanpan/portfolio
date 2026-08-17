import { forwardRef, useEffect, useImperativeHandle, useRef, type MouseEvent as ReactMouseEvent } from 'react'
import {
  createMedalTexturesAsync,
  MEDAL_FIGMA_COLOR_PATH,
} from '../../lib/medalReveal/generateTextures'
import {
  RELIEF_V1_BRUSH_RADIUS,
  RELIEF_V1_BRUSH_SPECKLES,
  RELIEF_V1_DECAY_PAUSE_MS,
  RELIEF_V1_DECAY_RGB,
  RELIEF_V1_REVEAL_SNAP,
  RELIEF_V1_STROKE_STEP,
} from '../../lib/medalReveal/reliefStyle.v1'
import { MEDAL_VERT, RELIEF_ERASE_FRAG } from '../../lib/medalReveal/shaders'

export type MedalReliefPhase = 'wipe-medal' | 'wipe-background' | 'unlocked'
export type MedalReliefVariant = 'bento' | 'flow'

type MedalScale = { ratio: number; maxPx: number }

type MedalReliefCanvasProps = {
  variant?: MedalReliefVariant
  phase?: MedalReliefPhase
  /** 是否检测擦除进度并触发 onMedalReady；mockup 演示屏应关闭以循环擦除→消退 */
  trackUnlock?: boolean
  medalScale?: MedalScale
  onMedalReady?: () => void
  onBackgroundReady?: () => void
  onTap?: () => void
}

export type MedalReliefHandle = {
  /** flow mode: erase on hover coordinates (no press required) */
  paintHover: (clientX: number, clientY: number) => void
}

/** medal size inside flow popup — Figma 652:5 300px in 402×764 popup */
const FLOW_MEDAL_SCALE: MedalScale = { ratio: 300 / 402, maxPx: 9999 }
/** fill bento tile as much as possible */
const BENTO_MEDAL_SCALE: MedalScale = { ratio: 0.92, maxPx: 480 }

/** avg medal reveal + high-coverage pixel ratio; triggers background wipe when met */
const MEDAL_UNLOCK_AVG = 0.76
const MEDAL_UNLOCK_PIXEL = 0.58
const MEDAL_UNLOCK_COVERAGE = 0.88
const BG_UNLOCK_AVG = 0.54
const BG_UNLOCK_COVERAGE = 0.38
const TAP_MOVE_PX = 14
/** flow 演示：停笔后更快回到灰浮雕 */
const FLOW_MEDAL_DECAY_RGB = 205

type MedalRect = { left: number; top: number; w: number; h: number }

/** Figma 652:5 — medal center region (402×764 popup coords) */
const FLOW_FIGMA_MEDAL_RECT: MedalRect = {
  left: 51 / 402,
  top: 97 / 764,
  w: 300 / 402,
  h: 300 / 764,
}

function computeMedalRect(stageW: number, stageH: number, scale: MedalScale, variant: MedalReliefVariant): MedalRect {
  if (variant === 'flow') return FLOW_FIGMA_MEDAL_RECT
  const medalPx = Math.min(stageW * scale.ratio, stageH * scale.ratio, scale.maxPx)
  return {
    left: (stageW - medalPx) / 2 / stageW,
    top: (stageH - medalPx) / 2 / stageH,
    w: medalPx / stageW,
    h: medalPx / stageH,
  }
}

function screenToMedalUv(sx: number, sy: number, rect: MedalRect) {
  return {
    mx: (sx - rect.left) / rect.w,
    my: (sy - rect.top) / rect.h,
  }
}

function inMedalBox(mx: number, my: number) {
  return mx >= 0 && mx <= 1 && my >= 0 && my <= 1
}

function snapRevealCanvas(canvas: HTMLCanvasElement) {
  const rctx = canvas.getContext('2d', { willReadFrequently: true })!
  const img = rctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = img.data
  let snapped = false
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] < RELIEF_V1_REVEAL_SNAP) {
      d[i] = 0
      d[i + 1] = 0
      d[i + 2] = 0
      d[i + 3] = 255
      snapped = true
    }
  }
  if (snapped) rctx.putImageData(img, 0, 0)
}

function decayRevealCanvas(canvas: HTMLCanvasElement, decayRgb: number = RELIEF_V1_DECAY_RGB) {
  const rctx = canvas.getContext('2d', { willReadFrequently: true })!
  rctx.globalCompositeOperation = 'multiply'
  rctx.fillStyle = `rgb(${decayRgb}, ${decayRgb}, ${decayRgb})`
  rctx.fillRect(0, 0, canvas.width, canvas.height)
  rctx.globalCompositeOperation = 'source-over'
  snapRevealCanvas(canvas)
}

function latchMedalReveal(revealCanvas: HTMLCanvasElement, medalMask: Uint8Array, texSize: number) {
  const rctx = revealCanvas.getContext('2d', { willReadFrequently: true })!
  const img = rctx.getImageData(0, 0, texSize, texSize)
  const d = img.data
  for (let i = 0; i < medalMask.length; i++) {
    if (!medalMask[i]) continue
    const j = i * 4
    d[j] = 255
    d[j + 1] = 255
    d[j + 2] = 255
  }
  rctx.putImageData(img, 0, 0)
}

function latchBgReveal(bgRevealCanvas: HTMLCanvasElement) {
  const rctx = bgRevealCanvas.getContext('2d')!
  rctx.fillStyle = '#fff'
  rctx.fillRect(0, 0, bgRevealCanvas.width, bgRevealCanvas.height)
}

function stampRevealBrush(
  rctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  canvasWidth: number,
) {
  const rad = canvasWidth * RELIEF_V1_BRUSH_RADIUS

  rctx.globalCompositeOperation = 'lighter'

  const core = rctx.createRadialGradient(x, y, 0, x, y, rad * 1.32)
  core.addColorStop(0, 'rgba(255,255,255,0.58)')
  core.addColorStop(0.32, 'rgba(255,255,255,0.34)')
  core.addColorStop(0.62, 'rgba(255,255,255,0.14)')
  core.addColorStop(0.82, 'rgba(255,255,255,0.05)')
  core.addColorStop(1, 'rgba(255,255,255,0)')
  rctx.fillStyle = core
  rctx.beginPath()
  rctx.arc(x, y, rad * 1.32, 0, Math.PI * 2)
  rctx.fill()

  const haze = rctx.createRadialGradient(x, y, rad * 0.12, x, y, rad * 1.82)
  haze.addColorStop(0, 'rgba(255,255,255,0)')
  haze.addColorStop(0.5, 'rgba(255,255,255,0.09)')
  haze.addColorStop(0.72, 'rgba(255,255,255,0.04)')
  haze.addColorStop(1, 'rgba(255,255,255,0)')
  rctx.fillStyle = haze
  rctx.beginPath()
  rctx.arc(x, y, rad * 1.82, 0, Math.PI * 2)
  rctx.fill()

  for (let i = 0; i < RELIEF_V1_BRUSH_SPECKLES; i++) {
    const angle = Math.random() * Math.PI * 2
    const dist = Math.random() ** 0.48 * rad * 1.12
    const sx = x + Math.cos(angle) * dist
    const sy = y + Math.sin(angle) * dist
    const sr = canvasWidth * (0.014 + Math.random() * 0.034)
    const alpha = 0.12 + Math.random() * 0.42
    const speck = rctx.createRadialGradient(sx, sy, 0, sx, sy, sr)
    speck.addColorStop(0, `rgba(255,255,255,${alpha.toFixed(3)})`)
    speck.addColorStop(0.5, `rgba(255,255,255,${(alpha * 0.28).toFixed(3)})`)
    speck.addColorStop(1, 'rgba(255,255,255,0)')
    rctx.fillStyle = speck
    rctx.beginPath()
    rctx.arc(sx, sy, sr, 0, Math.PI * 2)
    rctx.fill()
  }

  rctx.globalCompositeOperation = 'source-over'
}

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? 'Shader compile failed')
  }
  return shader
}

function createProgram(gl: WebGL2RenderingContext) {
  const program = gl.createProgram()!
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, MEDAL_VERT))
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, RELIEF_ERASE_FRAG))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? 'Program link failed')
  }
  return program
}

function uploadCanvas(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement, unit: number) {
  const tex = gl.createTexture()!
  gl.activeTexture(gl.TEXTURE0 + unit)
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas)
  return tex
}

function parseBgColor(el: HTMLElement): [number, number, number] {
  const source = el.closest('.pg-medal-stage') ?? el
  const raw = getComputedStyle(source).getPropertyValue('--pg-medal-bg').trim()
  if (raw.startsWith('#')) {
    const hex = raw.slice(1)
    const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex
    const n = Number.parseInt(full, 16)
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
  }
  const bg = getComputedStyle(source).backgroundColor
  const m = bg.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/)
  if (m) return [Number(m[1]) / 255, Number(m[2]) / 255, Number(m[3]) / 255]
  return [242 / 255, 242 / 255, 238 / 255]
}

function buildMedalMask(baseCanvas: HTMLCanvasElement) {
  const size = baseCanvas.width
  const data = baseCanvas.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, size, size).data
  const mask = new Uint8Array(size * size)
  for (let i = 0; i < mask.length; i++) {
    mask[i] = data[i * 4 + 3] > 25 ? 1 : 0
  }
  return { mask, size }
}

function isMedalAt(mask: Uint8Array, size: number, nx: number, ny: number) {
  const x = Math.min(size - 1, Math.max(0, Math.floor(nx * size)))
  const y = Math.min(size - 1, Math.max(0, Math.floor(ny * size)))
  return mask[y * size + x] === 1
}

export const MedalReliefCanvas = forwardRef<MedalReliefHandle, MedalReliefCanvasProps>(function MedalReliefCanvas(
  {
    variant = 'flow',
    phase = 'wipe-medal',
    trackUnlock = true,
    medalScale,
    onMedalReady,
    onBackgroundReady,
    onTap,
  },
  ref,
) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastPaintRef = useRef(0)
  const lastUvRef = useRef<{ x: number; y: number } | null>(null)
  const medalUnlockedRef = useRef(false)
  const bgUnlockedRef = useRef(false)
  const phaseRef = useRef(phase)
  const variantRef = useRef(variant)
  const trackUnlockRef = useRef(trackUnlock)
  const medalScaleRef = useRef(medalScale ?? (variant === 'bento' ? BENTO_MEDAL_SCALE : FLOW_MEDAL_SCALE))
  const onMedalReadyRef = useRef(onMedalReady)
  const onBackgroundReadyRef = useRef(onBackgroundReady)
  const onTapRef = useRef(onTap)
  const texturesRef = useRef<Awaited<ReturnType<typeof createMedalTexturesAsync>> | null>(null)
  const medalMaskRef = useRef<Uint8Array | null>(null)
  const texSizeRef = useRef(0)
  const medalRevealDirtyRef = useRef<(() => void) | null>(null)
  const bgRevealDirtyRef = useRef<(() => void) | null>(null)
  const paintHoverRef = useRef<(clientX: number, clientY: number) => void>(() => {})

  useImperativeHandle(ref, () => ({
    paintHover: (clientX, clientY) => paintHoverRef.current(clientX, clientY),
  }))

  phaseRef.current = phase
  variantRef.current = variant
  trackUnlockRef.current = trackUnlock
  medalScaleRef.current = medalScale ?? (variant === 'bento' ? BENTO_MEDAL_SCALE : FLOW_MEDAL_SCALE)
  onMedalReadyRef.current = onMedalReady
  onBackgroundReadyRef.current = onBackgroundReady
  onTapRef.current = onTap

  useEffect(() => {
    if (variantRef.current === 'bento') return
    const textures = texturesRef.current
    const medalMask = medalMaskRef.current
    const texSize = texSizeRef.current
    if (!textures || !medalMask || !texSize) return

    if (phase === 'wipe-background' || phase === 'unlocked') {
      latchMedalReveal(textures.revealCanvas, medalMask, texSize)
      medalUnlockedRef.current = true
      medalRevealDirtyRef.current?.()
    }

    if (phase === 'unlocked') {
      latchBgReveal(textures.bgRevealCanvas)
      bgUnlockedRef.current = true
      bgRevealDirtyRef.current?.()
    }

    if (phase === 'wipe-medal') {
      bgUnlockedRef.current = false
    }
  }, [phase])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: true, premultipliedAlpha: true })
    if (!gl) return

    let disposed = false
    let cleanup: (() => void) | undefined

    const basePath = variantRef.current === 'flow' ? MEDAL_FIGMA_COLOR_PATH : undefined
    void createMedalTexturesAsync(basePath).then((textures) => {
      if (disposed) return

      const { mask: medalMask, size: texSize } = buildMedalMask(textures.baseCanvas)
      texturesRef.current = textures
      medalMaskRef.current = medalMask
      texSizeRef.current = texSize

      const program = createProgram(gl)
      gl.useProgram(program)

      const buf = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, buf)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)

      const aPos = gl.getAttribLocation(program, 'aPos')
      gl.enableVertexAttribArray(aPos)
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

      const uBgColor = gl.getUniformLocation(program, 'uBgColor')
      const uTexel = gl.getUniformLocation(program, 'uTexel')
      const uMedalRect = gl.getUniformLocation(program, 'uMedalRect')
      const uViewAspect = gl.getUniformLocation(program, 'uViewAspect')
      const uBgAspect = gl.getUniformLocation(program, 'uBgAspect')
      const uFlowUnderlay = gl.getUniformLocation(program, 'uFlowUnderlay')

      const texBase = uploadCanvas(gl, textures.baseCanvas, 0)
      const texNormal = uploadCanvas(gl, textures.normalCanvas, 1)
      const texHeight = uploadCanvas(gl, textures.heightCanvas, 2)
      const texReveal = uploadCanvas(gl, textures.revealCanvas, 3)
      const texBackground = uploadCanvas(gl, textures.backgroundCanvas, 4)
      const texBgReveal = uploadCanvas(gl, textures.bgRevealCanvas, 5)
      gl.uniform1i(gl.getUniformLocation(program, 'uBase'), 0)
      gl.uniform1i(gl.getUniformLocation(program, 'uNormal'), 1)
      gl.uniform1i(gl.getUniformLocation(program, 'uHeight'), 2)
      gl.uniform1i(gl.getUniformLocation(program, 'uReveal'), 3)
      gl.uniform1i(gl.getUniformLocation(program, 'uBackground'), 4)
      gl.uniform1i(gl.getUniformLocation(program, 'uBgReveal'), 5)

      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

      let medalRevealDirty = true
      let bgRevealDirty = true
      let raf = 0
      let medalRect: MedalRect = { left: 0, top: 0, w: 1, h: 1 }

      medalRevealDirtyRef.current = () => {
        medalRevealDirty = true
      }
      bgRevealDirtyRef.current = () => {
        bgRevealDirty = true
      }

      if (phaseRef.current === 'wipe-background' || phaseRef.current === 'unlocked') {
        latchMedalReveal(textures.revealCanvas, medalMask, texSize)
        medalUnlockedRef.current = true
      }
      if (phaseRef.current === 'unlocked') {
        latchBgReveal(textures.bgRevealCanvas)
        bgUnlockedRef.current = true
      }

      const ensureBgRevealSize = (w: number, h: number) => {
        if (textures.bgRevealCanvas.width === w && textures.bgRevealCanvas.height === h) return
        textures.bgRevealCanvas.width = w
        textures.bgRevealCanvas.height = h
        const rctx = textures.bgRevealCanvas.getContext('2d')!
        rctx.fillStyle = '#000'
        rctx.fillRect(0, 0, w, h)
        bgRevealDirty = true
      }

      const stampAt = (
        target: HTMLCanvasElement,
        nx: number,
        ny: number,
        brushScale: number,
        markDirty: () => void,
      ) => {
        const rctx = target.getContext('2d')!
        const w = target.width
        const x = nx * w
        const y = ny * target.height
        stampRevealBrush(rctx, x, y, w * brushScale)
        lastPaintRef.current = performance.now()
        markDirty()
      }

      const updateMedalUnlock = () => {
        if (medalUnlockedRef.current) return
        const rctx = textures.revealCanvas.getContext('2d', { willReadFrequently: true })!
        const sample = rctx.getImageData(0, 0, texSize, texSize).data
        let sum = 0
        let count = 0
        let covered = 0
        for (let i = 0; i < medalMask.length; i++) {
          if (!medalMask[i]) continue
          const v = sample[i * 4] / 255
          sum += v
          count++
          if (v >= MEDAL_UNLOCK_PIXEL) covered++
        }
        if (!count) return
        const avg = sum / count
        const coverage = covered / count
        if (avg >= MEDAL_UNLOCK_AVG && coverage >= MEDAL_UNLOCK_COVERAGE) {
          medalUnlockedRef.current = true
          wrap.dataset.medalUnlocked = 'true'
          if (variantRef.current === 'flow') {
            onMedalReadyRef.current?.()
          }
        }
      }

      const updateBgUnlock = () => {
        if (bgUnlockedRef.current) return
        const rctx = textures.bgRevealCanvas.getContext('2d', { willReadFrequently: true })!
        const sample = rctx.getImageData(
          0,
          0,
          textures.bgRevealCanvas.width,
          textures.bgRevealCanvas.height,
        ).data
        let sum = 0
        let count = 0
        let covered = 0
        for (let i = 0; i < sample.length; i += 4) {
          const v = sample[i] / 255
          sum += v
          count++
          if (v >= 0.45) covered++
        }
        if (!count) return
        const avg = sum / count
        const coverage = covered / count
        if (avg >= BG_UNLOCK_AVG && coverage >= BG_UNLOCK_COVERAGE) {
          bgUnlockedRef.current = true
          latchBgReveal(textures.bgRevealCanvas)
          bgRevealDirty = true
          onBackgroundReadyRef.current?.()
        }
      }

      const paintStroke = (sx: number, sy: number) => {
        const currentPhase = variantRef.current === 'bento' ? 'wipe-medal' : phaseRef.current
        if (currentPhase === 'unlocked') return

        const { mx, my } = screenToMedalUv(sx, sy, medalRect)
        const onMedalShape = inMedalBox(mx, my) && isMedalAt(medalMask, texSize, mx, my)

        if (currentPhase === 'wipe-medal' && onMedalShape) {
          stampAt(textures.revealCanvas, mx, my, 1, () => {
            medalRevealDirty = true
          })
          if (variantRef.current === 'flow' && trackUnlockRef.current) updateMedalUnlock()
          return
        }

        if (currentPhase === 'wipe-background' && variantRef.current === 'flow') {
          stampAt(textures.bgRevealCanvas, sx, sy, 1, () => {
            bgRevealDirty = true
          })
          updateBgUnlock()
        }
      }

      const paintStrokeInterpolated = (sx: number, sy: number) => {
        const stageW = wrap.clientWidth
        const ratio = medalScaleRef.current.ratio
        const step = stageW * ratio * RELIEF_V1_BRUSH_RADIUS * RELIEF_V1_STROKE_STEP
        const last = lastUvRef.current

        if (!last) {
          paintStroke(sx, sy)
          lastUvRef.current = { x: sx, y: sy }
          return
        }

        const dx = (sx - last.x) * stageW
        const dy = (sy - last.y) * wrap.clientHeight
        const dist = Math.hypot(dx, dy)
        const steps = Math.max(1, Math.ceil(dist / step))

        for (let i = 0; i <= steps; i++) {
          const t = i / steps
          paintStroke(last.x + (sx - last.x) * t, last.y + (sy - last.y) * t)
        }
        lastUvRef.current = { x: sx, y: sy }
      }

      const decayReveals = () => {
        if (reduced) return
        if (performance.now() - lastPaintRef.current < RELIEF_V1_DECAY_PAUSE_MS) return
        const currentPhase = variantRef.current === 'bento' ? 'wipe-medal' : phaseRef.current
        if (currentPhase === 'wipe-medal') {
          const flowDecay = variantRef.current === 'flow'
          decayRevealCanvas(textures.revealCanvas, flowDecay ? FLOW_MEDAL_DECAY_RGB : RELIEF_V1_DECAY_RGB)
          if (flowDecay) {
            decayRevealCanvas(textures.revealCanvas, FLOW_MEDAL_DECAY_RGB)
          }
          medalRevealDirty = true
        } else if (currentPhase === 'wipe-background') {
          decayRevealCanvas(textures.bgRevealCanvas)
          bgRevealDirty = true
        }
      }

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const cssW = wrap.clientWidth
        const cssH = wrap.clientHeight
        const w = Math.max(1, Math.floor(cssW * dpr))
        const h = Math.max(1, Math.floor(cssH * dpr))
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w
          canvas.height = h
        }
        gl.viewport(0, 0, w, h)
        medalRect = computeMedalRect(cssW, cssH, medalScaleRef.current, variantRef.current)
        ensureBgRevealSize(w, h)
      }

      const pointerToUv = (clientX: number, clientY: number) => {
        const rect = wrap.getBoundingClientRect()
        return {
          x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
          y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
        }
      }

      let isPointerDown = false
      let pointerDownX = 0
      let pointerDownY = 0
      let pointerMoved = false

      const canPaint = () => {
        if (reduced) return false
        if (variantRef.current === 'bento') return true
        return phaseRef.current !== 'unlocked'
      }

      const isInsideWrap = (clientX: number, clientY: number) => {
        const rect = wrap.getBoundingClientRect()
        return (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        )
      }

      const isOverMedalShape = (clientX: number, clientY: number) => {
        const uv = pointerToUv(clientX, clientY)
        const { mx, my } = screenToMedalUv(uv.x, uv.y, medalRect)
        return inMedalBox(mx, my) && isMedalAt(medalMask, texSize, mx, my)
      }

      /** flow screen 1: hover to erase, no press required */
      const isFlowHoverPaint = () =>
        variantRef.current === 'flow' && phaseRef.current !== 'unlocked'

      const paintAtClient = (clientX: number, clientY: number) => {
        const uv = pointerToUv(clientX, clientY)
        paintStrokeInterpolated(uv.x, uv.y)
      }

      const applyFlowHoverPaint = (clientX: number, clientY: number) => {
        if (!canPaint() || !isFlowHoverPaint() || isPointerDown) return
        if (!isInsideWrap(clientX, clientY) || !isOverMedalShape(clientX, clientY)) {
          lastUvRef.current = null
          lastPaintRef.current = 0
          return
        }
        paintAtClient(clientX, clientY)
      }

      paintHoverRef.current = applyFlowHoverPaint

      const onPointerDown = (e: PointerEvent) => {
        if (!canPaint()) return
        isPointerDown = true
        pointerMoved = false
        pointerDownX = e.clientX
        pointerDownY = e.clientY
        lastUvRef.current = null
        wrap.setPointerCapture(e.pointerId)
        paintAtClient(e.clientX, e.clientY)
      }

      const onPointerMove = (e: PointerEvent) => {
        if (!canPaint()) return

        if (isPointerDown) {
          const dist = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY)
          if (dist > 3) pointerMoved = true
          paintAtClient(e.clientX, e.clientY)
          return
        }

        applyFlowHoverPaint(e.clientX, e.clientY)
      }

      const onPointerUp = (e: PointerEvent) => {
        if (!isPointerDown) return
        isPointerDown = false
        lastUvRef.current = null
        if (wrap.hasPointerCapture(e.pointerId)) {
          wrap.releasePointerCapture(e.pointerId)
        }
        const dist = Math.hypot(e.clientX - pointerDownX, e.clientY - pointerDownY)
        if (!pointerMoved && dist < TAP_MOVE_PX && variantRef.current === 'bento') {
          onTapRef.current?.()
        }
        applyFlowHoverPaint(e.clientX, e.clientY)
      }

      const onPointerLeave = () => {
        isPointerDown = false
        lastUvRef.current = null
        lastPaintRef.current = 0
      }

      const onDocumentMove = (e: Event) => {
        if (!(e instanceof MouseEvent)) return
        if (e instanceof PointerEvent && e.pointerType === 'touch') return
        applyFlowHoverPaint(e.clientX, e.clientY)
      }

      const render = () => {
        if (disposed) return
        resize()

        if (!reduced) decayReveals()

        if (medalRevealDirty) {
          gl.activeTexture(gl.TEXTURE0 + 3)
          gl.bindTexture(gl.TEXTURE_2D, texReveal)
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textures.revealCanvas)
          medalRevealDirty = false
        }

        if (bgRevealDirty) {
          gl.activeTexture(gl.TEXTURE0 + 5)
          gl.bindTexture(gl.TEXTURE_2D, texBgReveal)
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textures.bgRevealCanvas)
          bgRevealDirty = false
        }

        const [r, g, b] = parseBgColor(wrap)
        const flowUnderlay = variantRef.current === 'flow' ? 1 : 0
        if (flowUnderlay) {
          gl.clearColor(0, 0, 0, 0)
        } else {
          gl.clearColor(r, g, b, 1)
        }
        gl.clear(gl.COLOR_BUFFER_BIT)

        gl.uniform3f(uBgColor, r, g, b)
        gl.uniform2f(uTexel, 1 / texSize, 1 / texSize)
        gl.uniform4f(uMedalRect, medalRect.left, medalRect.top, medalRect.w, medalRect.h)
        gl.uniform1f(uViewAspect, canvas.width / canvas.height)
        gl.uniform1f(uBgAspect, textures.backgroundAspect)
        gl.uniform1f(uFlowUnderlay, flowUnderlay)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

        raf = requestAnimationFrame(render)
      }

      resize()
      raf = requestAnimationFrame(render)

      wrap.addEventListener('pointerdown', onPointerDown)
      wrap.addEventListener('pointermove', onPointerMove, { passive: true })
      wrap.addEventListener('pointerup', onPointerUp)
      wrap.addEventListener('pointercancel', onPointerUp)
      wrap.addEventListener('pointerleave', onPointerLeave)

      if (variantRef.current === 'flow') {
        document.addEventListener('pointermove', onDocumentMove, { passive: true, capture: true })
        document.addEventListener('mousemove', onDocumentMove, { passive: true, capture: true })
      }

      const ro = new ResizeObserver(resize)
      ro.observe(wrap)

      cleanup = () => {
        cancelAnimationFrame(raf)
        wrap.removeEventListener('pointerdown', onPointerDown)
        wrap.removeEventListener('pointermove', onPointerMove)
        wrap.removeEventListener('pointerup', onPointerUp)
        wrap.removeEventListener('pointercancel', onPointerUp)
        wrap.removeEventListener('pointerleave', onPointerLeave)
        document.removeEventListener('pointermove', onDocumentMove, { capture: true })
        document.removeEventListener('mousemove', onDocumentMove, { capture: true })
        paintHoverRef.current = () => {}
        ro.disconnect()
        delete wrap.dataset.medalUnlocked
        texturesRef.current = null
        medalMaskRef.current = null
        medalRevealDirtyRef.current = null
        bgRevealDirtyRef.current = null
        gl.deleteProgram(program)
        gl.deleteBuffer(buf)
        gl.deleteTexture(texBase)
        gl.deleteTexture(texNormal)
        gl.deleteTexture(texHeight)
        gl.deleteTexture(texReveal)
        gl.deleteTexture(texBackground)
        gl.deleteTexture(texBgReveal)
      }
    })

    return () => {
      disposed = true
      cleanup?.()
    }
  }, [])

  const handleWrapMouseMove = (e: ReactMouseEvent) => {
    if (variantRef.current !== 'flow' || phaseRef.current === 'unlocked') return
    paintHoverRef.current(e.clientX, e.clientY)
  }

  const handleWrapMouseEnter = (e: ReactMouseEvent) => {
    if (variantRef.current !== 'flow' || phaseRef.current === 'unlocked') return
    lastPaintRef.current = 0
    lastUvRef.current = null
    paintHoverRef.current(e.clientX, e.clientY)
  }

  return (
    <div
      ref={wrapRef}
      className="pg-medal-relief-wrap"
      data-variant={variant}
      data-phase={variant === 'bento' ? 'bento' : phase}
      data-interactive={variant === 'bento' || phase !== 'unlocked' ? 'true' : 'false'}
      onMouseMove={handleWrapMouseMove}
      onMouseEnter={handleWrapMouseEnter}
    >
      <canvas ref={canvasRef} className="pg-medal-relief-canvas" />
    </div>
  )
})
