import express from 'express'
import { WebSocketServer, WebSocket } from 'ws'
import http from 'http'
import { join } from 'path'
import { VJEngine, Sequencer, WorkloadSegment, Overlay, FlowSegment, FlowWorkload } from '@vj-art/engine'
import { demoSequence } from './demo-sequence'
import { logger, setLoggerBroadcast } from './logger'
import { saveState, loadState } from './state-persistence'
import { SessionManager } from './session'

const app = express()
app.use(express.json({ limit: '10mb' }))

const server = http.createServer(app)
const wss = new WebSocketServer({ server })

// Auto-detect terminal size, with env overrides: GRID_WIDTH, GRID_HEIGHT
const cols = parseInt(process.env.GRID_WIDTH || '') || process.stdout.columns || 80
const rows = parseInt(process.env.GRID_HEIGHT || '') || process.stdout.rows || 24
// Reserve 3 lines for header/footer, cap width for readability
const gridWidth = Math.min(cols, 120)
const gridHeight = Math.max(rows - 3, 10)
// Grid size logged after logger is wired up

const engine = new VJEngine(gridWidth, gridHeight)
let clients: Set<WebSocket> = new Set()

// Broadcast helper
function broadcast(payload: string) {
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload)
    }
  })
}

// Wire up logger to broadcast
setLoggerBroadcast(broadcast)
logger.info(`Grid: ${gridWidth}x${gridHeight} (terminal: ${process.stdout.columns}x${process.stdout.rows})`)

// Sequencer with segment change callback (fires on segment boundaries)
const sequencer = new Sequencer((resolved: WorkloadSegment, index: number) => {
  engine.applyWorkload(resolved)
  broadcast(JSON.stringify({ type: 'SEGMENT_CHANGE', data: { index, total: sequencer.getTotalSegments() } }))
  saveState({
    workloadKey: 'session',
    segmentIndex: index,
    segmentStartTime: sequencer.getSegmentStartTime(),
    timestamp: Date.now()
  })
})

// Per-tick callback: apply resolved flow to engine every frame
sequencer.setTickCallback((resolved) => {
  engine.applyWorkload(resolved)
})

// Session manager for flow segment persistence
const sessionManager = new SessionManager(join(process.cwd(), 'sessions'))

// Default: a single idle flow segment (NCA generator, gentle)
const defaultFlowSegments: FlowSegment[] = [{
  duration: 30,
  flows: {
    generator: 'nca',
    weight: 0.6,
    speed: 0.8,
    chaos: 0.02,
    updateRate: 10,
  }
}]

// Restore from session or start with default
const persistedState = loadState()
if (persistedState?.workloadKey === 'session') {
  const session = sessionManager.resumeLatest()
  if (session && session.segments.length > 0) {
    sequencer.loadSegments(session.segments)
    const elapsedSinceStart = Date.now() - persistedState.segmentStartTime
    sequencer.jumpTo(persistedState.segmentIndex, elapsedSinceStart)
    logger.info(`Restored session at segment ${persistedState.segmentIndex + 1}/${session.segments.length}`)
  } else {
    sequencer.loadSegments(defaultFlowSegments)
  }
} else {
  sequencer.loadSegments(defaultFlowSegments)
}

// Client logs storage (ring buffer)
const MAX_LOGS = 500
const clientLogs: Array<{ level: string; message: string; timestamp: string; source: string }> = []

function addLog(entry: { level: string; message: string; timestamp: string }, source = 'client') {
  clientLogs.push({ ...entry, source })
  if (clientLogs.length > MAX_LOGS) clientLogs.shift()
  // Also log client errors/warnings via unified logger
  if (entry.level === 'error') {
    logger.error(`[CLIENT] ${entry.message}`)
  } else if (entry.level === 'warn') {
    logger.warn(`[CLIENT] ${entry.message}`)
  }
}

function renderTUI() {
  sequencer.update()
  engine.update()
  const grid = engine.getGrid()
  console.clear()
  console.log('--- VJ ART ENGINE TUI ---')
  grid.forEach(row => console.log(row.join('')))
  console.log('-------------------------')
}

const renderInterval = setInterval(renderTUI, 200)

