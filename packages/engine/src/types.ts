export type Unit = number // 0.0 to 1.0
export type Percent = number // 0.0 to 100.0
export type Angle = number // -PI to PI
export type RateHz = number // 0.0 to 20.0
export type Weight = number // 0.0 to 1.0

export interface Generator {
  id: string
  weight: Weight
  params?: Record<string, unknown>
}

export interface Interaction {
  source_id: string
  target_id: string
  mode: string
  params?: Record<string, unknown>
}

export interface FieldProgram {
  generators: Generator[]
  interactions?: Interaction[]
  update_rate_hz?: RateHz
  resolution?: {
    width: number
    height: number
  }
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
