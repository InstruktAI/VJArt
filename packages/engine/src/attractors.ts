/**
 * Attractor Library — hand-crafted contrasting visual targets.
 *
 * Each attractor is a sparse partial profile: only the params that make it
 * distinctive. The composer drifts toward an attractor's values as deltas
 * on current state, then picks a contrasting one.
 *
 * Tags enable natural-language lookup and mood-based filtering.
 */

/** A sparse set of params the attractor cares about. Everything else stays as-is. */
export interface AttractorProfile {
  id: string
  name: string
  /** Generator family to use (e.g. 'plasma', 'vortex') */
  generator: string
  /** Tags for filtering and NL lookup */
  tags: string[]
  /** Only the params that define this attractor's character. Sparse — omitted = don't care. */
  params: Partial<{
    speed: number
    weight: number
    scale: number
    rotation: number
    freqX: number
    freqY: number
    warp: number
    spin: number
    drift: number
    noise: number
    feedback: number
    feedbackDecay: number
    blur: number
    scanlines: number
    pixelate: number
    glitch: number
    strobe: number
    hueShift: number
    hueRange: number
    hueSpeed: number
    sat: number
    val: number
    charGamma: number
    saturation: number
    contrast: number
    brightness: number
  }>
  /** Optional: mirror mode */
  mirror?: 'horizontal' | 'vertical' | 'both' | 'diagonal'
  /** Optional: kaleidoscope segments */
  kaleidoscope?: number
}

/**
 * Hand-crafted attractors. Each one occupies a distinct region of visual space.
 * The goal: no two attractors look similar when reached.
 */
