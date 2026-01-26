import express from 'express'
import { WebSocketServer, WebSocket } from 'ws'
import http from 'http'
import { VJEngine } from '@vj-art/engine'
import { OperatorWorkload } from '@vj-art/engine/dist/types'

const app = express()
app.use(express.json())

const server = http.createServer(app)
const wss = new WebSocketServer({ server })

const engine = new VJEngine(40, 20)
let currentWorkload: OperatorWorkload | null = null
let clients: Set<WebSocket> = new Set()

function renderTUI() {
  if (!currentWorkload) return
  engine.update()
  const grid = engine.getGrid()
  console.clear()
  console.log('--- VJ ART ENGINE TUI ---')
  grid.forEach(row => console.log(row.join('')))
  console.log('-------------------------')
}

setInterval(renderTUI, 200)

wss.on('connection', (ws) => {
  clients.add(ws)
  console.log('Client connected')
  
      if (currentWorkload) {
  
      ws.send(JSON.stringify({ type: 'WORKLOAD', data: currentWorkload }))
  
    }
  
  
  
    ws.on('message', (data) => {
      const message = JSON.parse(data.toString())
      if (message.type === 'INPUT') {
        console.log('Received client input:', message.data)
        if (message.data.type === 'keydown') {
          engine.handleInput(message.data.key)
        }
      }
    })
  
  
  
    ws.on('close', () => {
  
  
    clients.delete(ws)
    console.log('Client disconnected')
  })
})

// Creator -> Operator handoff (simplified for now)
app.post('/intent', (req, res) => {
  const intent = req.body as Record<string, unknown>
  console.log('Received intent:', intent)
  // In a real scenario, this would trigger the Operator AI
  res.json({ status: 'received', intent })
})

// Operator -> Engine execution
app.post('/workload/test-ui', (req, res) => {
  const workload = {
    segments: [{
      state: {
        field_program: { generators: [{ id: 'nca', weight: 0.5 }] },
        ui: [{
          ui_id: 'banner',
          region: { id: 'top', rect: [0.2, 0.2, 0.6, 0.2] as [number, number, number, number] },
          render: {
            glyph_rows: [
              '┌──────────┐',
              '│ VJ ART   │',
              '└──────────┘'
            ],
            color_rows: [],
            alpha_rows: []
          }
        }]
      }
    }]
  }
  currentWorkload = workload
  engine.applyWorkload(workload.segments[0])
  
  const payload = JSON.stringify({ type: 'WORKLOAD', data: workload })
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload)
    }
  })
  
  res.json({ status: 'ui-test-triggered' })
})

app.post('/workload', (req, res) => {
  const workload = req.body
  currentWorkload = workload
  console.log('Received workload update')
  
  if (workload.segments && workload.segments[0]) {
    engine.applyWorkload(workload.segments[0])
  }

  const payload = JSON.stringify({ type: 'WORKLOAD', data: workload })
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload)
    }
  })
  
  res.json({ status: 'ok' })
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
  console.log('Rhythm update:', currentRhythm)
  
  const payload = JSON.stringify({ type: 'RHYTHM', data: currentRhythm })
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload)
    }
  })
  
  res.json({ status: 'ok' })
})

// Control index discovery (read-only)
app.get('/control-index', (req, res) => {
  // This should be populated from the control-plane schema
  res.json({
    generators: ['nca', 'reaction_diffusion', 'flow_field', 'curl_noise'],
    channels: ['energy', 'density', 'velocity_x', 'velocity_y']
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
    current_workload_active: !!currentWorkload
  })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Bridge server listening on port ${PORT}`)
})
