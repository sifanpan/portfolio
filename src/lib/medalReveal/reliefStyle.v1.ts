/**
 * Relief medal style v1 (frozen)
 * Snapshot dir: public/playground/medal/relief-style-v1/
 * Claim Medal demo uses this config — do not change casually; iterate as v2.
 */
export const RELIEF_STYLE_V1 = {
  version: 'v1',
  snapshotDir: 'public/playground/medal/relief-style-v1',

  /** exact match to card background */
  background: '#f2f2ee',

  relief: {
    lightDir: [0.44, -0.38, 0.84] as const,
    heightSpread: 3.0,
    formNormalZ: 0.26,
    detailNormalXY: 0.3,
    detailNormalZMin: 0.44,
    formDetailMix: 0.32,
    keyWrap: 0.3,
    keyDivisor: 1.3,
    keyPow: 0.62,
    shadowPow: 1.12,
    shadowDepth: 0.3,
    revealCutoff: 0.055,
    revealSmooth: [0.1, 0.92] as const,
  },

  eraser: {
    decayRgb: 236,
    revealSnap: 18,
    brushRadius: 0.22,
    decayPauseMs: 80,
    brushSpeckles: 18,
    strokeStepFactor: 0.28,
  },

  textures: {
    base: 'public/playground/medal/base.png',
    normal: 'public/playground/medal/normal.png',
    height: 'public/playground/medal/height.png',
    generateScript: 'scripts/generate-medal-normal.py',
    heightBlurRadius: 2.8,
    normalStrength: 3.2,
  },

  runtime: {
    vertexShader: 'src/lib/medalReveal/shaders.ts → MEDAL_VERT',
    fragmentShader: 'src/lib/medalReveal/shaders.ts → RELIEF_ERASE_FRAG',
    component: 'src/components/playground/MedalReliefCanvas.tsx',
    demo: 'src/components/playground/ClaimMedalDemo.tsx',
    css: 'src/index.css → .pg-medal-*',
  },
} as const

export const {
  decayRgb: RELIEF_V1_DECAY_RGB,
  revealSnap: RELIEF_V1_REVEAL_SNAP,
  brushRadius: RELIEF_V1_BRUSH_RADIUS,
  decayPauseMs: RELIEF_V1_DECAY_PAUSE_MS,
  brushSpeckles: RELIEF_V1_BRUSH_SPECKLES,
  strokeStepFactor: RELIEF_V1_STROKE_STEP,
} = RELIEF_STYLE_V1.eraser
