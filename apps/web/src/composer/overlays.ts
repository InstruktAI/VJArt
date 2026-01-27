import type { UISprite, BlendControls, Overlay } from '@vj-art/engine'

export interface OverlayPreset {
  id: string
  name: string
  sprites: UISprite[]
  blend: BlendControls
  duration: [number, number] // seconds [min, max]
}

// Helper to create a text banner sprite
function textSprite(
  id: string,
  text: string,
  x: number,
  y: number,
): UISprite {
  const rows = text.split('\n')
  const maxWidth = Math.max(...rows.map(r => r.length))
  return {
    ui_id: id,
    region: { id, rect: [x, y, maxWidth / 80, rows.length / 40] },
    render: {
      glyph_rows: rows,
      color_rows: rows.map(r => Array.from(r, () => '#ffffff')),
      alpha_rows: rows.map(r => Array.from(r, () => 1)),
    },
    visibility: { auto_hide_seconds: 0, visible: true },
  }
}

// === TEXT BANNERS ===

const VJ_ART_BANNER: OverlayPreset = {
  id: 'vj-art-banner',
  name: 'VJ ART',
  sprites: [textSprite('banner-vj', [
    '██╗   ██╗     ██╗     █████╗ ██████╗ ████████╗',
    '██║   ██║     ██║    ██╔══██╗██╔══██╗╚══██╔══╝',
    '██║   ██║     ██║    ███████║██████╔╝   ██║   ',
    '╚██╗ ██╔╝██   ██║    ██╔══██║██╔══██╗   ██║   ',
    ' ╚████╔╝ ╚█████╔╝    ██║  ██║██║  ██║   ██║   ',
    '  ╚═══╝   ╚════╝     ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ',
  ].join('\n'), 0.15, 0.35)],
  blend: { opacity: 0.8, mode: 'screen', fade_in: 1.5, fade_out: 1.5 },
  duration: [5, 10],
}

const FLOW_BANNER: OverlayPreset = {
  id: 'flow-banner',
  name: 'FLOW',
  sprites: [textSprite('banner-flow', [
    '╔═══╗╔╗   ╔═══╗╔╗ ╔╗',
    '║╔══╝║║   ║╔═╗║║║ ║║',
    '║╚══╗║║   ║║ ║║║║ ║║',
    '║╔══╝║║   ║║ ║║║║ ║║',
    '║║   ║╚═╗ ║╚═╝║║╚═╝║',
    '╚╝   ╚══╝ ╚═══╝╚═══╝',
  ].join('\n'), 0.25, 0.38)],
  blend: { opacity: 0.7, mode: 'add', fade_in: 1, fade_out: 1 },
  duration: [4, 8],
}

const DREAM_BANNER: OverlayPreset = {
  id: 'dream-banner',
  name: 'DREAM',
  sprites: [textSprite('banner-dream', '· · · D R E A M · · ·', 0.25, 0.48)],
  blend: { opacity: 0.6, mode: 'screen', fade_in: 2, fade_out: 2 },
  duration: [6, 12],
}

// === FRAMES / BORDERS ===

const CORNER_FRAME: OverlayPreset = {
  id: 'corner-frame',
  name: 'Corner Frame',
  sprites: [
    textSprite('frame-tl', '┌──────┐', 0.02, 0.02),
    textSprite('frame-tr', '┌──────┐', 0.85, 0.02),
    textSprite('frame-bl', '└──────┘', 0.02, 0.92),
    textSprite('frame-br', '└──────┘', 0.85, 0.92),
  ],
  blend: { opacity: 0.5, mode: 'over', fade_in: 0.5, fade_out: 0.5 },
  duration: [8, 15],
}

const DIVIDER_LINE: OverlayPreset = {
  id: 'divider-line',
  name: 'Divider',
  sprites: [textSprite('divider', '═'.repeat(60), 0.1, 0.5)],
  blend: { opacity: 0.4, mode: 'over', fade_in: 0.8, fade_out: 0.8 },
  duration: [5, 10],
}

// === SYMBOLS ===