export const ATTRACTORS: AttractorProfile[] = [
  // --- ORGANIC / SLOW ---
  {
    id: 'deep-ocean',
    name: 'Deep Ocean',
    generator: 'tide',
    tags: ['ocean', 'water', 'calm', 'slow', 'organic'],
    params: {
      speed: 0.3, warp: 0.4, drift: 0.7, spin: 0.1,
      hueShift: 0.55, hueRange: 0.3, hueSpeed: 0.02,
      sat: 0.7, val: 0.6, charGamma: 1.3,
      feedback: 0.6, feedbackDecay: 0.93, blur: 0.15, brightness: 0.4,
    },
  },
  {
    id: 'breathing-nebula',
    name: 'Breathing Nebula',
    generator: 'nebula',
    tags: ['space', 'calm', 'dream', 'glow', 'slow'],
    params: {
      speed: 0.4, warp: 0.9, spin: 0.2, drift: 0.1,
      hueShift: 0.7, hueRange: 0.5, hueSpeed: 0.03,
      sat: 0.6, val: 0.8, charGamma: 1.5,
      feedback: 0.7, feedbackDecay: 0.95, blur: 0.25,
    },
  },
  {
    id: 'moss-growth',
    name: 'Moss Growth',
    generator: 'nca',
    tags: ['organic', 'slow', 'nature', 'cellular'],
    params: {
      speed: 0.5, warp: 0.3, noise: 0.15,
      hueShift: 0.25, hueRange: 0.2, hueSpeed: 0.01,
      sat: 0.5, val: 0.7, charGamma: 0.8,
      weight: 0.35, brightness: 0.5, pixelate: 0.05,
    },
  },

  // --- GEOMETRIC / STRUCTURED ---
  {
    id: 'tight-lattice',
    name: 'Tight Lattice',
    generator: 'moire',
    tags: ['geometric', 'grid', 'structured', 'precise'],
    params: {
      speed: 0.7, freqX: 2.0, freqY: 1.8, warp: 1.6, drift: 0.1,
      hueShift: 0.1, hueRange: 0.4, hueSpeed: 0.04,
      sat: 0.4, val: 0.9, charGamma: 0.7,
      contrast: 1.3, saturation: 0.5, scanlines: 0.15,
    },
    mirror: 'both',
  },
  {
    id: 'crystal-facets',
    name: 'Crystal Facets',
    generator: 'glass',
    tags: ['geometric', 'crystal', 'sharp', 'prism'],
    params: {
      speed: 0.8, warp: 1.4, freqX: 1.5, freqY: 1.3,
      hueShift: 0.0, hueRange: 1.3, hueSpeed: 0.08,
      sat: 0.9, val: 0.95, charGamma: 0.6,
      contrast: 1.4, brightness: 0.7,
    },
  },
  {
    id: 'hex-cells',
    name: 'Hex Cells',
    generator: 'cells',
    tags: ['geometric', 'cellular', 'organic', 'structured'],
    params: {
      speed: 0.6, warp: 0.8, freqX: 1.2, freqY: 1.0,
      hueShift: 0.35, hueRange: 0.6, hueSpeed: 0.05,
      sat: 0.75, val: 0.85, charGamma: 0.9,
      feedback: 0.3, contrast: 1.1,
    },
  },

  // --- KINETIC / FAST ---
  {
    id: 'tornado',
    name: 'Tornado',
    generator: 'vortex',
    tags: ['storm', 'fast', 'spiral', 'intense', 'vortex'],
    params: {
      speed: 3.0, spin: 1.8, warp: 1.5, drift: 0.2,
      hueShift: 0.0, hueRange: 1.4, hueSpeed: 0.15,
      sat: 0.95, val: 0.95, charGamma: 0.7,
      weight: 0.8, contrast: 1.3, blur: 0.1, feedback: 0.4,
    },
  },
  {
    id: 'pulse-wave',
    name: 'Pulse Wave',
    generator: 'ripple',
    tags: ['pulse', 'wave', 'fast', 'radial', 'energy'],
    params: {
      speed: 2.5, warp: 1.2,
      hueShift: 0.9, hueRange: 0.8, hueSpeed: 0.12,
      sat: 0.85, val: 0.9, charGamma: 0.8,
      weight: 0.7, scanlines: 0.3, strobe: 0.15,
    },
  },
  {
    id: 'orbit-dance',
    name: 'Orbit Dance',
    generator: 'orbit',
    tags: ['cosmic', 'orbit', 'fast', 'planetary'],
    params: {
      speed: 2.0, spin: 1.5, warp: 1.0, drift: 0.4,
      hueShift: 0.6, hueRange: 1.0, hueSpeed: 0.1,
      sat: 0.8, val: 0.85, charGamma: 1.0,
      weight: 0.65, feedback: 0.35, blur: 0.08,
    },
  },

  // --- PLASMA / CLASSIC ---
  {
    id: 'classic-plasma',
    name: 'Classic Plasma',
    generator: 'plasma',
    tags: ['plasma', 'classic', 'electric', 'energy'],
    params: {
      speed: 1.2, warp: 1.0, drift: 0.5, freqX: 1.0, freqY: 1.0,
      hueShift: 0.0, hueRange: 1.0, hueSpeed: 0.06,
      sat: 0.9, val: 0.9, charGamma: 1.0,
      weight: 0.6, saturation: 0.9, feedback: 0.3, strobe: 0.05,
    },
  },

  // --- MINIMAL / SPARSE ---
  {
    id: 'sparse-dust',
    name: 'Sparse Dust',
    generator: 'minimal',
    tags: ['minimal', 'sparse', 'calm', 'quiet'],
    params: {
      speed: 0.3, noise: 0.05,
      hueShift: 0.4, hueRange: 0.2, hueSpeed: 0.01,
      sat: 0.3, val: 0.5, charGamma: 1.8,
      weight: 0.2, brightness: 0.35,
    },
  },
  {
    id: 'dot-field',
    name: 'Dot Field',
    generator: 'dots',
    tags: ['dots', 'minimal', 'braille', 'precise'],
    params: {
      speed: 0.8, freqX: 1.4, freqY: 1.2,
      hueShift: 0.15, hueRange: 0.5, hueSpeed: 0.04,
      sat: 0.6, val: 0.8, charGamma: 1.2,
      weight: 0.45, contrast: 1.2,
    },
  },

  // --- GLITCH / DIGITAL ---
  {
    id: 'digital-rain',
    name: 'Digital Rain',
    generator: 'matrix',
    tags: ['digital', 'matrix', 'rain', 'glitch', 'fast'],
    params: {
      speed: 2.5,
      hueShift: 0.33, hueRange: 0.15, hueSpeed: 0.02,
      sat: 0.9, val: 0.95, charGamma: 0.7,
      weight: 0.7, glitch: 0.15, scanlines: 0.25, pixelate: 0.08,
    },
  },
  {
    id: 'static-burst',
    name: 'Static Burst',
    generator: 'noise',
    tags: ['glitch', 'noise', 'chaos', 'digital', 'fast'],
    params: {
      speed: 3.0, noise: 0.3,
      hueShift: 0.0, hueRange: 1.4, hueSpeed: 0.2,
      sat: 0.7, val: 0.9, charGamma: 0.6,
      weight: 0.8, glitch: 0.25, pixelate: 0.2, contrast: 1.4, strobe: 0.2, scanlines: 0.15,
    },
  },

  // --- FLOW / DIRECTIONAL ---
  {
    id: 'wind-stream',
    name: 'Wind Stream',
    generator: 'flow',
    tags: ['flow', 'wind', 'drift', 'organic', 'calm'],
    params: {
      speed: 0.9, drift: 0.8, warp: 0.6,
      hueShift: 0.45, hueRange: 0.4, hueSpeed: 0.03,
      sat: 0.65, val: 0.75, charGamma: 1.1,
      weight: 0.5, feedback: 0.5, feedbackDecay: 0.92, blur: 0.12,
    },
  },
  {
    id: 'sand-dunes',
    name: 'Sand Dunes',
    generator: 'dunes',
    tags: ['sand', 'desert', 'slow', 'organic', 'warm'],
    params: {
      speed: 0.5, freqX: 1.3, freqY: 0.8, warp: 0.5, drift: 0.4,
      hueShift: 0.08, hueRange: 0.2, hueSpeed: 0.02,
      sat: 0.45, val: 0.7, charGamma: 1.3,
      weight: 0.45, brightness: 0.55, blur: 0.1,
    },
  },
]

