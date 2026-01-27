export type Unit = number // 0.0 to 1.0
export type Percent = number // 0.0 to 100.0
export type Angle = number // -PI to PI or 0 to 360
export type RateHz = number // 0.0 to 60.0
export type Weight = number // 0.0 to 1.0

// Per-generator parameters
export interface GeneratorParams {
  speed?: number        // Animation speed multiplier (default 1.0)
  scale?: number        // Pattern scale (default 1.0)
  offset?: number       // Phase offset
  direction?: number    // Direction angle in radians
  density?: number      // Character density (0-1)
  chaos?: number        // Randomness amount (0-1)
  seed?: number         // Random seed for reproducibility
  freqX?: number        // Independent X frequency (default: scale or 1.0)
  freqY?: number        // Independent Y frequency (default: scale or 1.0)
  warp?: number         // Nonlinear amplitude (0-2, default 0.8)
  spin?: number         // Angular/spiral velocity (0-2, default 0.6)
  drift?: number        // Phase-shift velocity (0-1, default 0.3)
  noise?: number        // Deterministic noise injection (0-0.4, default 0)
  hueShift?: number     // Base hue offset (0-1, default 0)
  hueRange?: number     // Hue spread across intensity (0.6-1.4, default 1.0)
  hueSpeed?: number     // Animated hue rotation rate (0.02-0.2, default 0)
  sat?: number          // HSV saturation (0-1, default 0.9)
  val?: number          // HSV value/brightness (0-1, default 0.9)
  charGamma?: number    // Character index gamma (0.6-1.8, default 1.0)
}

export interface Generator {
  id: string
  weight: Weight
  params?: GeneratorParams | Record<string, unknown>
}

export interface Interaction {
  source_id: string
  target_id: string
  mode: string
  params?: Record<string, unknown>
}

// Visual transforms applied to entire field
export interface Transforms {
  scale?: number            // Zoom level (1.0 = normal, 2.0 = 2x zoom)
  rotation?: Angle          // Rotation in radians
  pan?: [number, number]    // X, Y offset (-1 to 1)
  mirror?: {
    horizontal?: boolean    // Mirror left-right
    vertical?: boolean      // Mirror top-bottom
    diagonal?: boolean      // Mirror diagonally (kaleidoscope base)
    kaleidoscope?: number   // Number of kaleidoscope segments (2, 4, 6, 8)
  }
}

// Post-processing effects
export interface PostProcessing {
  blur?: number             // Blur amount (0-1)
  glow?: {
    intensity?: number      // Glow strength (0-1)
    radius?: number         // Glow spread (1-10)
  }
  feedback?: {
    amount?: number         // Trail/echo intensity (0-1)
    decay?: number          // How fast trails fade (0-1)
    offset?: [number, number] // Direction of feedback shift
  }
  strobe?: {
    rate_hz?: RateHz        // Strobe frequency
    duty?: number           // On-time ratio (0-1)
    color?: string          // Flash color (hex)
  }
  invert?: boolean          // Invert colors
  pixelate?: number         // Pixelation factor (1 = none, 2 = 2x2 blocks)
  scanlines?: {
    density?: number        // Lines per height (0-1)
    intensity?: number      // Line darkness (0-1)
  }
}

// Timing and rhythm controls
export interface TimingControls {
  tempo_mult?: number       // Tempo multiplier (0.25 = quarter, 2 = double)
  swing?: number            // Swing amount (0 = straight, 1 = full triplet)
  quantize?: number         // Beat division to snap to (4 = quarter, 8 = eighth, etc)
  phase_offset?: number     // Phase offset in beats (0-1)
  freeze?: boolean          // Pause animation
}

// Color processing controls
export interface ColorControls {
  brightness?: number       // -1 to 1 (0 = normal)
  contrast?: number         // 0 to 2 (1 = normal)
  saturation?: number       // 0 to 2 (1 = normal)
  hue_rotate?: number       // Hue rotation in degrees (0-360)
  color_cycle?: {
    rate_hz?: RateHz        // Cycling speed
    range?: [number, number] // Hue range to cycle through
  }
  gradient?: {
    type?: 'linear' | 'radial' | 'angular'
    colors?: string[]       // Gradient colors
    angle?: number          // For linear gradient
  }
}

// Randomization controls
export interface RandomControls {
  seed?: number             // Master random seed (0 = time-based)
  chaos?: number            // Global chaos amount (0-1)
  auto_vary?: {
    enabled?: boolean
    rate_hz?: RateHz        // How often to vary
    amount?: number         // Variation intensity (0-1)
    targets?: string[]      // Which params to vary
  }
  glitch?: {
    probability?: number    // Chance of glitch per frame (0-1)
    intensity?: number      // How severe glitches are (0-1)
    types?: ('shift' | 'noise' | 'corrupt' | 'slice')[]
  }
}

export interface FieldProgram {
  generators: Generator[]
  interactions?: Interaction[]
  update_rate_hz?: RateHz
  resolution?: {
    width: number
    height: number
  }
  transforms?: Transforms
  post_processing?: PostProcessing
  timing?: TimingControls
  color_controls?: ColorControls
  random?: RandomControls
}

export interface CouplingMap {
  source: string
  target: string
  range: [number, number]
}