const ASCII_FACE: OverlayPreset = {
  id: 'ascii-face',
  name: 'Face',
  sprites: [textSprite('face', [
    '  ╭─────╮  ',
    '  │ ◉ ◉ │  ',
    '  │  ▽  │  ',
    '  │ ╰─╯ │  ',
    '  ╰─────╯  ',
  ].join('\n'), 0.4, 0.35)],
  blend: { opacity: 0.7, mode: 'screen', fade_in: 1, fade_out: 1 },
  duration: [4, 8],
}

const GEOMETRIC_SYMBOL: OverlayPreset = {
  id: 'geometric-symbol',
  name: 'Geometry',
  sprites: [textSprite('geo', [
    '    ◆    ',
    '  ◆ ◇ ◆  ',
    '◆ ◇ ◈ ◇ ◆',
    '  ◆ ◇ ◆  ',
    '    ◆    ',
  ].join('\n'), 0.42, 0.4)],
  blend: { opacity: 0.6, mode: 'add', fade_in: 0.8, fade_out: 0.8 },
  duration: [5, 10],
}

const ARROWS: OverlayPreset = {
  id: 'arrows',
  name: 'Arrows',
  sprites: [textSprite('arrows', [
    '  ▲  ',
    '◄ ● ►',
    '  ▼  ',
  ].join('\n'), 0.45, 0.45)],
  blend: { opacity: 0.5, mode: 'over', fade_in: 0.5, fade_out: 0.5 },
  duration: [3, 6],
}

// === MINIMAL ===

const SCATTER_DOTS: OverlayPreset = {
  id: 'scatter-dots',
  name: 'Scatter',
  sprites: [
    textSprite('dot1', '●', 0.15, 0.2),
    textSprite('dot2', '◎', 0.7, 0.3),
    textSprite('dot3', '◉', 0.4, 0.7),
    textSprite('dot4', '○', 0.85, 0.6),
    textSprite('dot5', '•', 0.3, 0.45),
  ],
  blend: { opacity: 0.4, mode: 'screen', fade_in: 1.5, fade_out: 1.5 },
  duration: [6, 12],
}

const STARS: OverlayPreset = {
  id: 'stars',
  name: 'Stars',
  sprites: [
    textSprite('star1', '✦', 0.1, 0.15),
    textSprite('star2', '✧', 0.5, 0.1),
    textSprite('star3', '✦', 0.8, 0.25),
    textSprite('star4', '✧', 0.25, 0.6),
    textSprite('star5', '✦', 0.65, 0.75),
    textSprite('star6', '✧', 0.9, 0.55),
  ],
  blend: { opacity: 0.5, mode: 'add', fade_in: 2, fade_out: 2 },
  duration: [8, 15],
}

// === ALL BUILT-IN PRESETS ===

export const OVERLAY_PRESETS: OverlayPreset[] = [
  VJ_ART_BANNER,
  FLOW_BANNER,
  DREAM_BANNER,
  CORNER_FRAME,
  DIVIDER_LINE,
  ASCII_FACE,
  GEOMETRIC_SYMBOL,
  ARROWS,
  SCATTER_DOTS,
  STARS,
]

// Convert an ingested ASCII asset into an overlay preset
export function assetToOverlayPreset(
  glyphs: string[][],
  id: string,
): OverlayPreset {
  const rows = glyphs.map(row => row.join(''))
  const maxWidth = Math.max(...rows.map(r => r.length))
  const height = rows.length

  // Center on screen
  const x = Math.max(0, 0.5 - (maxWidth / 80) / 2)
  const y = Math.max(0, 0.5 - (height / 40) / 2)

  return {
    id,
    name: `Asset ${id}`,
    sprites: [{
      ui_id: id,
      region: { id, rect: [x, y, maxWidth / 80, height / 40] },
      render: {
        glyph_rows: rows,
        color_rows: rows.map(r => Array.from(r, () => '#ffffff')),
        alpha_rows: rows.map(r => Array.from(r, () => 1)),
      },
      visibility: { auto_hide_seconds: 0, visible: true },
    }],
    blend: { opacity: 0.7, mode: 'blend', fade_in: 1, fade_out: 1 },
    duration: [5, 12],
  }
}

// Convert an OverlayPreset into an Overlay the engine can consume
export function presetToOverlay(preset: OverlayPreset): Overlay {
  return {
    state: {
      field_program: { generators: [] },
      ui: preset.sprites,
    },
    blend: preset.blend,
  }
}