wss.on('connection', (ws) => {
  clients.add(ws)

  // Send current session to newly connected client
  const session = sessionManager.getCurrentSession()
  if (session && session.segments.length > 0) {
    ws.send(JSON.stringify({ type: 'SESSION_LOAD', data: session }))
  }
  
  
  
    ws.on('message', (data) => {
      const message = JSON.parse(data.toString())
      if (message.type === 'INPUT') {
        if (message.data.type === 'keydown') {
          engine.handleInput(message.data.key)
        }
      } else if (message.type === 'LOG') {
        addLog(message.data)
      } else if (message.type === 'LOG_BATCH') {
        message.data.forEach((entry: { level: string; message: string; timestamp: string }) => addLog(entry))
      }
    })
  
  
  
    ws.on('close', () => {
  
  
    clients.delete(ws)
  })
})

// Creator -> Operator handoff (simplified for now)
app.post('/intent', (req, res) => {
  const intent = req.body as Record<string, unknown>
  // In a real scenario, this would trigger the Operator AI
  res.json({ status: 'received', intent })
})

// Legacy /workload endpoint — accepts FlowWorkload, appends to session
app.post('/workload', (req, res) => {
  const body = req.body as FlowWorkload
  if (!body.segments || body.segments.length === 0) {
    res.status(400).json({ error: 'No segments provided. Use FlowWorkload { segments: FlowSegment[] }' })
    return
  }

  if (!sessionManager.getCurrentSession()) {
    sessionManager.startSession()
  }

  sessionManager.appendSegments(body.segments)
  const total = sequencer.appendSegments(body.segments)

  broadcast(JSON.stringify({ type: 'FLOW_APPEND', data: body }))

  logger.info(`+${body.segments.length} flow segments (queue: ${total})`)
  res.json({ status: 'ok', added: body.segments.length, queueTotal: total })
})

// Asset registry (list)
app.get('/assets', (req, res) => {
  res.json({
    assets: [
      { handle: 'logo_ascii', tags: ['logo', 'monochrome'], category: 'graphics' }
    ]
  })
})

// Asset registry (fetch by handle)
app.get('/assets/:handle', (req, res) => {
  const { handle } = req.params
  if (handle === 'logo_ascii') {
    res.json({
      handle: 'logo_ascii',
      content: {
        width: 10,
        height: 5,
        glyphs: "  VJART   " + " VJ  ART  " + "VJ    ART " + " VJ  ART  " + "  VJART   "
      }
    })
  } else {
    res.status(404).json({ error: 'Asset not found' })
  }
})

let currentRhythm: { bpm: number; pulse: boolean } = { bpm: 120, pulse: false }

app.post('/rhythm', (req, res) => {
  currentRhythm = { ...currentRhythm, ...req.body }

  broadcast(JSON.stringify({ type: 'RHYTHM', data: currentRhythm }))

  res.json({ status: 'ok' })
})

// Control index discovery (read-only)
app.get('/control-index', (req, res) => {
  res.json({
    generators: ['nca', 'flow', 'wave', 'matrix', 'dots', 'blocks', 'noise', 'minimal', 'default'],
    channels: ['energy', 'density', 'velocity_x', 'velocity_y']
  })
})

