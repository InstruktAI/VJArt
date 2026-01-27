import type { Easing } from '@vj-art/engine'

export interface ParamRange {
  range: [number, number]
  maxDelta: number
}

export interface GeneratorPreference {
  id: string
  probability: number
}

export interface MoodProfile {
  id: string
  name: string

  generators: GeneratorPreference[]

  params: {
    weight: ParamRange
    speed: ParamRange
    chaos: ParamRange
    updateRate: ParamRange
    scale: ParamRange
    rotation?: ParamRange
    panX?: ParamRange
    panY?: ParamRange
    feedback?: ParamRange
    feedbackDecay?: ParamRange
    blur?: ParamRange
    scanlines?: ParamRange
    pixelate?: ParamRange
    glitch?: ParamRange
    strobe?: ParamRange
    saturation?: ParamRange
    contrast?: ParamRange
    brightness?: ParamRange
    hueRotate?: ParamRange
    colorCycle?: ParamRange
    // Pattern shape params
    freqX?: ParamRange
    freqY?: ParamRange
    warp?: ParamRange
    spin?: ParamRange
    drift?: ParamRange
    noise?: ParamRange
    // Per-cell HSV color
    hueShift?: ParamRange
    hueRange?: ParamRange
    hueSpeed?: ParamRange
    sat?: ParamRange
    val?: ParamRange
    charGamma?: ParamRange
  }

  duration: [number, number]

  easings: Easing[]

  palettes?: string[][]

  mirror?: { types: ('horizontal' | 'vertical' | 'both' | 'diagonal')[]; probability: number }
  kaleidoscope?: { values: number[]; probability: number }
  invertProbability?: number
}
