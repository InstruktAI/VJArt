import type { Easing, FlowSegment } from '@vj-art/engine'
import { ATTRACTORS, pickContrasting, type AttractorProfile } from '@vj-art/engine'
import type { MoodProfile, ParamRange } from './types'
import { enforceInvariants, applyCouplings, type ResolvedParams } from './invariants'

const CONTINUOUS_KEYS = [
  'weight', 'speed', 'chaos', 'updateRate', 'scale',
  'rotation', 'panX', 'panY',
  'feedback', 'feedbackDecay', 'blur', 'scanlines', 'pixelate',
  'glitch', 'strobe', 'saturation', 'contrast', 'brightness',
  'hueRotate', 'colorCycle',
  'freqX', 'freqY', 'warp', 'spin', 'drift', 'noise',
  'hueShift', 'hueRange', 'hueSpeed', 'sat', 'val', 'charGamma',
] as const

/**
 * Default ranges for ALL params. Mood-specific ranges override these.
 * Ensures every param always has a value — no param is ever "missing".
 */
const DEFAULT_RANGES: Record<string, ParamRange> = {
  weight: { range: [0.3, 0.6], maxDelta: 0.06 },
  speed: { range: [0.5, 1.5], maxDelta: 0.15 },
  chaos: { range: [0.01, 0.05], maxDelta: 0.008 },
  updateRate: { range: [6, 12], maxDelta: 1.5 },
  scale: { range: [0.8, 1.2], maxDelta: 0.06 },
  rotation: { range: [-0.1, 0.1], maxDelta: 0.02 },
  panX: { range: [-0.1, 0.1], maxDelta: 0.02 },
  panY: { range: [-0.1, 0.1], maxDelta: 0.02 },
  feedback: { range: [0.15, 0.7], maxDelta: 0.08 },
  feedbackDecay: { range: [0.8, 0.96], maxDelta: 0.03 },
  blur: { range: [0, 0.25], maxDelta: 0.04 },
  scanlines: { range: [0, 0.3], maxDelta: 0.05 },
  pixelate: { range: [0, 0.15], maxDelta: 0.03 },
  glitch: { range: [0, 0.15], maxDelta: 0.025 },
  strobe: { range: [0, 0.2], maxDelta: 0.04 },
  saturation: { range: [0.6, 0.9], maxDelta: 0.05 },
  contrast: { range: [0.9, 1.1], maxDelta: 0.04 },
  brightness: { range: [0.4, 0.7], maxDelta: 0.05 },
  hueRotate: { range: [0, 0], maxDelta: 0 },
  colorCycle: { range: [0, 0], maxDelta: 0 },
  freqX: { range: [0.8, 1.2], maxDelta: 0.06 },
  freqY: { range: [0.8, 1.2], maxDelta: 0.06 },
  warp: { range: [0.3, 0.7], maxDelta: 0.05 },
  spin: { range: [0.2, 0.6], maxDelta: 0.05 },
  drift: { range: [0.1, 0.3], maxDelta: 0.03 },
  noise: { range: [0, 0.05], maxDelta: 0.01 },
  hueShift: { range: [0.2, 0.6], maxDelta: 0.04 },
  hueRange: { range: [0.7, 1.0], maxDelta: 0.04 },
  hueSpeed: { range: [0.03, 0.08], maxDelta: 0.01 },
  sat: { range: [0.7, 0.9], maxDelta: 0.03 },
  val: { range: [0.7, 0.9], maxDelta: 0.03 },
  charGamma: { range: [0.9, 1.2], maxDelta: 0.04 },
}

type ParamKey = typeof CONTINUOUS_KEYS[number]

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

function lerpRange(a: ParamRange, b: ParamRange, t: number): ParamRange {
  return {
    range: [
      a.range[0] + (b.range[0] - a.range[0]) * t,
      a.range[1] + (b.range[1] - a.range[1]) * t,
    ],
    maxDelta: a.maxDelta + (b.maxDelta - a.maxDelta) * t,
  }
}

function pickWeighted<T>(items: { item: T; probability: number }[]): T {
  const total = items.reduce((s, i) => s + i.probability, 0)
  let r = Math.random() * total
  for (const { item, probability } of items) {
    r -= probability
    if (r <= 0) return item
  }
  return items[items.length - 1]!.item
}

/** How many segments to spend drifting toward the current attractor */
const ATTRACTOR_SEGMENTS = 3

export class FlowComposer {
  private state: Record<string, number> = {}
  private currentGenerator: string
  private mood: MoodProfile
  private targetMood: MoodProfile | null = null
  private moodBlend: number = 0
  private moodTransitionSegments: number = 0
  private segmentsSinceTransition: number = 0