// Comprehensive API Specification for AI consumption
app.get('/api/spec', (req, res) => {
  res.json({
    name: 'VJ Art Engine API',
    version: '0.1.0',
    description: 'AI-orchestrated ASCII VJ engine. Send workloads to control visuals.',
    base_url: 'http://localhost:3000',

    endpoints: {
      'POST /workload': {
        description: 'Deploy segments to the sequencer queue',
        query_params: {
          mode: '"append" to add to queue, "replace" (default) to clear and load'
        },
        body: 'OperatorWorkload',
        response: { status: 'ok', added: 'number of segments added', mode: 'append|replace', queueLength: 'total segments in queue' },
        example: {
          segments: [{
            state: {
              field_program: {
                generators: [{ id: 'nca', weight: 0.7 }]
              },
              palette: {
                colors: ['#00ff00', '#000000']
              },
              ui: []
            },
            exit: { time_seconds: 10 }
          }]
        },
        usage_tip: 'Use mode=append to queue multiple pieces. They play in order. Use mode=replace to start fresh.'
      },
      'POST /rhythm': {
        description: 'Set BPM and pulse state',
        body: { bpm: 'number (60-200)', pulse: 'boolean' },
        example: { bpm: 128, pulse: true }
      },
      'GET /state-summary': {
        description: 'Get current engine state'
      },
      'GET /logs': {
        description: 'Get client logs for AI diagnostics (self-improvement feedback loop)',
        query_params: {
          level: 'Filter by level: error, warn, info, debug',
          limit: 'Max logs to return (default 100)',
          since: 'ISO timestamp to filter logs after'
        },
        example_response: {
          logs: [{ level: 'error', message: 'WebGL error', timestamp: '2024-01-01T00:00:00Z', source: 'client' }],
          total: 42,
          levels: { error: 1, warn: 5, info: 36 }
        }
      },
      'GET /api/spec': {
        description: 'This specification endpoint'
      },
      'POST /demo': {
        description: 'Start the pre-programmed 2.5 minute demo sequence showcasing all features',
        response: { status: 'demo_started', segments: 11, duration_estimate: '~2.5 minutes' }
      },
      'GET /demo': {
        description: 'Get info about the demo sequence without starting it'
      }
    },

    generators: {
      description: 'Visual generators that produce ASCII patterns. Set via field_program.generators[].id',
      available: {
        nca: {
          name: 'Neural Cellular Automata',
          charset: '◦○◎●◉█▓▒░',
          style: 'Organic, cellular growth patterns',
          recommended_weight: '0.5-0.8'
        },
        flow: {
          name: 'Flow Field',
          charset: '→↗↑↖←↙↓↘∙',
          style: 'Directional arrows radiating from center',
          recommended_weight: '0.6-0.9'
        },
        wave: {
          name: 'Wave',
          charset: '∿≈≋〜～',
          style: 'Horizontal sine wave patterns',
          recommended_weight: '0.4-0.7'
        },
        matrix: {
          name: 'Matrix Rain',
          charset: '01アイウエオカキクケコ',
          style: 'Digital rain, scrolling characters',
          recommended_weight: '0.5-0.8'
        },
        dots: {
          name: 'Braille Dots',
          charset: '⠁⠂⠄⠈⠐⠠⡀⢀⣀⣤⣶⣿',
          style: 'Fine-grained braille density patterns',
          recommended_weight: '0.4-0.7'
        },
        blocks: {
          name: 'Block Graphics',
          charset: '█▀▄▌▐░▒▓',
          style: 'Chunky block patterns, high contrast',
          recommended_weight: '0.7-1.0'
        },
        noise: {
          name: 'Static Noise',
          charset: '░▒▓█▄▀▐▌',
          style: 'TV static, random noise',
          recommended_weight: '0.8-1.0'
        },
        minimal: {
          name: 'Minimal',
          charset: '·•●',
          style: 'Sparse, zen-like dots',
          recommended_weight: '0.1-0.4'
        },
        default: {
          name: 'Default ASCII',
          charset: '@%#*+=-:. ',
          style: 'Classic ASCII density ramp',
          recommended_weight: '0.3-0.7'
        }
      }
    },

    palette: {
      description: 'Color control via palette.colors array',
      format: 'Hex color strings',
      indices: {
        0: 'Foreground color (character color)',
        1: 'Background color'
      },
      examples: {
        'Matrix green': ['#00ff00', '#000000'],
        'Cyberpunk': ['#ff00ff', '#000011'],
        'Ocean': ['#00ffff', '#000022'],
        'Fire': ['#ff6600', '#110000'],
        'Monochrome': ['#ffffff', '#000000'],
        'Neon pink': ['#ff0088', '#000000'],
        'Forest': ['#aaff00', '#001100'],
        'Purple haze': ['#aa00ff', '#110011'],
        'Amber terminal': ['#ffaa00', '#000000'],
        'Ice': ['#88ffff', '#000022']
      }
    },

    weight: {
      description: 'Density control via generators[].weight',
      range: '0.0 to 1.0',
      effect: 'Controls what percentage of cells are filled with characters',
      guide: {
        sparse: '0.1-0.3 (minimal, zen)',
        medium: '0.4-0.6 (balanced)',
        dense: '0.7-0.9 (busy, intense)',
        maximum: '1.0 (full coverage)'
      }
    },

    ui_sprites: {
      description: 'Overlay text/graphics via state.ui array',
      structure: {
        ui_id: 'Unique identifier string',
        region: {
          id: 'Region name',
          rect: '[x, y, width, height] as 0.0-1.0 normalized coordinates'
        },
        render: {
          glyph_rows: 'Array of strings (ASCII art lines)',
          color_rows: 'Optional per-character colors',
          alpha_rows: 'Optional per-character alpha'
        }
      },
      tips: [
        'Add padding (spaces) around UI elements to create contrast with background',
        'Use box-drawing characters: ┌┐└┘│─═║╔╗╚╝',
        'Rect coordinates are normalized 0-1 (0.5 = center)'
      ]
    },

    modulators: {
      description: 'Animate parameters over time with LFO-style modulation',
      status: 'FULLY IMPLEMENTED',
      sources: ['sine', 'saw', 'square', 'triangle', 'random', 'beat'],
      structure: {
        target_path: 'Path to parameter (e.g., "generators[0].weight")',
        source: 'Modulator waveform type',
        range: '[min, max] output range',
        rate_hz: 'Oscillation frequency (default 1)',
        depth: 'Modulation intensity 0-1 (default 1)'
      },
      example: {
        target_path: 'generators[0].weight',
        source: 'sine',
        range: [0.3, 0.8],
        rate_hz: 0.5,
        depth: 1
      }
    },

    transitions: {
      description: 'Crossfade between segments for smooth visual transitions',
      status: 'FULLY IMPLEMENTED',
      structure: {
        duration_seconds: 'Number of seconds to interpolate between states'
      },
      effect: 'During transition, colors interpolate and generator weights blend smoothly',
      example: { transition: { duration_seconds: 2 } }
    },

    update_rate: {
      description: 'Control animation speed via field_program.update_rate_hz',
      status: 'FULLY IMPLEMENTED',
      range: '1-60 Hz (default 10)',
      effect: 'Higher values = faster animation, more CPU usage',
      example: { field_program: { generators: [{ id: 'matrix', weight: 0.7 }], update_rate_hz: 20 } }
    },

    multi_generator: {
      description: 'Blend multiple generators simultaneously',
      status: 'FULLY IMPLEMENTED',
      structure: 'Array of { id, weight, params } in field_program.generators',
      blending: 'Characters are selected from each generator proportionally to their weight',
      example: {
        field_program: {
          generators: [
            { id: 'nca', weight: 0.5, params: { speed: 1.0 } },
            { id: 'noise', weight: 0.3, params: {} }
          ]
        }
      }
    },

    generator_params: {
      description: 'Per-generator parameter controls',
      status: 'FULLY IMPLEMENTED',
      params: {
        speed: 'Animation speed multiplier (default 1.0)',
        scale: 'Pattern scale (default 1.0)',
        offset: 'Phase offset for timing variations',
        direction: 'Direction angle in radians (for flow, directional patterns)',
        density: 'Character density 0-1 (default 1.0)',
        chaos: 'Per-generator randomness amount 0-1'
      },
      example: { params: { speed: 1.5, scale: 0.8, direction: 1.57, chaos: 0.2 } }
    },

    transforms: {
      description: 'Visual transforms applied to entire field',
      status: 'FULLY IMPLEMENTED',
      location: 'field_program.transforms',
      options: {
        scale: 'Zoom level (1.0 = normal, 2.0 = 2x zoom, 0.5 = zoomed out)',
        rotation: 'Rotation in radians (0 to 2*PI)',
        pan: '[x, y] offset from -1 to 1',
        mirror: {
          horizontal: 'Mirror left-right',
          vertical: 'Mirror top-bottom',
          diagonal: 'Mirror diagonally',
          kaleidoscope: 'Number of segments (2, 4, 6, 8) for kaleidoscope effect'
        }
      },
      example: {
        transforms: {
          scale: 1.2,
          rotation: 0.5,
          pan: [0.1, 0],
          mirror: { kaleidoscope: 6 }
        }
      }
    },

    post_processing: {
      description: 'Post-processing effects applied after rendering',
      status: 'FULLY IMPLEMENTED',
      location: 'field_program.post_processing',
      effects: {
        blur: 'Blur amount 0-1 (smooths edges)',
        glow: { intensity: '0-1', radius: '1-10' },
        feedback: {
          amount: 'Trail intensity 0-1',
          decay: 'How fast trails fade 0-1',
          offset: '[x, y] direction of trail shift'
        },
        strobe: {
          rate_hz: 'Flash frequency',
          duty: 'On-time ratio 0-1',
          color: 'Flash color (hex)'
        },
        invert: 'Boolean - invert all colors',
        pixelate: 'Block size (2 = 2x2 pixels)',
        scanlines: { density: '0-1', intensity: '0-1' }
      },
      example: {
        post_processing: {
          feedback: { amount: 0.5, decay: 0.85, offset: [1, 0] },
          scanlines: { density: 0.5, intensity: 0.3 }
        }
      }
    },

    timing_controls: {
      description: 'Timing and rhythm adjustments',
      status: 'FULLY IMPLEMENTED',
      location: 'field_program.timing',
      options: {
        tempo_mult: 'Tempo multiplier (0.25 = quarter, 2.0 = double speed)',
        swing: 'Swing amount 0-1 (0 = straight, affects timing feel)',
        quantize: 'Beat division to snap to (4 = quarter, 8 = eighth)',
        phase_offset: 'Phase offset in beats 0-1',
        freeze: 'Boolean - pause animation completely'
      },
      example: { timing: { tempo_mult: 1.5, swing: 0.3 } }
    },

    color_controls: {
      description: 'Color processing and manipulation',
      status: 'FULLY IMPLEMENTED',
      location: 'field_program.color_controls',
      options: {
        brightness: '-1 to 1 (0 = normal)',
        contrast: '0 to 2 (1 = normal)',
        saturation: '0 to 2 (1 = normal)',
        hue_rotate: 'Hue rotation 0-360 degrees',
        color_cycle: {
          rate_hz: 'Cycling speed',
          range: '[min, max] hue range to cycle through'
        }
      },
      example: {
        color_controls: {
          brightness: 0.1,
          contrast: 1.2,
          color_cycle: { rate_hz: 0.1, range: [0, 180] }
        }
      }
    },

    random_controls: {
      description: 'Randomization and chaos controls',
      status: 'FULLY IMPLEMENTED',
      location: 'field_program.random',
      options: {
        seed: 'Master random seed (0 = time-based, set for reproducibility)',
        chaos: 'Global chaos amount 0-1 (adds randomness to all patterns)',
        auto_vary: {
          enabled: 'Boolean - enable auto-variation',
          rate_hz: 'How often to vary',
          amount: 'Variation intensity 0-1',
          targets: 'Array of params to vary: ["weight", "speed"]'
        },
        glitch: {
          probability: 'Chance of glitch per frame 0-1',
          intensity: 'Glitch severity 0-1',
          types: 'Array of glitch types: ["shift", "noise", "corrupt", "slice"]'
        }
      },
      example: {
        random: {
          chaos: 0.3,
          glitch: { probability: 0.2, intensity: 0.5, types: ['shift', 'slice'] }
        }
      }
    },

    sequencing: {
      description: 'Multi-segment sequences with automatic timing-based advancement',
      status: 'FULLY WIRED - sequencer advances through segments based on exit conditions',
      structure: {
        segments: 'Array of WorkloadSegment objects',
        'segment.exit': {
          time_seconds: 'Advance to next segment after N seconds',
          beats: 'Advance after N beats (requires /rhythm tap pulses)',
          max_seconds: 'Maximum duration before forcing advance'
        },
        'segment.transition': {
          duration_seconds: 'Crossfade duration in seconds (IMPLEMENTED)'
        },
        'segment.modulators': 'Array of modulator definitions for this segment (IMPLEMENTED)'
      },
      example: {
        segments: [
          { state: { field_program: { generators: [{ id: 'minimal', weight: 0.3 }] }, palette: { colors: ['#888888', '#000000'] }, ui: [] }, exit: { time_seconds: 10 } },
          { state: { field_program: { generators: [{ id: 'wave', weight: 0.6 }] }, palette: { colors: ['#00ffff', '#000022'] }, ui: [] }, exit: { time_seconds: 15 } },
          { state: { field_program: { generators: [{ id: 'blocks', weight: 0.9 }] }, palette: { colors: ['#ff00ff', '#000000'] }, ui: [] }, exit: { time_seconds: 10 } }
        ]
      },
      monitoring: 'GET /state-summary returns sequencer.current_segment, total_segments, progress'
    },

    keyboard_controls: {
      description: 'Client-side keyboard shortcuts',
      bindings: {
        '+/-': 'Increase/decrease generator weight',
        '1-9': 'Switch generator (1:nca, 2:flow, 3:wave, 4:matrix, 5:dots, 6:blocks, 7:noise, 8:minimal, 9:default)',
        'SPACE/T': 'Tap tempo',
        'U': 'Toggle UI visibility',
        'C': 'Clear grid',
        'Arrow Up/Down': 'Speed up/down',
        'r/R': 'Rotate clockwise/counter-clockwise',
        'z/Z': 'Zoom in/out',
        'h': 'Toggle horizontal mirror',
        'v': 'Toggle vertical mirror',
        'i': 'Toggle color invert',
        'f': 'Freeze/unfreeze animation',
        'g': 'Toggle glitch effect',
        '[/]': 'Decrease/increase chaos'
      }
    },

    ai_usage_guide: {
      description: 'How AI should operate this engine',
      workflow: [
        '1. Read /api/spec to understand available controls',
        '2. POST to /workload with desired visual state',
        '3. Use /rhythm to set BPM for tempo-synced animations',
        '4. Chain multiple workloads for sequences',
        '5. Monitor /state-summary for current state'
      ],
      tips: [
        'Match generator to mood: minimal for calm, blocks for intense, wave for flowing',
        'Use complementary foreground/background colors',
        'Weight 0.5-0.7 works well for most generators',
        'Add UI sprites for text overlays and branding',
        'Vary BPM to match energy level'
      ],
      example_sequence: [
        { generator: 'minimal', weight: 0.2, colors: ['#888888', '#000000'], duration: 10, mood: 'intro/calm' },
        { generator: 'wave', weight: 0.5, colors: ['#00ffff', '#000022'], duration: 15, mood: 'building' },
        { generator: 'flow', weight: 0.7, colors: ['#ff6600', '#110000'], duration: 20, mood: 'energetic' },
        { generator: 'blocks', weight: 0.9, colors: ['#ff00ff', '#000000'], duration: 15, mood: 'peak' },
        { generator: 'dots', weight: 0.4, colors: ['#00ff88', '#000011'], duration: 10, mood: 'cooldown' }
      ]
    }
  })
})

