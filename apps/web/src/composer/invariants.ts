/**
 * Parameter coupling invariants — hard rules and soft affinity nudges.
 * These are physics of the system, not mood-specific.
 */

export interface ResolvedParams {
  [key: string]: number | undefined
  chaos: number
  updateRate: number
  weight: number
  speed: number
  scale: number
  rotation?: number
  panX?: number
  panY?: number
  feedback?: number
  feedbackDecay?: number
  blur?: number
  scanlines?: number
  pixelate?: number
  glitch?: number
  strobe?: number
  saturation?: number
  contrast?: number
  brightness?: number
  hueRotate?: number
  colorCycle?: number
  duration: number
  kaleidoscope?: number
  freqX?: number
  freqY?: number
  warp?: number
  spin?: number
  drift?: number
  noise?: number
  hueShift?: number
  hueRange?: number
  hueSpeed?: number
  sat?: number
  val?: number
  charGamma?: number
}

/**
 * Enforce hard invariants. Mutates and returns the params.
 *
 * 1. chaos × updateRate < 1.5
 * 2. feedback > 0.4 → chaos < 0.1
 * 3. weight < 0.3 → chaos < 0.05
 * 4. kaleidoscope > 0 → chaos < 0.1
 * 5. chaos > 0.15 → duration < 8
 */
export function enforceInvariants(p: ResolvedParams): ResolvedParams {
  // 1. chaos × updateRate < 1.5
  if (p.chaos * p.updateRate >= 1.5) {
    p.chaos = Math.min(p.chaos, 1.4 / p.updateRate)
  }

  // 2. feedback > 0.4 → chaos < 0.1
  if ((p.feedback ?? 0) > 0.4 && p.chaos >= 0.1) {
    p.chaos = 0.09
  }

  // 3. weight < 0.3 → chaos < 0.05
  if (p.weight < 0.3 && p.chaos >= 0.05) {
    p.chaos = 0.04
  }

  // 4. kaleidoscope > 0 → chaos < 0.1
  if ((p.kaleidoscope ?? 0) > 0 && p.chaos >= 0.1) {
    p.chaos = 0.09
  }

  // 5. chaos > 0.15 → duration < 8
  if (p.chaos > 0.15 && p.duration >= 8) {
    p.duration = 7
  }

  // 6. warp > 1.5 → chaos < 0.05 (high warp already complex)
  if ((p.warp ?? 0) > 1.5 && p.chaos >= 0.05) {
    p.chaos = 0.04
  }

  // 7. spin > 1.5 → warp < 1.0 (prevent visual noise)
  if ((p.spin ?? 0) > 1.5 && (p.warp ?? 0) >= 1.0) {
    p.warp = 0.9
  }

  return p
}

/**
 * Apply soft affinity couplings as nudges to deltas.
 *
 * - weight↑ → chaos↓ (inverse, 30% strength)
 * - feedback↑ → feedbackDecay↑ (direct, 50% strength)
 * - speed↑ → blur↑ (direct, 20% strength)
 */
export function applyCouplings(
  params: ResolvedParams,
  deltas: Record<string, number>,
): void {
  // weight↑ → chaos↓
  if (deltas['weight'] !== undefined && deltas['weight'] > 0) {
    const nudge = -deltas['weight'] * 0.3
    params.chaos = Math.max(0, params.chaos + nudge)
  }

  // feedback↑ → feedbackDecay↑
  if (deltas['feedback'] !== undefined && deltas['feedback'] > 0 && params.feedbackDecay !== undefined) {
    const nudge = deltas['feedback'] * 0.5
    params.feedbackDecay = Math.min(1, params.feedbackDecay + nudge)
  }

  // speed↑ → blur↑
  if (deltas['speed'] !== undefined && deltas['speed'] > 0 && params.blur !== undefined) {
    const nudge = deltas['speed'] * 0.2
    params.blur = Math.min(1, params.blur + nudge)
  }

  // warp↑ → noise↓
  if (deltas['warp'] !== undefined && deltas['warp'] > 0 && params.noise !== undefined) {
    const nudge = -deltas['warp'] * 0.2
    params.noise = Math.max(0, params.noise + nudge)
  }
}
