import type {
  Easing,
  Flow,
  FlowGenerator,
  FlowParams,
  FlowSegment,
  WorkloadSegment,
} from './types'

// --- Easing functions ---

function easeIn(t: number): number {
  return t * t
}

function easeOut(t: number): number {
  return t * (2 - t)
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

function applyEasing(t: number, ease: Easing = 'linear'): number {
  switch (ease) {
    case 'easeIn':
      return easeIn(t)
    case 'easeOut':
      return easeOut(t)
    case 'easeInOut':
      return easeInOut(t)
    default:
      return t
  }
}

// --- Flow resolution ---

function isFlowObject(v: unknown): v is { from?: number; to: number; ease?: Easing } {
  return typeof v === 'object' && v !== null && 'to' in v
}

function resolveFlow(
  flow: Flow<number>,
  progress: number,
  inherited: number | undefined,
): number {
  if (typeof flow === 'number') return flow

  const from = flow.from ?? inherited ?? flow.to
  const t = applyEasing(progress, flow.ease)
  return from + (flow.to - from) * t
}

function flowEndValue(
  flow: Flow<number>,
  inherited: number | undefined,
): number {
  if (typeof flow === 'number') return flow
  return flow.to
}

function flowStartValue(
  flow: Flow<number>,
  inherited: number | undefined,
): number {
  if (typeof flow === 'number') return flow
  return flow.from ?? inherited ?? flow.to
}

// --- FlowResolver ---

/**
 * Resolves FlowSegments into WorkloadSegments at a given progress point.
 * Tracks end-state between segments for continuity.
 */
export class FlowResolver {
  private endState: Record<string, number> = {}

  /** Reset end state (e.g., on session start) */
  reset(): void {
    this.endState = {}
  }

  /** Get current end state (for debugging/inspection) */
  getEndState(): Record<string, number> {
    return { ...this.endState }
  }

  /**
   * Resolve a FlowSegment at a given progress (0-1) into a WorkloadSegment
   * the engine can consume directly.
   */
  resolve(segment: FlowSegment, progress: number): WorkloadSegment {
    const p = Math.max(0, Math.min(1, progress))
    const f = segment.flows ?? {} as FlowParams

    // Resolve continuous params
    const chaos = this.resolveParam('chaos', f.chaos, p)
    const updateRate = this.resolveParam('updateRate', f.updateRate, p)
    const weight = this.resolveParam('weight', f.weight, p)
    const speed = this.resolveParam('speed', f.speed, p)
    const scale = this.resolveParam('scale', f.scale, p)
    const rotation = this.resolveParam('rotation', f.rotation, p)
    const panX = this.resolveParam('panX', f.panX, p)
    const panY = this.resolveParam('panY', f.panY, p)

    const feedback = this.resolveParam('feedback', f.feedback, p)
    const feedbackDecay = this.resolveParam('feedbackDecay', f.feedbackDecay, p)
    const blur = this.resolveParam('blur', f.blur, p)
    const scanlines = this.resolveParam('scanlines', f.scanlines, p)
    const pixelate = this.resolveParam('pixelate', f.pixelate, p)
    const glitch = this.resolveParam('glitch', f.glitch, p)
    const strobe = this.resolveParam('strobe', f.strobe, p)

    const saturation = this.resolveParam('saturation', f.saturation, p)
    const contrast = this.resolveParam('contrast', f.contrast, p)
    const brightness = this.resolveParam('brightness', f.brightness, p)
    const hueRotate = this.resolveParam('hueRotate', f.hueRotate, p)
    const colorCycle = this.resolveParam('colorCycle', f.colorCycle, p)

    // Pattern shape params (top-level shorthand for single-generator)
    const freqX = this.resolveParam('freqX', f.freqX, p)
    const freqY = this.resolveParam('freqY', f.freqY, p)
    const warp = this.resolveParam('warp', f.warp, p)
    const spin = this.resolveParam('spin', f.spin, p)
    const drift = this.resolveParam('drift', f.drift, p)
    const noise = this.resolveParam('noise', f.noise, p)

    // Per-cell HSV + charGamma
    const hueShift = this.resolveParam('hueShift', f.hueShift, p)
    const hueRange = this.resolveParam('hueRange', f.hueRange, p)
    const hueSpeed = this.resolveParam('hueSpeed', f.hueSpeed, p)
    const sat = this.resolveParam('sat', f.sat, p)
    const val = this.resolveParam('val', f.val, p)
    const charGamma = this.resolveParam('charGamma', f.charGamma, p)

    // Build generators
    const generators = this.resolveGenerators(f, p)

    // Assemble WorkloadSegment
    const ws: WorkloadSegment = {
      state: {
        field_program: {
          generators,
          update_rate_hz: updateRate,
          transforms: {
            scale,
            rotation,
            pan: (panX !== undefined || panY !== undefined)
              ? [panX ?? 0, panY ?? 0]
              : undefined,
            mirror: this.resolveMirror(f.mirror, f.kaleidoscope),
          },
          post_processing: {
            blur,
            feedback: feedback !== undefined
              ? { amount: feedback, decay: feedbackDecay ?? 0.9 }
              : undefined,
            scanlines: scanlines !== undefined
              ? { density: scanlines }
              : undefined,
            pixelate,
            strobe: strobe !== undefined
              ? { rate_hz: strobe }
              : undefined,
            invert: f.invert,
          },
          color_controls: {
            brightness,
            contrast,
            saturation,
            hue_rotate: hueRotate,
            color_cycle: colorCycle !== undefined
              ? { rate_hz: colorCycle }
              : undefined,
          },
          random: {
            chaos,
            glitch: glitch !== undefined
              ? { probability: glitch }
              : undefined,
          },
        },
        palette: f.palette ? { colors: f.palette } : undefined,
      },
      exit: { time_seconds: segment.duration },
    }

    return ws
  }

  /**
   * Call when advancing to the next segment. Captures end-state for continuity.
   */
  advanceSegment(segment: FlowSegment): void {
    if (!segment.flows) return
    const f = segment.flows

    // Capture end values for all continuous params
    const continuousKeys: (keyof FlowParams)[] = [
      'chaos', 'updateRate', 'weight', 'speed', 'scale', 'rotation',
      'panX', 'panY', 'feedback', 'feedbackDecay', 'blur', 'scanlines',
      'pixelate', 'glitch', 'strobe', 'saturation', 'contrast',
      'brightness', 'hueRotate', 'colorCycle',
      'freqX', 'freqY', 'warp', 'spin', 'drift', 'noise',
      'hueShift', 'hueRange', 'hueSpeed', 'sat', 'val', 'charGamma',
    ]

    for (const key of continuousKeys) {
      const flow = f[key]
      if (flow !== undefined) {
        this.endState[key] = flowEndValue(
          flow as Flow<number>,
          this.endState[key],
        )
      }
    }

    // Capture generator end values
    const GEN_PARAM_KEYS = ['speed', 'freqX', 'freqY', 'warp', 'spin', 'drift', 'noise', 'hueShift', 'hueRange', 'hueSpeed', 'sat', 'val', 'charGamma'] as const
    if (f.generators) {
      for (let i = 0; i < f.generators.length; i++) {
        const g = f.generators[i]
        this.endState[`gen_${i}_weight`] = flowEndValue(g.weight, this.endState[`gen_${i}_weight`])
        for (const key of GEN_PARAM_KEYS) {
          if (g[key] !== undefined) {
            this.endState[`gen_${i}_${key}`] = flowEndValue(g[key]!, this.endState[`gen_${i}_${key}`])
          }
        }
      }
    }
  }

  // --- Private helpers ---

  private resolveParam(
    key: string,
    flow: Flow<number> | undefined,
    progress: number,
  ): number | undefined {
    if (flow === undefined) return undefined
    return resolveFlow(flow, progress, this.endState[key])
  }

  private resolveGenerators(f: FlowParams, progress: number) {
    const GEN_PARAM_KEYS = ['speed', 'freqX', 'freqY', 'warp', 'spin', 'drift', 'noise', 'hueShift', 'hueRange', 'hueSpeed', 'sat', 'val', 'charGamma'] as const

    if (f.generators && f.generators.length > 0) {
      return f.generators.map((g, i) => {
        const params: Record<string, number | undefined> = {}
        for (const key of GEN_PARAM_KEYS) {
          if (g[key] !== undefined) {
            params[key] = resolveFlow(g[key]!, progress, this.endState[`gen_${i}_${key}`])
          }
        }
        return {
          id: g.id,
          weight: resolveFlow(g.weight, progress, this.endState[`gen_${i}_weight`]),
          params,
        }
      })
    }

    // Single generator shorthand — pull from top-level flow params
    const genId = f.generator ?? 'default'
    const w = f.weight !== undefined
      ? resolveFlow(f.weight, progress, this.endState['weight'])
      : this.endState['weight'] ?? 0.5
    const params: Record<string, number | undefined> = {
      speed: f.speed !== undefined
        ? resolveFlow(f.speed, progress, this.endState['speed'])
        : this.endState['speed'] ?? 1.0,
    }
    // Pass through top-level pattern shape params
    for (const key of ['freqX', 'freqY', 'warp', 'spin', 'drift', 'noise', 'hueShift', 'hueRange', 'hueSpeed', 'sat', 'val', 'charGamma'] as const) {
      const flow = f[key]
      if (flow !== undefined) {
        params[key] = resolveFlow(flow, progress, this.endState[key])
      }
    }
    return [{ id: genId, weight: w, params }]
  }

  private resolveMirror(
    mirror?: string,
    kaleidoscope?: number,
  ) {
    const result: {
      horizontal?: boolean
      vertical?: boolean
      diagonal?: boolean
      kaleidoscope?: number
    } = {}

    if (mirror === 'horizontal') result.horizontal = true
    else if (mirror === 'vertical') result.vertical = true
    else if (mirror === 'both') {
      result.horizontal = true
      result.vertical = true
    } else if (mirror === 'diagonal') result.diagonal = true

    if (kaleidoscope && kaleidoscope > 0) result.kaleidoscope = kaleidoscope

    return (Object.keys(result).length > 0) ? result : undefined
  }
}