// State summary (compact field metrics)
app.get('/state-summary', (req, res) => {
  res.json({
    metrics: {
      motion_energy: 0.5,
      contrast: 0.8,
      density: 0.3
    },
    rhythm: currentRhythm,
    session_active: !!sessionManager.getCurrentSession(),
    sequencer: {
      current_segment: sequencer.getCurrentIndex(),
      total_segments: sequencer.getTotalSegments(),
      progress: sequencer.getProgress()
    }
  })
})

// Demo sequence endpoint — TODO: convert demo to flow segments
app.post('/demo', (req, res) => {
  // Demo is temporarily disabled — needs conversion to FlowSegment format
  res.json({
    status: 'disabled',
    message: 'Demo sequence needs conversion to FlowSegment format. Use /session/append instead.',
  })
})

app.get('/demo', (req, res) => {
  res.json({
    description: '10-minute extended demo with 60 segments showcasing ALL features',
    segments: demoSequence.segments.length,
    duration_estimate: '~10 minutes',
    structure: {
      opening: 'Segments 1-5: Emergence from void',
      building: 'Segments 6-15: Energy rising',
      first_peak: 'Segments 16-22: Energy surge',
      descent: 'Segments 23-30: Cooling down',
      middle_journey: 'Segments 31-42: Exploration',
      second_peak: 'Segments 43-50: Intensity',
      resolution: 'Segments 51-60: Return to calm'
    },
    features_demonstrated: [
      'All 9 generators with varied parameters',
      'Smooth transitions with crossfade (0.2-6 seconds)',
      'Modulators (sine, saw, square, triangle)',
      'Multi-generator blending (up to 3 layers)',
      'Dynamic update rates (2-24 Hz)',
      'Visual transforms (rotation, scale, pan, mirror, kaleidoscope 4/6/8)',
      'Post-processing (feedback/trails, blur, strobe, scanlines, pixelate, invert)',
      'Color controls (brightness, contrast, saturation, color cycling)',
      'Timing controls (tempo multiplier, swing)',
      'Randomization (chaos, glitch types: shift/slice/corrupt/noise, auto-variation, seeded random)'
    ],
    segment_timing: 'Non-predictable durations: 4-18 seconds per segment',
    usage: 'POST /demo to start'
  })
})