/** Map of id → profile for direct lookup */
export const ATTRACTOR_MAP: Map<string, AttractorProfile> = new Map(
  ATTRACTORS.map(a => [a.id, a]),
)

/** All generator families referenced by attractors */
export const FAMILIES = [
  'plasma', 'swirl', 'moire', 'cells', 'nebula', 'vortex', 'tide',
  'flow', 'kaleido', 'dunes', 'orbit', 'ripple', 'glass',
  'nca', 'wave', 'matrix', 'dots', 'blocks', 'noise', 'minimal',
] as const

export type Family = typeof FAMILIES[number]

/** Keyword → family mapping for natural language resolution */
export const VIBE_MAP: Record<string, Family> = {
  ocean: 'tide',
  water: 'tide',
  sea: 'tide',
  calm: 'nebula',
  dream: 'nebula',
  space: 'nebula',
  aurora: 'nebula',
  storm: 'swirl',
  thunder: 'swirl',
  vortex: 'vortex',
  spiral: 'vortex',
  swirl: 'swirl',
  cells: 'cells',
  organic: 'cells',
  biology: 'cells',
  plasma: 'plasma',
  electric: 'plasma',
  energy: 'plasma',
  glitch: 'noise',
  digital: 'matrix',
  grid: 'moire',
  stripe: 'moire',
  kaleido: 'kaleido',
  kaleidoscope: 'kaleido',
  glass: 'glass',
  crystal: 'glass',
  prism: 'glass',
  flow: 'flow',
  wind: 'flow',
  stream: 'flow',
  bloom: 'nebula',
  glow: 'nebula',
  ripple: 'ripple',
  wave: 'wave',
  pulse: 'wave',
  sand: 'dunes',
  desert: 'dunes',
  dune: 'dunes',
  orbit: 'orbit',
  planet: 'orbit',
  cosmic: 'orbit',
  minimal: 'minimal',
  simple: 'minimal',
  dots: 'dots',
  braille: 'dots',
  blocks: 'blocks',
  chunky: 'blocks',
  nca: 'nca',
  automata: 'nca',
  matrix: 'matrix',
  rain: 'matrix',
  noise: 'noise',
  static: 'noise',
}

/**
 * Find attractors matching a natural language query.
 * Returns matches sorted by relevance (tag match count).
 */
export function findAttractors(text: string): AttractorProfile[] {
  const lower = text.toLowerCase()
  const words = lower.split(/\s+/)

  const scored = ATTRACTORS.map(a => {
    let score = 0
    for (const word of words) {
      // Match tags
      if (a.tags.includes(word)) score += 2
      // Match name
      if (a.name.toLowerCase().includes(word)) score += 1
      // Match generator
      if (a.generator === word) score += 1
      // Match via VIBE_MAP
      const family = VIBE_MAP[word]
      if (family && a.generator === family) score += 1
    }
    return { attractor: a, score }
  })

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.attractor)
}

/**
 * Pick a contrasting attractor — one that is maximally different from the given one.
 * Uses tag overlap as a similarity proxy: fewer shared tags = more contrast.
 */
export function pickContrasting(current: AttractorProfile, candidates: AttractorProfile[]): AttractorProfile {
  if (candidates.length <= 1) return candidates[0] ?? current

  const others = candidates.filter(c => c.id !== current.id)
  if (others.length === 0) return candidates[0]!

  // Score by dissimilarity: different generator family + fewer shared tags = higher score
  const scored = others.map(c => {
    const sharedTags = c.tags.filter(t => current.tags.includes(t)).length
    const maxTags = Math.max(c.tags.length, current.tags.length)
    const tagDissimilarity = 1 - (sharedTags / maxTags)
    const familyBonus = c.generator !== current.generator ? 0.5 : 0
    return { attractor: c, score: tagDissimilarity + familyBonus }
  })

  // Weighted random from top half to avoid being fully deterministic
  scored.sort((a, b) => b.score - a.score)
  const topHalf = scored.slice(0, Math.max(2, Math.ceil(scored.length / 2)))
  return topHalf[Math.floor(Math.random() * topHalf.length)]!.attractor
}