  // Attractor state
  private attractor: AttractorProfile
  private attractorStep: number = 0

  constructor(initialMood: MoodProfile) {
    this.mood = initialMood
    this.attractor = ATTRACTORS[Math.floor(Math.random() * ATTRACTORS.length)]!
    this.currentGenerator = this.attractor.generator
    this.initState(initialMood)
  }

  next(): FlowSegment {
    // 1. Advance mood blend
    if (this.targetMood) {
      this.segmentsSinceTransition++
      this.moodBlend = Math.min(1, this.segmentsSinceTransition / this.moodTransitionSegments)
      if (this.moodBlend >= 1) {
        this.mood = this.targetMood
        this.targetMood = null
        this.moodBlend = 0
        this.segmentsSinceTransition = 0
      }
    }

    // 2. Advance attractor — pick a contrasting one when steps exhausted
    this.attractorStep++
    if (this.attractorStep > ATTRACTOR_SEGMENTS) {
      this.attractor = pickContrasting(this.attractor, ATTRACTORS)
      this.attractorStep = 1
      this.currentGenerator = this.attractor.generator
    }

    // 3. Effective ranges
    const ranges = this.getEffectiveRanges()
    const effectiveMood = this.getEffectiveMood()

    // 4. Compute next values — blend toward attractor target
    const next: Record<string, number> = {}
    const deltas: Record<string, number> = {}
    // Progress toward attractor (0→1 over ATTRACTOR_SEGMENTS)
    const attractorBlend = this.attractorStep / ATTRACTOR_SEGMENTS

    for (const key of CONTINUOUS_KEYS) {
      const range = ranges[key]
      if (!range) continue
      const current = this.state[key]

      // Check if attractor has an opinion on this param
      const attractorTarget = (this.attractor.params as Record<string, number | undefined>)[key]

      if (current === undefined) {
        // No state yet — initialize from attractor or range
        next[key] = attractorTarget !== undefined
          ? clamp(attractorTarget, range.range[0], range.range[1])
          : rand(range.range[0], range.range[1])
      } else if (attractorTarget !== undefined) {
        // Drift toward attractor target, blending with random walk
        const clamped = clamp(attractorTarget, range.range[0], range.range[1])
        // Blend: attractorBlend portion toward target, rest is random walk
        const walked = this.pickNext(current, range)
        next[key] = walked * (1 - attractorBlend * 0.6) + clamped * (attractorBlend * 0.6)
      } else {
        // No attractor opinion — random walk with exploration
        next[key] = this.pickNext(current, range)
      }

      deltas[key] = next[key]! - (this.state[key] ?? next[key]!)
    }

    // 5. Duration
    const durationRange = this.targetMood
      ? [
          this.mood.duration[0] + (this.targetMood.duration[0] - this.mood.duration[0]) * this.moodBlend,
          this.mood.duration[1] + (this.targetMood.duration[1] - this.mood.duration[1]) * this.moodBlend,
        ]
      : this.mood.duration
    const duration = rand(durationRange[0], durationRange[1])

    // Build ResolvedParams for invariant checks
    const resolved: ResolvedParams = {
      chaos: next['chaos'] ?? this.state['chaos'] ?? 0.02,
      updateRate: next['updateRate'] ?? this.state['updateRate'] ?? 8,
      weight: next['weight'] ?? this.state['weight'] ?? 0.5,
      speed: next['speed'] ?? this.state['speed'] ?? 1,
      scale: next['scale'] ?? this.state['scale'] ?? 1,
      duration,
    }
    for (const key of CONTINUOUS_KEYS) {
      if (next[key] !== undefined && !(key in resolved)) {
        (resolved as Record<string, number | undefined>)[key] = next[key]
      }
    }

    // 6. Apply couplings + invariants
    applyCouplings(resolved, deltas)
    enforceInvariants(resolved)

    // Write back enforced values
    for (const key of CONTINUOUS_KEYS) {
      if ((resolved as Record<string, number | undefined>)[key] !== undefined) {
        next[key] = (resolved as Record<string, number | undefined>)[key]!
      }
    }

    // 7. Pick easing
    const easings = effectiveMood.easings
    const ease = easings[Math.floor(Math.random() * easings.length)]!

    // 8. Pick discrete features — attractor can set mirror/kaleidoscope
    const mirror = this.attractor.mirror ?? this.pickMirror(effectiveMood)
    const kaleidoscope = this.attractor.kaleidoscope ?? this.pickKaleidoscope(effectiveMood)
    const invert = effectiveMood.invertProbability ? Math.random() < effectiveMood.invertProbability : undefined
    const palette = this.pickPalette(effectiveMood)

    // 9. Build FlowSegment
    const flows: FlowSegment['flows'] = {
      generator: this.currentGenerator,
    }

    for (const key of CONTINUOUS_KEYS) {
      const target = next[key]
      if (target === undefined) continue
      const current = this.state[key]

      if (current !== undefined && Math.abs(target - current) >= 0.001) {
        // Flow with easing
        ;(flows as Record<string, unknown>)[key] = { to: target, ease }
      } else {
        ;(flows as Record<string, unknown>)[key] = target
      }
    }

    if (mirror) flows.mirror = mirror
    if (kaleidoscope) flows.kaleidoscope = kaleidoscope
    if (invert) flows.invert = true
    if (palette) flows.palette = palette

    // 10. Update state
    for (const key of CONTINUOUS_KEYS) {
      if (next[key] !== undefined) {
        this.state[key] = next[key]!
      }
    }

    return { duration: resolved.duration, flows }
  }