// ===== OVERLAY CHANNEL (same schema as workload, imposed on top) =====

// Overlay state - same State schema as segment.state, composited over running sequence
// POST to set, DELETE to clear
app.post('/overlay', (req, res) => {
  const overlay = req.body as Overlay
  engine.setOverlay(overlay)
  broadcast(JSON.stringify({ type: 'OVERLAY', data: overlay }))
  const blendMode = overlay.blend?.mode || 'over'
  const opacity = overlay.blend?.opacity ?? 1
  logger.info(`Overlay set: ${overlay.state?.ui?.length || 0} UI, blend=${blendMode}, opacity=${opacity}`)
  res.json({ status: 'ok' })
})

app.get('/overlay', (req, res) => {
  res.json(engine.getOverlay())
})

app.delete('/overlay', (req, res) => {
  engine.clearOverlay()
  broadcast(JSON.stringify({ type: 'OVERLAY', data: null }))
  logger.info('Overlay cleared')
  res.json({ status: 'ok' })
})

// Client logs endpoint for AI diagnostics
app.get('/logs', (req, res) => {
  const level = req.query.level as string | undefined
  const limit = parseInt(req.query.limit as string) || 100
  const since = req.query.since as string | undefined

  let filtered = clientLogs
  if (level) {
    filtered = filtered.filter(l => l.level === level)
  }
  if (since) {
    filtered = filtered.filter(l => l.timestamp > since)
  }

  res.json({
    logs: filtered.slice(-limit),
    total: clientLogs.length,
    levels: {
      error: clientLogs.filter(l => l.level === 'error').length,
      warn: clientLogs.filter(l => l.level === 'warn').length,
      info: clientLogs.filter(l => l.level === 'info').length
    }
  })
})


