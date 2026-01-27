import { State, WorkloadSegment, Modulator, Transforms, PostProcessing, TimingControls, ColorControls, RandomControls, GeneratorParams, UISprite, Overlay, BlendControls, FlowSegment } from './types'
import { InputDispatcher } from './input'
import { RhythmDetector } from './rhythm'
import { FlowResolver } from './flow'
export * from './types'
export * from './ingestion'
export * from './rhythm'
export * from './input'
export * from './flow'
export * from './attractors'

export interface RendererCapabilities {
  id: string
  name: string
  supportedGenerators: string[]
  maxResolution: { width: number; height: number }
  costTier: 'low' | 'med' | 'high'
}

// Character sets for different generator types
const GENERATOR_CHARSETS: Record<string, string> = {
  nca: '◦○◎●◉█▓▒░ ',
  flow: '→↗↑↖←↙↓↘∙ ',
  noise: '░▒▓█▄▀▐▌ ',
  minimal: '·•● ',
  wave: '∿≈≋〜～ ',
  matrix: '01アイウエオカキクケコ ',
  blocks: '█▀▄▌▐░▒▓ ',
  dots: '⠁⠂⠄⠈⠐⠠⡀⢀⣀⣤⣶⣿ ',
  swirl: '◠◡◯◎●◉⊙⊚ ',
  moire: '╱╲╳░▒▓█ ',
  cells: '⬡⬢⎔⎕▣▤▥▦ ',
  kaleido: '✦✧◇◈◆❖ ',
  nebula: '·∘○◌◍◎● ',
  plasma: '░▒▓█▀▄▌▐ ',
  vortex: '◠◡◯◎●◉⊙⊚ ',
  tide: '∿≈≋〜～∼ ',
  dunes: '░▒▓█▄▀▌▐ ',
  orbit: '·∘○◌◍◎● ',
  ripple: '◦○◎●◉█▓▒░ ',
  glass: '✦✧◇◈◆❖ ',
  default: '@%#*+=-:. '
}

// Unified charset for Three.js renderer — every unique char across all generators + UI
function buildUnifiedCharset(): { charset: string; charToIndex: Map<string, number> } {
  const seen = new Set<string>()
  // Add all generator chars
  for (const chars of Object.values(GENERATOR_CHARSETS)) {
    for (const ch of chars) seen.add(ch)
  }
  // Add common UI/overlay chars
  const uiChars = '┌┐└┘─│═╔╗╚╝║╭╮╰╯█▀▄▌▐░▒▓●○◎◉◆◇◈❖✦✧▲▼◄►•·∘◌◍▽▣▤▥▦⬡⬢⎔⎕◠◡◯⊙⊚╱╲╳∿≈≋〜～⠁⠂⠄⠈⠐⠠⡀⢀⣀⣤⣶⣿→↗↑↖←↙↓↘∙'
  for (const ch of uiChars) seen.add(ch)
  // Space always at index 0
  seen.delete(' ')
  const charset = ' ' + Array.from(seen).sort().join('')
  const charToIndex = new Map<string, number>()
  for (let i = 0; i < charset.length; i++) {
    charToIndex.set(charset[i]!, i)
  }
  return { charset, charToIndex }
}

const { charset: UNIFIED_CHARSET_STR, charToIndex: CHAR_TO_UNIFIED_INDEX } = buildUnifiedCharset()

/** All unique characters used by generators and UI, suitable for building a font atlas. Space is index 0. */
export const UNIFIED_CHARSET = UNIFIED_CHARSET_STR

// Fast HSV → RGB (h in 0-1, s in 0-1, v in 0-1) → [r,g,b] each 0-1
function hsvToRgb01(h: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(h * 6) % 6
  const f = h * 6 - Math.floor(h * 6)
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  switch (i) {
    case 0: return [v, t, p]
    case 1: return [q, v, p]
    case 2: return [p, v, t]
    case 3: return [p, q, v]
    case 4: return [t, p, v]
    default: return [v, p, q]
  }
}

// Modulator sources - compute values based on time
export type ModulatorSource = 'sine' | 'saw' | 'square' | 'triangle' | 'random' | 'beat'

export function computeModulator(source: ModulatorSource, time: number, rateHz: number, depth: number): number {
  const phase = (time * rateHz) % 1
  let value: number

  switch (source) {
    case 'sine':
      value = (Math.sin(phase * Math.PI * 2) + 1) / 2
      break
    case 'saw':
      value = phase
      break
    case 'square':
      value = phase < 0.5 ? 0 : 1
      break
    case 'triangle':
      value = phase < 0.5 ? phase * 2 : 2 - phase * 2
      break
    case 'random':
      value = Math.random()
      break
    case 'beat':
      value = Math.pow(1 - phase, 3)
      break
    default:
      value = 0.5
  }

  return value * depth
}

// Interpolate between two values
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