  setMood(mood: MoodProfile, transitionSegments: number = 5): void {
    this.targetMood = mood
    this.moodTransitionSegments = transitionSegments
    this.segmentsSinceTransition = 0
    this.moodBlend = 0
  }

  getCurrentMood(): MoodProfile {
    return this.mood
  }

  getCurrentAttractor(): AttractorProfile {
    return this.attractor
  }

  getTargetMood(): MoodProfile | null {
    return this.targetMood
  }

  getMoodBlend(): number {
    return this.moodBlend
  }

  // --- Private ---

  private initState(mood: MoodProfile): void {
    // Seed from attractor first, then fill remaining from mood/defaults
    for (const key of CONTINUOUS_KEYS) {
      const attractorVal = (this.attractor.params as Record<string, number | undefined>)[key]
      const range = (mood.params[key as keyof typeof mood.params] as ParamRange | undefined) ?? DEFAULT_RANGES[key]
      if (attractorVal !== undefined && range) {
        this.state[key] = clamp(attractorVal, range.range[0], range.range[1])
      } else if (range) {
        this.state[key] = rand(range.range[0], range.range[1])
      }
    }
  }

  private pickNext(current: number, range: ParamRange): number {
    // 20% chance: exploration jump from full range
    if (Math.random() < 0.2) {
      return rand(range.range[0], range.range[1])
    }
    const lo = Math.max(range.range[0], current - range.maxDelta)
    const hi = Math.min(range.range[1], current + range.maxDelta)
    return rand(lo, hi)
  }

  private getEffectiveRanges(): Record<string, ParamRange> {
    const result: Record<string, ParamRange> = {}
    for (const key of CONTINUOUS_KEYS) {
      const a = (this.mood.params[key as keyof typeof this.mood.params] as ParamRange | undefined) ?? DEFAULT_RANGES[key]
      if (!this.targetMood) {
        if (a) result[key] = a
        continue
      }
      const b = (this.targetMood.params[key as keyof typeof this.targetMood.params] as ParamRange | undefined) ?? DEFAULT_RANGES[key]
      if (a && b) {
        result[key] = lerpRange(a, b, this.moodBlend)
      } else if (a) {
        result[key] = a
      } else if (b) {
        result[key] = b
      }
    }
    return result
  }

  private getEffectiveMood(): MoodProfile {
    if (!this.targetMood) return this.mood
    return this.moodBlend >= 0.5 ? this.targetMood : this.mood
  }

  private blendGenerators(
    a: MoodProfile, b: MoodProfile, t: number,
  ): { id: string; probability: number }[] {
    const map = new Map<string, number>()
    for (const g of a.generators) {
      map.set(g.id, (map.get(g.id) ?? 0) + g.probability * (1 - t))
    }
    for (const g of b.generators) {
      map.set(g.id, (map.get(g.id) ?? 0) + g.probability * t)
    }
    return Array.from(map.entries()).map(([id, probability]) => ({ id, probability }))
  }

  private pickMirror(mood: MoodProfile): 'horizontal' | 'vertical' | 'both' | 'diagonal' | undefined {
    if (!mood.mirror || Math.random() >= mood.mirror.probability) return undefined
    const types = mood.mirror.types
    return types[Math.floor(Math.random() * types.length)]
  }

  private pickKaleidoscope(mood: MoodProfile): number | undefined {
    if (!mood.kaleidoscope || Math.random() >= mood.kaleidoscope.probability) return undefined
    const vals = mood.kaleidoscope.values
    return vals[Math.floor(Math.random() * vals.length)]
  }

  private pickPalette(mood: MoodProfile): string[] | undefined {
    if (!mood.palettes || mood.palettes.length === 0) return undefined
    return mood.palettes[Math.floor(Math.random() * mood.palettes.length)]
  }
}