// ===== SESSION ENDPOINTS (Flow-based segments with persistence) =====

app.post('/session/start', (req, res) => {
  const session = sessionManager.startSession()
  sequencer.loadSegments([])
  broadcast(JSON.stringify({ type: 'SESSION_START', data: { id: session.id } }))
  logger.info(`Session started: ${session.id}`)
  res.json({ status: 'ok', session: { id: session.id, createdAt: session.createdAt } })
})

app.post('/session/append', (req, res) => {
  const body = req.body as FlowWorkload
  if (!body.segments || body.segments.length === 0) {
    res.status(400).json({ error: 'No segments provided' })
    return
  }

  // Auto-start session if none active
  if (!sessionManager.getCurrentSession()) {
    sessionManager.startSession()
  }

  sessionManager.appendSegments(body.segments)
  const total = sequencer.appendSegments(body.segments)

  broadcast(JSON.stringify({ type: 'FLOW_APPEND', data: body }))

  const session = sessionManager.getCurrentSession()!
  logger.info(`+${body.segments.length} flow segments (session: ${session.segments.length}, queue: ${total})`)
  res.json({
    status: 'ok',
    added: body.segments.length,
    sessionTotal: session.segments.length,
    queueTotal: total,
  })
})

app.get('/session/current', (req, res) => {
  const session = sessionManager.getCurrentSession()
  if (!session) {
    res.json({ session: null })
    return
  }
  res.json({ session })
})