export interface Spatial {
  regions?: { id: string; rect: [number, number, number, number] }[]
  masks?: { id: string; shape: string; transform?: unknown; invert?: boolean; softness?: number }[]
  anchors?: { id: string; position: [number, number] }[]
}

export interface SymbolState {
  glyph_set_id?: string
  glyph_mix?: { glyphs: string; weight?: Weight }[]
  density_curve?: number[]
  text_layers?: { content: string; region: string }[]
}

export interface PaletteState {
  palette_id?: string
  colors?: string[]
  mapping?: {
    mode: string
    contrast: Unit
    gamma: Unit
  }
}

export interface Artifact {
  handle: string
  transform: {
    pos: [number, number]
    scale: Unit
    rotation: Angle
  }
  blend: {
    mode: string
    opacity: Unit
  }
  behavior?: {
    drift: [number, number]
    noise?: unknown
    fade?: { in_seconds: number; out_seconds: number }
  }
}

export interface UISprite {
  ui_id: string
  region: { id: string; rect: [number, number, number, number] }
  render: {
    glyph_rows: string[]
    color_rows: string[][]
    alpha_rows: number[][]
  }
  input_bindings?: { event: string; target_path: string; value_type: string }[]
  visibility?: { auto_hide_seconds: number; visible: boolean }
  style?: {
    thickness?: number        // Line thickness for box drawing (1-3)
    glow?: boolean            // Add glow effect around element
    pulse?: boolean           // Pulsing visibility animation
  }
}

// Blend controls for overlay compositing
export interface BlendControls {
  opacity?: Unit              // Overall opacity (0-1, default 1)
  mode?: 'over' | 'blend' | 'multiply' | 'screen' | 'add' | 'absorb'
  absorption?: Unit           // How much background bleeds through (0-1)
  mask?: 'none' | 'luminance' | 'alpha'  // What drives transparency
  fade_in?: number            // Fade in duration in seconds
  fade_out?: number           // Fade out duration in seconds
}

// Overlay wrapper - State + blend controls
export interface Overlay {
  state: State                // Same schema as segment.state
  blend?: BlendControls       // How overlay relates to art beneath
}

export interface State {
  field_program: FieldProgram
  coupling?: { mappings: CouplingMap[] }
  spatial?: Spatial
  symbol?: SymbolState
  palette?: PaletteState
  artifacts?: Artifact[]
  ui?: UISprite[]
}

export interface Modulator {
  target_path: string
  source: string
  range: [number, number]
  rate_hz?: RateHz
  depth?: Unit
}

export interface WorkloadSegment {
  state: State
  modulators?: Modulator[]
  transition?: {
    duration_seconds: number
    blend_profile?: number[]
  }
  exit?: {
    time_seconds?: number
    beats?: number
    event?: string
    max_seconds?: number
  }
  interruptible?: boolean
}

export interface OperatorWorkload {
  segments: WorkloadSegment[]
}

// --- Flow-based segments ---

export type Easing = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'

/** A parameter that either holds steady or journeys between two values */
export type Flow<T> = T | {
  from?: T       // omit = inherit from previous segment's end state
  to: T
  ease?: Easing  // default: 'linear'
}

export interface FlowGenerator {
  id: string
  weight: Flow<number>
  speed?: Flow<number>
  freqX?: Flow<number>
  freqY?: Flow<number>
  warp?: Flow<number>
  spin?: Flow<number>
  drift?: Flow<number>
  noise?: Flow<number>
  hueShift?: Flow<number>
  hueRange?: Flow<number>
  hueSpeed?: Flow<number>
  sat?: Flow<number>
  val?: Flow<number>
  charGamma?: Flow<number>
}

/** Flat parameter map — every key is independently flowing or holding */
export interface FlowParams {
  // Discrete (not interpolated — applied at segment start)
  generator?: string
  generators?: FlowGenerator[]
  palette?: string[]
  mirror?: 'none' | 'horizontal' | 'vertical' | 'both' | 'diagonal'
  kaleidoscope?: number
  invert?: boolean

  // Continuous (interpolated per-frame)
  chaos?: Flow<number>
  updateRate?: Flow<number>
  weight?: Flow<number>
  speed?: Flow<number>
  scale?: Flow<number>
  rotation?: Flow<number>
  panX?: Flow<number>
  panY?: Flow<number>

  // Effects
  feedback?: Flow<number>
  feedbackDecay?: Flow<number>
  blur?: Flow<number>
  scanlines?: Flow<number>
  pixelate?: Flow<number>
  glitch?: Flow<number>
  strobe?: Flow<number>

  // Color
  saturation?: Flow<number>
  contrast?: Flow<number>
  brightness?: Flow<number>
  hueRotate?: Flow<number>
  colorCycle?: Flow<number>

  // Pattern shape (per-generator shorthand)
  freqX?: Flow<number>
  freqY?: Flow<number>
  warp?: Flow<number>
  spin?: Flow<number>
  drift?: Flow<number>
  noise?: Flow<number>

  // Per-cell HSV color
  hueShift?: Flow<number>
  hueRange?: Flow<number>
  hueSpeed?: Flow<number>
  sat?: Flow<number>
  val?: Flow<number>
  charGamma?: Flow<number>
}

export interface FlowSegment {
  duration: number       // seconds
  flows: FlowParams
}

export interface FlowWorkload {
  segments: FlowSegment[]
}