// Interpolate colors (hex strings)
function lerpColor(a: string, b: string, t: number): string {
  const parseHex = (h: string) => {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h)
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [0, 0, 0]
  }
  const [r1, g1, b1] = parseHex(a)
  const [r2, g2, b2] = parseHex(b)
  const r = Math.round(lerp(r1, r2, t))
  const g = Math.round(lerp(g1, g2, t))
  const bl = Math.round(lerp(b1, b2, t))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`
}

// Seeded random number generator
class SeededRandom {
  private seed: number
  constructor(seed: number) {
    this.seed = seed
  }
  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff
    return this.seed / 0x7fffffff
  }
  setSeed(seed: number) {
    this.seed = seed
  }
}

export class VJEngine {
  private currentState: State | null = null
  private grid: string[][] = []
  private width: number = 80
  private height: number = 40
  private registeredRenderers: Map<string, RendererCapabilities> = new Map()
  private inputDispatcher: InputDispatcher = new InputDispatcher()
  private rhythmDetector: RhythmDetector = new RhythmDetector()
  private showUI: boolean = true

  // Generator state (supports multiple)
  private generators: Array<{ id: string; weight: number; params: GeneratorParams }> = [
    { id: 'default', weight: 0.5, params: {} }
  ]

  // Animation speed (1.0 = normal)
  private animationSpeed: number = 1.0

  // Transition state
  private transitionProgress: number = 1.0 // 1.0 = no transition
  private transitionDuration: number = 0
  private transitionStartTime: number = 0
  private previousState: {
    generators: Array<{ id: string; weight: number; params: GeneratorParams }>
    colors: string[]
  } | null = null

  // Active modulators
  private activeModulators: Modulator[] = []

  // Current colors (for transitions)
  private currentColors: string[] = ['#00ff00', '#000000']

  // NEW: Transforms
  private transforms: Transforms = {}

  // NEW: Post-processing
  private postProcessing: PostProcessing = {}

  // NEW: Timing controls
  private timing: TimingControls = {}

  // NEW: Color controls
  private colorControls: ColorControls = {}

  // NEW: Random controls
  private randomControls: RandomControls = {}
  private rng: SeededRandom = new SeededRandom(Date.now())

  // NEW: Feedback buffer for trails
  private feedbackBuffer: number[][] = []

  // NEW: Frame counter for effects
  private frameCount: number = 0

  // Precomputed normalized coordinate grids
  private Xc: Float32Array = new Float32Array(0)  // [-0.5, 0.5]
  private Yc: Float32Array = new Float32Array(0)  // [-0.5, 0.5]
  private R: Float32Array = new Float32Array(0)   // radial distance
  private A: Float32Array = new Float32Array(0)   // polar angle

  // Statistical normalization (prev frame min/max per generator)
  private prevMinMax: Map<string, { min: number; max: number }> = new Map()

  // Per-cell buffers for GPU renderer
  private intensityBuffer: Float32Array = new Float32Array(0)
  private charIndexBuffer: Uint16Array = new Uint16Array(0)
  private colorBuffer: Float32Array = new Float32Array(0) // RGB per cell (width*height*3)

  // Overlay - State + blend controls, composited with art
  private overlay: Overlay | null = null
  private overlayFadeStart: number = 0
  private overlayFading: 'in' | 'out' | null = null

  constructor(width: number = 80, height: number = 40) {
    this.width = width
    this.height = height
    this.initGrid()
    this.initFeedbackBuffer()
  }

  private initFeedbackBuffer() {
    this.feedbackBuffer = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => 0)
    )
  }

  public handleInput(key: string): string | null {
    const intent = this.inputDispatcher.dispatch(key)
    if (!intent) return null

    switch (intent) {
      case 'GEN_WEIGHT_INC':
        if (this.generators[0]) this.generators[0].weight = Math.min(1.0, this.generators[0].weight + 0.05)
        break
      case 'GEN_WEIGHT_DEC':
        if (this.generators[0]) this.generators[0].weight = Math.max(0.0, this.generators[0].weight - 0.05)
        break
      case 'UI_TOGGLE':
        this.showUI = !this.showUI
        break
      case 'RHYTHM_TAP':
        this.rhythmDetector.tap()
        break
      case 'CLEAR':
        this.initGrid()
        break
      case 'SPEED_UP':
        this.animationSpeed = Math.min(3.0, this.animationSpeed + 0.25)
        break
      case 'SPEED_DOWN':
        this.animationSpeed = Math.max(0.25, this.animationSpeed - 0.25)
        break
      case 'ROTATE_CW':
        this.transforms.rotation = ((this.transforms.rotation ?? 0) + 0.1) % (Math.PI * 2)
        break
      case 'ROTATE_CCW':
        this.transforms.rotation = ((this.transforms.rotation ?? 0) - 0.1 + Math.PI * 2) % (Math.PI * 2)
        break
      case 'ZOOM_IN':
        this.transforms.scale = Math.min(4.0, (this.transforms.scale ?? 1) + 0.1)
        break
      case 'ZOOM_OUT':
        this.transforms.scale = Math.max(0.25, (this.transforms.scale ?? 1) - 0.1)
        break
      case 'MIRROR_H':
        this.transforms.mirror = { ...this.transforms.mirror, horizontal: !this.transforms.mirror?.horizontal }
        break
      case 'MIRROR_V':
        this.transforms.mirror = { ...this.transforms.mirror, vertical: !this.transforms.mirror?.vertical }
        break
      case 'INVERT':
        this.postProcessing.invert = !this.postProcessing.invert
        break
      case 'FREEZE':
        this.timing.freeze = !this.timing.freeze
        break
      case 'GLITCH':
        this.randomControls.glitch = this.randomControls.glitch?.probability ? {} : { probability: 0.3, intensity: 0.5 }
        break
    }
    return intent
  }

  public registerRenderer(capabilities: RendererCapabilities) {
    this.registeredRenderers.set(capabilities.id, capabilities)
  }

  public getCapabilities(): RendererCapabilities[] {
    return Array.from(this.registeredRenderers.values())
  }

  private initGrid() {
    this.grid = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => ' ')
    )
    this.initCoords()
  }

  private initCoords() {
    const size = this.width * this.height
    this.Xc = new Float32Array(size)
    this.Yc = new Float32Array(size)
    this.R = new Float32Array(size)
    this.A = new Float32Array(size)
    this.intensityBuffer = new Float32Array(size)
    this.charIndexBuffer = new Uint16Array(size)
    this.colorBuffer = new Float32Array(size * 3)
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const i = y * this.width + x
        const nx = (x / this.width) - 0.5
        const ny = (y / this.height) - 0.5
        this.Xc[i] = nx
        this.Yc[i] = ny
        this.R[i] = Math.sqrt(nx * nx + ny * ny) + 1e-6
        this.A[i] = Math.atan2(ny, nx)
      }
    }
  }

  public applyWorkload(workload: WorkloadSegment) {
    // Store previous state for transitions
    if (workload.transition?.duration_seconds && workload.transition.duration_seconds > 0) {
      this.previousState = {
        generators: [...this.generators],
        colors: [...this.currentColors]
      }
      this.transitionDuration = workload.transition.duration_seconds
      this.transitionStartTime = Date.now()
      this.transitionProgress = 0
    } else {
      this.transitionProgress = 1.0
      this.previousState = null
    }

    this.currentState = workload.state

    // Resolution
    if (this.currentState.field_program.resolution) {
      this.width = this.currentState.field_program.resolution.width
      this.height = this.currentState.field_program.resolution.height
      this.initGrid()
    }

    // Animation speed
    if (this.currentState.field_program.update_rate_hz) {
      this.animationSpeed = this.currentState.field_program.update_rate_hz / 10 // 10hz = 1x speed
    }

    // Generators (supports multiple) — merge incoming params with existing
    // so that params not in the new segment retain their current value
    if (this.currentState.field_program.generators.length > 0) {
      const prevMap = new Map(this.generators.map(g => [g.id, g.params]))
      this.generators = this.currentState.field_program.generators.map(g => ({
        id: g.id,
        weight: g.weight ?? 0.5,
        params: { ...(prevMap.get(g.id) ?? {}), ...(g.params ?? {}) },
      }))
    }

    // Colors
    if (this.currentState.palette?.colors) {
      this.currentColors = this.currentState.palette.colors
    }

    // Modulators
    this.activeModulators = workload.modulators ?? []

    // NEW: Transforms
    if (this.currentState.field_program.transforms) {
      this.transforms = { ...this.transforms, ...this.currentState.field_program.transforms }
    }

    // NEW: Post-processing
    if (this.currentState.field_program.post_processing) {
      this.postProcessing = { ...this.postProcessing, ...this.currentState.field_program.post_processing }
    }

    // NEW: Timing
    if (this.currentState.field_program.timing) {
      this.timing = { ...this.timing, ...this.currentState.field_program.timing }
    }

    // NEW: Color controls
    if (this.currentState.field_program.color_controls) {
      this.colorControls = { ...this.colorControls, ...this.currentState.field_program.color_controls }
    }

    // NEW: Random controls
    if (this.currentState.field_program.random) {
      this.randomControls = { ...this.randomControls, ...this.currentState.field_program.random }
      if (this.randomControls.seed) {
        this.rng.setSeed(this.randomControls.seed)
      }
    }

    this.update()
  }

  private applyModulators(time: number) {
    for (const mod of this.activeModulators) {
      const value = computeModulator(
        mod.source as ModulatorSource,
        time,
        mod.rate_hz ?? 1,
        mod.depth ?? 1
      )
      const mapped = lerp(mod.range[0], mod.range[1], value)

      // Apply to target path
      const path = mod.target_path.split('.')
      if (path[0] === 'generators' && path[1]) {
        const match = path[1].match(/\[(\d+)\]/)
        if (match) {
          const idx = parseInt(match[1])
          const prop = path[2]
          if (this.generators[idx] && prop === 'weight') {
            this.generators[idx].weight = mapped
          }
        }
      } else if (path[0] === 'speed') {
        this.animationSpeed = mapped
      }
    }
  }

  private updateTransition() {
    if (this.transitionProgress >= 1.0) return

    const elapsed = (Date.now() - this.transitionStartTime) / 1000
    this.transitionProgress = Math.min(1.0, elapsed / this.transitionDuration)
  }

  private getEffectiveWeight(genIndex: number): number {
    const current = this.generators[genIndex]?.weight ?? 0
    if (!this.previousState || this.transitionProgress >= 1.0) return current
    const prev = this.previousState.generators[genIndex]?.weight ?? 0
    return lerp(prev, current, this.transitionProgress)
  }

  private getEffectiveColors(): string[] {
    if (!this.previousState || this.transitionProgress >= 1.0) return this.currentColors
    return this.currentColors.map((c, i) =>
      lerpColor(this.previousState!.colors[i] ?? '#000000', c, this.transitionProgress)
    )
  }

  private drawUI() {
    if (!this.currentState?.ui || !this.showUI) return

    this.currentState.ui.forEach(sprite => {
      const { rect } = sprite.region
      const startX = Math.floor(rect[0] * this.width)
      const startY = Math.floor(rect[1] * this.height)

      sprite.render.glyph_rows.forEach((row, dy) => {
        for (let dx = 0; dx < row.length; dx++) {
          const x = startX + dx
          const y = startY + dy
          if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.grid[y]![x] = row[dx]!
          }
        }
      })
    })
  }

  // Apply coordinate transforms
  private transformCoords(x: number, y: number): [number, number] {
    // Normalize to -1 to 1
    let nx = (x / this.width) * 2 - 1
    let ny = (y / this.height) * 2 - 1

    // Apply pan
    if (this.transforms.pan) {
      nx -= this.transforms.pan[0]
      ny -= this.transforms.pan[1]
    }

    // Apply scale (zoom)
    const scale = this.transforms.scale ?? 1
    nx /= scale
    ny /= scale

    // Apply rotation
    if (this.transforms.rotation) {
      const cos = Math.cos(this.transforms.rotation)
      const sin = Math.sin(this.transforms.rotation)
      const rx = nx * cos - ny * sin
      const ry = nx * sin + ny * cos
      nx = rx
      ny = ry
    }

    // Convert back to grid coordinates
    let gx = ((nx + 1) / 2) * this.width
    let gy = ((ny + 1) / 2) * this.height

    // Apply mirror
    if (this.transforms.mirror) {
      if (this.transforms.mirror.horizontal && gx > this.width / 2) {
        gx = this.width - gx
      }
      if (this.transforms.mirror.vertical && gy > this.height / 2) {
        gy = this.height - gy
      }
      if (this.transforms.mirror.diagonal) {
        if (gx > gy) {
          const tmp = gx
          gx = gy
          gy = tmp
        }
      }
      if (this.transforms.mirror.kaleidoscope && this.transforms.mirror.kaleidoscope > 1) {
        const segments = this.transforms.mirror.kaleidoscope
        const angle = Math.atan2(ny, nx)
        const radius = Math.sqrt(nx * nx + ny * ny)
        const segmentAngle = (Math.PI * 2) / segments
        let newAngle = angle % segmentAngle
        if (Math.floor(angle / segmentAngle) % 2 === 1) {
          newAngle = segmentAngle - newAngle
        }
        gx = ((Math.cos(newAngle) * radius + 1) / 2) * this.width
        gy = ((Math.sin(newAngle) * radius + 1) / 2) * this.height
      }
    }

    return [gx, gy]
  }

  // Apply color transformations
  private transformColor(hex: string): string {
    let [r, g, b] = this.parseHex(hex)

    // Brightness
    if (this.colorControls.brightness !== undefined) {
      const adj = this.colorControls.brightness * 255
      r = Math.max(0, Math.min(255, r + adj))
      g = Math.max(0, Math.min(255, g + adj))
      b = Math.max(0, Math.min(255, b + adj))
    }

    // Contrast
    if (this.colorControls.contrast !== undefined) {
      const factor = this.colorControls.contrast
      r = Math.max(0, Math.min(255, (r - 128) * factor + 128))
      g = Math.max(0, Math.min(255, (g - 128) * factor + 128))
      b = Math.max(0, Math.min(255, (b - 128) * factor + 128))
    }

    // Saturation
    if (this.colorControls.saturation !== undefined) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b
      const sat = this.colorControls.saturation
      r = Math.max(0, Math.min(255, gray + (r - gray) * sat))
      g = Math.max(0, Math.min(255, gray + (g - gray) * sat))
      b = Math.max(0, Math.min(255, gray + (b - gray) * sat))
    }

    // Hue rotate
    if (this.colorControls.hue_rotate !== undefined) {
      const [h, s, l] = this.rgbToHsl(r, g, b)
      const newH = (h + this.colorControls.hue_rotate / 360) % 1
      ;[r, g, b] = this.hslToRgb(newH, s, l)
    }

    // Invert
    if (this.postProcessing.invert) {
      r = 255 - r
      g = 255 - g
      b = 255 - b
    }

    return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`
  }

  private parseHex(hex: string): [number, number, number] {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [0, 0, 0]
  }

  private rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255; g /= 255; b /= 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h = 0, s = 0
    const l = (max + min) / 2
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
      }
    }
    return [h, s, l]
  }

  private hslToRgb(h: number, s: number, l: number): [number, number, number] {
    let r, g, b
    if (s === 0) {
      r = g = b = l
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1/6) return p + (q - p) * 6 * t
        if (t < 1/2) return q
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
        return p
      }
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1/3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1/3)
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
  }

  // Apply glitch effect
  private applyGlitch() {
    if (!this.randomControls.glitch?.probability) return
    if (this.rng.next() > this.randomControls.glitch.probability) return

    const intensity = this.randomControls.glitch.intensity ?? 0.5
    const types = this.randomControls.glitch.types ?? ['shift', 'noise']
    const type = types[Math.floor(this.rng.next() * types.length)]

    switch (type) {
      case 'shift': {
        // Horizontal line shift
        const numLines = Math.floor(this.height * intensity * 0.3)
        for (let i = 0; i < numLines; i++) {
          const y = Math.floor(this.rng.next() * this.height)
          const shift = Math.floor((this.rng.next() - 0.5) * this.width * intensity)
          const row = [...this.grid[y]!]
          for (let x = 0; x < this.width; x++) {
            const srcX = (x - shift + this.width) % this.width
            this.grid[y]![x] = row[srcX]!
          }
        }
        break
      }
      case 'noise': {
        // Random noise burst
        const chars = '░▒▓█▄▀▐▌'
        const numPixels = Math.floor(this.width * this.height * intensity * 0.1)
        for (let i = 0; i < numPixels; i++) {
          const x = Math.floor(this.rng.next() * this.width)
          const y = Math.floor(this.rng.next() * this.height)
          this.grid[y]![x] = chars[Math.floor(this.rng.next() * chars.length)]!
        }
        break
      }
      case 'corrupt': {
        // Character corruption
        const numChars = Math.floor(this.width * this.height * intensity * 0.05)
        for (let i = 0; i < numChars; i++) {
          const x = Math.floor(this.rng.next() * this.width)
          const y = Math.floor(this.rng.next() * this.height)
          const charCode = 0x2500 + Math.floor(this.rng.next() * 0x80)
          this.grid[y]![x] = String.fromCharCode(charCode)
        }
        break
      }
      case 'slice': {
        // Slice and offset blocks
        const sliceHeight = Math.floor(this.height * 0.1 + this.rng.next() * this.height * 0.2)
        const startY = Math.floor(this.rng.next() * (this.height - sliceHeight))
        const offset = Math.floor((this.rng.next() - 0.5) * this.width * intensity)
        for (let y = startY; y < startY + sliceHeight && y < this.height; y++) {
          const row = [...this.grid[y]!]
          for (let x = 0; x < this.width; x++) {
            const srcX = (x - offset + this.width) % this.width
            this.grid[y]![x] = row[srcX]!
          }
        }
        break
      }
    }
  }

  // Apply blur effect (character averaging)
  private applyBlur() {
    if (!this.postProcessing.blur || this.postProcessing.blur <= 0) return

    const blurAmount = this.postProcessing.blur
    const density: number[][] = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => 0)
    )

    // Calculate density
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        density[y]![x] = this.grid[y]![x] === ' ' ? 0 : 1
      }
    }

    // Box blur
    const radius = Math.ceil(blurAmount * 2)
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let sum = 0, count = 0
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const ny = y + dy, nx = x + dx
            if (ny >= 0 && ny < this.height && nx >= 0 && nx < this.width) {
              sum += density[ny]![nx]!
              count++
            }
          }
        }
        const avgDensity = sum / count
        if (avgDensity < blurAmount * 0.3 && this.grid[y]![x] !== ' ') {
          this.grid[y]![x] = ' '
        }
      }
    }
  }

  // Apply feedback/trails effect
  private applyFeedback() {
    if (!this.postProcessing.feedback?.amount) return

    const amount = this.postProcessing.feedback.amount
    const decay = this.postProcessing.feedback.decay ?? 0.9
    const offset = this.postProcessing.feedback.offset ?? [0, 0]

    // Update feedback buffer
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // Add current frame to buffer
        if (this.grid[y]![x] !== ' ') {
          this.feedbackBuffer[y]![x] = 1
        }
        // Decay old values
        this.feedbackBuffer[y]![x] *= decay
      }
    }

    // Apply feedback with offset
    const chars = '░▒▓'
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const srcY = Math.floor(y - offset[1] + this.height) % this.height
        const srcX = Math.floor(x - offset[0] + this.width) % this.width
        const feedbackVal = this.feedbackBuffer[srcY]![srcX]!

        if (this.grid[y]![x] === ' ' && feedbackVal > 0.1 && this.rng.next() < feedbackVal * amount) {
          const charIdx = Math.floor(feedbackVal * (chars.length - 1))
          this.grid[y]![x] = chars[charIdx]!
        }
      }
    }
  }

  // Apply strobe effect
  private isStrobeOn(time: number): boolean {
    if (!this.postProcessing.strobe?.rate_hz) return true
    const period = 1 / this.postProcessing.strobe.rate_hz
    const duty = this.postProcessing.strobe.duty ?? 0.5
    const phase = (time % period) / period
    return phase < duty
  }

  // Apply scanlines
  private applyScanlines() {
    if (!this.postProcessing.scanlines?.density) return
    const density = this.postProcessing.scanlines.density
    const intensity = this.postProcessing.scanlines.intensity ?? 0.5
    const lineGap = Math.max(2, Math.floor(1 / density))

    for (let y = 0; y < this.height; y++) {
      if (y % lineGap === 0) {
        for (let x = 0; x < this.width; x++) {
          if (this.rng.next() < intensity) {
            this.grid[y]![x] = ' '
          }
        }
      }
    }
  }

  // Apply pixelate
  private applyPixelate() {
    if (!this.postProcessing.pixelate || this.postProcessing.pixelate <= 1) return
    const size = Math.floor(this.postProcessing.pixelate)

    for (let by = 0; by < this.height; by += size) {
      for (let bx = 0; bx < this.width; bx += size) {
        // Get dominant character in block
        const chars: Record<string, number> = {}
        for (let dy = 0; dy < size && by + dy < this.height; dy++) {
          for (let dx = 0; dx < size && bx + dx < this.width; dx++) {
            const c = this.grid[by + dy]![bx + dx]!
            chars[c] = (chars[c] || 0) + 1
          }
        }
        const dominant = Object.entries(chars).sort((a, b) => b[1] - a[1])[0]?.[0] || ' '
        // Fill block with dominant
        for (let dy = 0; dy < size && by + dy < this.height; dy++) {
          for (let dx = 0; dx < size && bx + dx < this.width; dx++) {
            this.grid[by + dy]![bx + dx] = dominant
          }
        }
      }
    }
  }

  // Apply color cycling (returns modified colors)
  private getCycledColors(time: number): string[] {
    if (!this.colorControls.color_cycle?.rate_hz) return this.getEffectiveColors()

    const colors = this.getEffectiveColors()
    const rate = this.colorControls.color_cycle.rate_hz
    const range = this.colorControls.color_cycle.range ?? [0, 360]
    const hueOffset = ((time * rate * (range[1] - range[0])) % (range[1] - range[0])) + range[0]

    return colors.map(c => {
      const [r, g, b] = this.parseHex(c)
      const [h, s, l] = this.rgbToHsl(r, g, b)
      const newH = (h + hueOffset / 360) % 1
      const [nr, ng, nb] = this.hslToRgb(newH, s, l)
      return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`
    })
  }

  // Apply auto-variation
  private applyAutoVariation(time: number) {
    if (!this.randomControls.auto_vary?.enabled) return

    const rate = this.randomControls.auto_vary.rate_hz ?? 1
    const amount = this.randomControls.auto_vary.amount ?? 0.1
    const targets = this.randomControls.auto_vary.targets ?? ['weight']

    // Only vary at rate intervals
    if (Math.floor(time * rate) !== Math.floor((time - 0.1) * rate)) {
      for (const target of targets) {
        if (target === 'weight' && this.generators[0]) {
          const variation = (this.rng.next() - 0.5) * 2 * amount
          this.generators[0].weight = Math.max(0, Math.min(1, this.generators[0].weight + variation))
        } else if (target === 'speed') {
          const variation = (this.rng.next() - 0.5) * 2 * amount
          this.animationSpeed = Math.max(0.1, Math.min(5, this.animationSpeed + variation))
        }
      }
    }
  }

  // Get timing-adjusted time
  private getAdjustedTime(baseTime: number): number {
    if (this.timing.freeze) return 0

    let time = baseTime

    // Apply tempo multiplier
    if (this.timing.tempo_mult !== undefined) {
      time *= this.timing.tempo_mult
    }

    // Apply phase offset
    if (this.timing.phase_offset !== undefined) {
      const beatDuration = 60 / this.rhythmDetector.getTempo()
      time += this.timing.phase_offset * beatDuration
    }

    // Apply swing (affects odd beats)
    if (this.timing.swing !== undefined && this.timing.swing > 0) {
      const beatDuration = 60 / this.rhythmDetector.getTempo()
      const beatPhase = (time / beatDuration) % 2
      if (beatPhase > 1) {
        const swing = this.timing.swing * 0.333 // Max 1/3 beat shift
        time -= swing * beatDuration
      }
    }

    return time
  }

  // Generate pattern for a single generator using normalized coordinates
  private generatePattern(genId: string, nx: number, ny: number, r: number, a: number, time: number, params: GeneratorParams): number {
    const speed = params.speed ?? 1.0
    const scale = params.scale ?? 1.0
    const offset = params.offset ?? 0
    const direction = params.direction ?? 0
    const chaos = params.chaos ?? 0
    const density = params.density ?? 1.0
    const freqX = params.freqX ?? scale
    const freqY = params.freqY ?? scale
    const warp = params.warp ?? 0.8
    const spin = params.spin ?? 0.6
    const drift = params.drift ?? 0.3
    const noise = params.noise ?? 0
    const tt = time * speed + offset

    // Apply global chaos
    const globalChaos = this.randomControls.chaos ?? 0
    const chaosVal = chaos + globalChaos
    const chaosOffset = chaosVal > 0 ? (this.rng.next() - 0.5) * chaosVal * 0.5 : 0

    // Apply direction rotation to normalized coordinates
    const cos = Math.cos(direction)
    const sin = Math.sin(direction)
    const X = nx * cos - ny * sin
    const Y = nx * sin + ny * cos

    let value: number

    switch (genId) {
      case 'nca':
        // Organic cellular automata-like pattern
        value = Math.sin((X + Y) * (6 + warp * 4) + tt * 0.8)
            + Math.sin(r * (8 + warp * 3) - tt * 0.5)
        break

      case 'flow':
        // Drift-based directional flow
        value = Math.sin((X + tt * drift) * (8 + warp * 6))
            + Math.sin((Y - tt * drift) * (6 + warp * 5))
        break

      case 'wave':
        // Sine waves with independent frequencies
        value = Math.sin(X * freqX * 10 + tt * 2)
            + Math.sin(Y * freqY * 8 - tt * 1.5)
        break

      case 'matrix':
        // Digital rain
        value = ((Y * 6 + tt * 3 + this.rng.next() * 0.5) % 1) * 2 - 1
        break

      case 'dots':
        // Braille density
        value = Math.sin(X * freqX * 10) * Math.cos(Y * freqY * 10 + tt)
        break

      case 'blocks':
        // Chunky blocks
        value = Math.sin(Math.floor(X * 8) * freqX + Math.floor(Y * 8) * freqY + tt)
        break

      case 'noise':
        // Pure noise
        value = this.rng.next() * 2 - 1
        break

      case 'minimal':
        // Sparse dots
        value = Math.pow(this.rng.next(), 3) * 2 - 1
        break

      // === NEW GENERATORS ===

      case 'swirl':
        // Swirl / vortex — spiral arms with rotational motion
        value = Math.sin(r * (8 + warp * 6) - tt * (2 + spin))
            + Math.cos(a * (3 + spin * 4) + tt * 1.3)
        break

      case 'moire':
        // Moiré / interference — overlapping wave grids
        value = Math.sin(X * (12 + warp * 6) + tt * 1.2)
            * Math.cos(Y * (10 + warp * 6) - tt * 0.9)
            + Math.sin((X + Y) * (8 + drift * 5) + tt * 0.7)
        break

      case 'cells':
        // Cells / crystal — sharp cellular structures
        value = Math.abs(Math.sin(X * (9 + warp * 5) + tt * 1.1))
            + Math.abs(Math.cos(Y * (7 + warp * 4) - tt * 0.8))
            * Math.sign(Math.sin((X + Y) * 5 + tt))
        break

      case 'kaleido':
        // Kaleidoscope / glass — symmetric reflections
        value = Math.sin((Math.abs(X) * 10 + Math.abs(Y) * 12) + tt * 1.1)
            + Math.cos((Math.abs(X) - Math.abs(Y)) * 8 - tt * 0.9)
        break

      case 'nebula':
        // Nebula / aurora — smooth radial breathing
        value = Math.sin(r * (10 + warp * 7) - tt * 0.7)
            + Math.cos((X - Y) * 6 + tt * 0.5)
        break

      case 'plasma':
        // Classic plasma — additive sine fields
        value = Math.sin(X * (10 + warp * 6) + tt)
            + Math.sin(Y * (10 + warp * 6) + tt)
            + Math.sin((X + Y) * (6 + drift * 4) + tt * 0.8)
        break

      case 'vortex':
        // Vortex — tight spiral arms with angular velocity
        value = Math.sin(a * (5 + spin * 3) + r * warp * 8 - tt * (2 + spin))
            + Math.cos(r * 6 - tt)
        break

      case 'tide':
        // Tide — horizontal waves modulated by vertical sine
        value = Math.sin(X * 8 + Math.sin(Y * 3 + tt * drift) * warp * 4 + tt)
            + Math.sin(Y * 6 - tt * 0.7)
        break

      case 'dunes':
        // Dunes — layered sand ridges
        value = Math.sin(X * freqX * 10 + Math.sin(Y * 2) * warp * 3)
            * Math.cos(Y * freqY * 6 + tt * drift)
        break

      case 'orbit':
        // Orbit — concentric rings with angular wobble
        value = Math.sin(a * (4 + spin * 3) + tt * spin)
            * Math.cos(r * (6 + warp * 4) - tt * 0.8)
            + Math.sin(r * 10 - tt)
        break

      case 'ripple':
        // Ripple — radial waves with amplitude decay
        value = Math.sin(r * (12 + warp * 8) - tt * (2 + speed))
            / (r * 4 + 1)
        break

      case 'glass':
        // Glass — faceted symmetric refractions
        value = Math.sin((Math.abs(X) + Math.abs(Y)) * (10 + warp * 6) + tt)
            * Math.cos(Math.abs(X) * Math.abs(Y) * 20 - tt * 0.6)
        break

      default:
        // Fallback
        value = Math.sin((X + Y) * freqX * 6 + tt)
    }

    // Deterministic noise injection
    if (noise > 0) {
      value += Math.sin((nx * 13 + ny * 17) + time * 1.7) * noise
    }

    return Math.max(0, Math.min(1, (value * 0.5 + 0.5 + chaosOffset) * density))
  }

  public update() {
    if (!this.currentState) return

    this.frameCount++

    const baseTime = Date.now() * 0.001 * this.animationSpeed
    const time = this.getAdjustedTime(baseTime)
    const tempo = this.rhythmDetector.getTempo()
    const pulseScale = (Math.sin(time * (tempo / 60) * Math.PI * 2) + 1) / 2

    // Check strobe
    if (!this.isStrobeOn(baseTime)) {
      // Clear to strobe color or black
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          this.grid[y]![x] = ' '
        }
      }
      this.drawUI()
      return
    }

    // Apply modulators
    this.applyModulators(time)

    // Apply auto-variation
    this.applyAutoVariation(time)

    // Update transition
    this.updateTransition()

    // Reset seeded RNG each frame for consistency
    if (this.randomControls.seed) {
      this.rng.setSeed(this.randomControls.seed + this.frameCount)
    }

    // Clear grid and buffers
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.grid[y]![x] = ' '
      }
    }
    this.intensityBuffer.fill(0)
    this.charIndexBuffer.fill(0)
    this.colorBuffer.fill(0)

    // Render each generator (blended) with statistical normalization
    for (let genIdx = 0; genIdx < this.generators.length; genIdx++) {
      const gen = this.generators[genIdx]!
      const chars = GENERATOR_CHARSETS[gen.id] || GENERATOR_CHARSETS.default
      const effectiveWeight = this.getEffectiveWeight(genIdx) * (0.8 + 0.4 * pulseScale)

      // Get previous frame's min/max for normalization
      const prev = this.prevMinMax.get(gen.id) ?? { min: 0, max: 1 }
      let frameMin = Infinity
      let frameMax = -Infinity

      // Raw value buffer for normalization
      const rawValues = new Float32Array(this.width * this.height)

      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const [tx, ty] = this.transformCoords(x, y)
          // Map transformed coords back to normalized space
          const tnx = (tx / this.width) - 0.5
          const tny = (ty / this.height) - 0.5
          const tr = Math.sqrt(tnx * tnx + tny * tny) + 1e-6
          const ta = Math.atan2(tny, tnx)

          const raw = this.generatePattern(gen.id, tnx, tny, tr, ta, time, gen.params)
          const idx = y * this.width + x
          rawValues[idx] = raw
          if (raw < frameMin) frameMin = raw
          if (raw > frameMax) frameMax = raw
        }
      }

      // Update normalization stats for next frame
      this.prevMinMax.set(gen.id, {
        min: frameMin === Infinity ? 0 : frameMin,
        max: frameMax === -Infinity ? 1 : frameMax,
      })

      // Normalize using previous frame's range (Option B)
      const range = prev.max - prev.min
      const invRange = range > 0.001 ? 1 / range : 1

      // Read HSV + charGamma params from generator
      const hueShift = gen.params.hueShift ?? 0.3
      const hueRange = gen.params.hueRange ?? 0.8
      const hueSpeed = gen.params.hueSpeed ?? 0.05
      const genSat = gen.params.sat ?? 0.8
      const genVal = gen.params.val ?? 0.85
      const charGamma = gen.params.charGamma ?? 1.0

      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const idx = y * this.width + x
          const pattern = Math.max(0, Math.min(1, (rawValues[idx]! - prev.min) * invRange))
          const threshold = this.rng.next()

          if (threshold < effectiveWeight * pattern) {
            // Apply charGamma to character index
            const gammaPattern = charGamma !== 1.0 ? Math.pow(pattern, charGamma) : pattern
            const charIdx = Math.floor(gammaPattern * (chars.length - 1))
            if (this.grid[y]![x] === ' ' || genIdx === 0) {
              const ch = chars[Math.min(charIdx, chars.length - 1)]!
              this.grid[y]![x] = ch
              this.intensityBuffer[idx] = pattern
              this.charIndexBuffer[idx] = CHAR_TO_UNIFIED_INDEX.get(ch) ?? 0

              // Per-cell HSV → RGB color
              const hue = ((pattern * hueRange + hueShift + time * hueSpeed) % 1.0 + 1.0) % 1.0
              let [cr, cg, cb] = hsvToRgb01(hue, genSat, genVal * pattern)

              // Apply brightness/contrast from colorControls
              if (this.colorControls.brightness !== undefined) {
                cr += this.colorControls.brightness
                cg += this.colorControls.brightness
                cb += this.colorControls.brightness
              }
              if (this.colorControls.contrast !== undefined) {
                const c = this.colorControls.contrast
                cr = (cr - 0.5) * c + 0.5
                cg = (cg - 0.5) * c + 0.5
                cb = (cb - 0.5) * c + 0.5
              }

              const ci = idx * 3
              this.colorBuffer[ci] = Math.max(0, Math.min(1, cr))
              this.colorBuffer[ci + 1] = Math.max(0, Math.min(1, cg))
              this.colorBuffer[ci + 2] = Math.max(0, Math.min(1, cb))
            }
          }
        }
      }
    }

    // Apply post-processing effects in order
    this.applyFeedback()
    this.applyBlur()
    this.applyPixelate()
    this.applyScanlines()
    this.applyGlitch()

    this.drawUI()
    this.drawOverlay()
  }

  private drawOverlay() {
    if (!this.overlay?.state?.ui) return
    const opacity = this.getOverlayOpacity()
    if (opacity <= 0) return

    this.overlay.state.ui.forEach(sprite => {
      if (sprite.visibility && !sprite.visibility.visible) return

      const { rect } = sprite.region
      const startX = Math.floor(rect[0] * this.width)
      const startY = Math.floor(rect[1] * this.height)

      sprite.render.glyph_rows.forEach((row, dy) => {
        for (let dx = 0; dx < row.length; dx++) {
          const x = startX + dx
          const y = startY + dy
          if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            const char = row[dx]
            // Only draw non-space characters (transparent overlay)
            if (char && char !== ' ') {
              this.grid[y]![x] = char
            }
          }
        }
      })
    })
  }

  public getGrid(): string[][] {
    return this.grid
  }

  /** Per-cell pattern intensity (0–1), row-major. Updated each frame. */
  public getIntensityBuffer(): Float32Array {
    return this.intensityBuffer
  }

  /** Per-cell unified charset index, row-major. Maps to UNIFIED_CHARSET. */
  public getCharIndexBuffer(): Uint16Array {
    return this.charIndexBuffer
  }

  /** Per-cell RGB color (0-1), row-major, 3 floats per cell. Updated each frame. */
  public getColorBuffer(): Float32Array {
    return this.colorBuffer
  }

  /** Grid dimensions */
  public getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height }
  }

  public getState() {
    const time = Date.now() * 0.001 * this.animationSpeed
    return {
      genWeight: this.generators[0]?.weight ?? 0.5,
      generatorId: this.generators[0]?.id ?? 'default',
      generators: this.generators,
      tempo: this.rhythmDetector.getTempo(),
      showUI: this.showUI,
      animationSpeed: this.animationSpeed,
      transitionProgress: this.transitionProgress,
      colors: this.getCycledColors(time),
      transforms: this.transforms,
      postProcessing: this.postProcessing,
      timing: this.timing,
      colorControls: this.colorControls,
      randomControls: this.randomControls,
      frameCount: this.frameCount
    }
  }

  public setGenWeight(weight: number) {
    if (this.generators[0]) {
      this.generators[0].weight = Math.max(0, Math.min(1, weight))
    }
  }

  public setGeneratorId(id: string) {
    if (this.generators[0]) {
      this.generators[0].id = id
    }
  }

  public setAnimationSpeed(speed: number) {
    this.animationSpeed = Math.max(0.1, Math.min(5, speed))
  }

  // ===== OVERLAY API (State + blend controls, composited with art) =====

  public setOverlay(overlay: Overlay) {
    const wasActive = this.overlay !== null
    this.overlay = overlay

    // Handle fade in
    if (!wasActive && overlay.blend?.fade_in) {
      this.overlayFadeStart = Date.now()
      this.overlayFading = 'in'
    } else {
      this.overlayFading = null
    }
  }

  public getOverlay(): Overlay | null {
    return this.overlay
  }

  public clearOverlay() {
    // Handle fade out
    if (this.overlay?.blend?.fade_out) {
      this.overlayFadeStart = Date.now()
      this.overlayFading = 'out'
    } else {
      this.overlay = null
      this.overlayFading = null
    }
  }

  // Get effective overlay opacity (accounting for fade)
  public getOverlayOpacity(): number {
    if (!this.overlay) return 0

    const baseOpacity = this.overlay.blend?.opacity ?? 1.0

    if (!this.overlayFading) return baseOpacity

    const elapsed = (Date.now() - this.overlayFadeStart) / 1000
    const duration = this.overlayFading === 'in'
      ? (this.overlay.blend?.fade_in || 0.3)
      : (this.overlay.blend?.fade_out || 0.3)

    const progress = Math.min(1, elapsed / duration)

    if (progress >= 1) {
      if (this.overlayFading === 'out') {
        this.overlay = null
      }
      this.overlayFading = null
      return this.overlayFading === 'out' ? 0 : baseOpacity
    }

    return this.overlayFading === 'in'
      ? progress * baseOpacity
      : (1 - progress) * baseOpacity
  }

  // Get blend mode
  public getOverlayBlend(): BlendControls {
    return this.overlay?.blend || { opacity: 1, mode: 'over' }
  }

  // Handle click at normalized coordinates (0-1)
  public handleClick(x: number, y: number): { element: UISprite; binding: string } | null {
    // Check overlay UI first, then current state UI
    const uiElements = this.overlay?.state?.ui || this.currentState?.ui || []

    for (const element of uiElements) {
      if (element.visibility && !element.visibility.visible) continue

      const [rx, ry, rw, rh] = element.region.rect
      if (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh) {
        if (element.input_bindings && element.input_bindings.length > 0) {
          const binding = element.input_bindings[0]
          return { element, binding: binding.target_path }
        }
        return { element, binding: element.ui_id }
      }
    }
    return null
  }
}

// Sequencer - flow-based segment playback with per-frame interpolation
export class Sequencer {
  private segments: FlowSegment[] = []
  private currentIndex: number = 0
  private flowResolver: FlowResolver = new FlowResolver()
  private onTick?: (resolved: WorkloadSegment, index: number, progress: number) => void
  private onSegmentChange?: (resolved: WorkloadSegment, index: number) => void

  // Virtual time tracking (decoupled from wall clock)
  private virtualTime: number = 0 // seconds into current segment
  private lastUpdateTime: number = Date.now()
  private paused: boolean = false
  private playbackSpeed: number = 1.0

  // Speed presets (for manual control)
  private static readonly SPEED_PRESETS = [0.5, 1.0, 2.0, 4.0]
  private speedIndex: number = 1 // starts at 1.0x

  constructor(onSegmentChange?: (resolved: WorkloadSegment, index: number) => void) {
    this.onSegmentChange = onSegmentChange
  }

  /** Set callback for per-tick flow resolution */
  public setTickCallback(cb: (resolved: WorkloadSegment, index: number, progress: number) => void): void {
    this.onTick = cb
  }

  /** Load flow segments, reset resolver */
  public loadSegments(segments: FlowSegment[]): void {
    this.segments = segments
    this.currentIndex = 0
    this.virtualTime = 0
    this.lastUpdateTime = Date.now()
    this.flowResolver.reset()

    if (segments.length > 0) {
      const resolved = this.flowResolver.resolve(segments[0]!, 0)
      this.onTick?.(resolved, 0, 0)
      this.onSegmentChange?.(resolved, 0)
    }
  }

  /** Append flow segments to the queue */
  public appendSegments(segments: FlowSegment[]): number {
    if (segments.length === 0) return this.segments.length

    const wasEmpty = this.segments.length === 0
    this.segments.push(...segments)

    if (wasEmpty) {
      this.currentIndex = 0
      this.virtualTime = 0
      this.lastUpdateTime = Date.now()
      this.flowResolver.reset()

      const resolved = this.flowResolver.resolve(this.segments[0]!, 0)
      this.onTick?.(resolved, 0, 0)
      this.onSegmentChange?.(resolved, 0)
    }

    return this.segments.length
  }

  /** Per-frame update: advance time, resolve flows, fire callbacks */
  public update(): WorkloadSegment | null {
    if (this.segments.length === 0) return null

    const now = Date.now()
    const deltaMs = now - this.lastUpdateTime
    this.lastUpdateTime = now
    const deltaSec = deltaMs / 1000

    if (this.paused) return null

    this.virtualTime += deltaSec * this.playbackSpeed

    const seg = this.segments[this.currentIndex]
    if (!seg) return null

    // Check for segment advance
    if (this.virtualTime >= seg.duration) {
      this.flowResolver.advanceSegment(seg)

      const overflow = this.virtualTime - seg.duration
      this.currentIndex = (this.currentIndex + 1) % this.segments.length
      this.virtualTime = Math.max(0, overflow)

      const newSeg = this.segments[this.currentIndex]!
      const progress = newSeg.duration > 0 ? this.virtualTime / newSeg.duration : 0
      const resolved = this.flowResolver.resolve(newSeg, progress)

      this.onSegmentChange?.(resolved, this.currentIndex)
      this.onTick?.(resolved, this.currentIndex, progress)
      return resolved
    }

    // Check backward scrub past start
    if (this.virtualTime < 0) {
      const underflow = this.virtualTime
      this.currentIndex = (this.currentIndex - 1 + this.segments.length) % this.segments.length
      const prevSeg = this.segments[this.currentIndex]!
      this.virtualTime = prevSeg.duration + underflow

      // Note: going backward doesn't perfectly restore end-state; acceptable for scrubbing
      const progress = prevSeg.duration > 0 ? this.virtualTime / prevSeg.duration : 0
      const resolved = this.flowResolver.resolve(prevSeg, progress)

      this.onSegmentChange?.(resolved, this.currentIndex)
      this.onTick?.(resolved, this.currentIndex, progress)
      return resolved
    }

    // Normal tick: resolve at current progress
    const progress = seg.duration > 0 ? this.virtualTime / seg.duration : 0
    const resolved = this.flowResolver.resolve(seg, progress)
    this.onTick?.(resolved, this.currentIndex, progress)
    return resolved
  }

  // --- Transport controls ---

  public scrub(deltaSec: number): void {
    this.virtualTime += deltaSec
  }

  public scrubTo(position: number): void {
    const seg = this.segments[this.currentIndex]
    if (!seg) return
    this.virtualTime = position * seg.duration
  }

  public togglePause(): boolean {
    this.paused = !this.paused
    this.lastUpdateTime = Date.now()
    return this.paused
  }

  public setPaused(paused: boolean): void {
    this.paused = paused
    this.lastUpdateTime = Date.now()
  }

  public isPaused(): boolean {
    return this.paused
  }

  public speedUp(): number {
    this.speedIndex = Math.min(Sequencer.SPEED_PRESETS.length - 1, this.speedIndex + 1)
    this.playbackSpeed = Sequencer.SPEED_PRESETS[this.speedIndex]!
    return this.playbackSpeed
  }

  public speedDown(): number {
    this.speedIndex = Math.max(0, this.speedIndex - 1)
    this.playbackSpeed = Sequencer.SPEED_PRESETS[this.speedIndex]!
    return this.playbackSpeed
  }

  public getPlaybackSpeed(): number {
    return this.playbackSpeed
  }

  public setPlaybackSpeed(speed: number): void {
    this.playbackSpeed = speed
    let closest = 0
    let minDiff = Math.abs(Sequencer.SPEED_PRESETS[0]! - speed)
    for (let i = 1; i < Sequencer.SPEED_PRESETS.length; i++) {
      const diff = Math.abs(Sequencer.SPEED_PRESETS[i]! - speed)
      if (diff < minDiff) {
        minDiff = diff
        closest = i
      }
    }
    this.speedIndex = closest
  }

  // --- Navigation ---

  public nextSegment(): void {
    if (this.segments.length === 0) return
    const current = this.segments[this.currentIndex]
    if (current) this.flowResolver.advanceSegment(current)
    this.currentIndex = (this.currentIndex + 1) % this.segments.length
    this.virtualTime = 0
    const seg = this.segments[this.currentIndex]!
    const resolved = this.flowResolver.resolve(seg, 0)
    this.onSegmentChange?.(resolved, this.currentIndex)
    this.onTick?.(resolved, this.currentIndex, 0)
  }

  public prevSegment(): void {
    if (this.segments.length === 0) return
    this.currentIndex = (this.currentIndex - 1 + this.segments.length) % this.segments.length
    this.virtualTime = 0
    const seg = this.segments[this.currentIndex]!
    const resolved = this.flowResolver.resolve(seg, 0)
    this.onSegmentChange?.(resolved, this.currentIndex)
    this.onTick?.(resolved, this.currentIndex, 0)
  }

  // --- Getters ---

  public getSegments(): FlowSegment[] {
    return [...this.segments]
  }

  public getCurrentIndex(): number {
    return this.currentIndex
  }

  public getProgress(): number {
    const seg = this.segments[this.currentIndex]
    if (!seg) return 0
    return Math.max(0, Math.min(1, this.virtualTime / seg.duration))
  }

  public getTotalSegments(): number {
    return this.segments.length
  }

  public getVirtualTime(): number {
    return this.virtualTime
  }

  public getRemainingSegments(): number {
    return this.segments.length - this.currentIndex
  }

  public getFlowResolver(): FlowResolver {
    return this.flowResolver
  }

  public jumpTo(index: number, elapsedMs: number = 0): void {
    if (index < 0 || index >= this.segments.length) return
    this.currentIndex = index
    this.virtualTime = elapsedMs / 1000
    this.lastUpdateTime = Date.now()
    const seg = this.segments[this.currentIndex]!
    const progress = seg.duration > 0 ? this.virtualTime / seg.duration : 0
    const resolved = this.flowResolver.resolve(seg, progress)
    this.onSegmentChange?.(resolved, this.currentIndex)
    this.onTick?.(resolved, this.currentIndex, progress)
  }

  public getSegmentStartTime(): number {
    return Date.now() - (this.virtualTime * 1000)
  }
}