app.get('/session/list', (req, res) => {
  res.json({ sessions: sessionManager.listSessions() })
})

app.get('/session/:id', (req, res) => {
  const session = sessionManager.loadSession(req.params.id)
  if (!session) {
    res.status(404).json({ error: 'Session not found' })
    return
  }
  res.json({ session })
})

app.post('/session/resume', (req, res) => {
  const { id } = req.body as { id?: string }
  let session

  if (id) {
    session = sessionManager.loadSession(id)
  } else {
    session = sessionManager.resumeLatest()
  }

  if (!session) {
    res.status(404).json({ error: 'No session found' })
    return
  }

  sequencer.loadSegments(session.segments)
  broadcast(JSON.stringify({ type: 'SESSION_LOAD', data: session }))
  logger.info(`Session resumed: ${session.id} (${session.segments.length} segments)`)
  res.json({
    status: 'ok',
    session: {
      id: session.id,
      segmentCount: session.segments.length,
    },
  })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  logger.info(`Bridge server listening on port ${PORT}`)
})

// Graceful shutdown
function shutdown() {
  logger.info('Shutting down...')
  clearInterval(renderInterval)
  wss.clients.forEach(client => client.close())
  wss.close()
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
  // Force exit after 2s if graceful shutdown fails
  setTimeout(() => process.exit(0), 2000)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
