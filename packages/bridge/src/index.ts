import express from 'express'
import { WebSocketServer, WebSocket } from 'ws'
import http from 'http'

const app = express()
app.use(express.json())

const server = http.createServer(app)
const wss = new WebSocketServer({ server })

let currentWorkload: any = null
let clients: Set<WebSocket> = new Set()

wss.on('connection', (ws) => {
  clients.add(ws)
  console.log('Client connected')
  
  if (currentWorkload) {
    ws.send(JSON.stringify({ type: 'WORKLOAD', data: currentWorkload }))
  }

  ws.on('close', () => {
    clients.delete(ws)
    console.log('Client disconnected')
  })
})

// Creator -> Operator handoff (simplified for now)
app.post('/intent', (req, res) => {
  const intent = req.body
  console.log('Received intent:', intent)
  // In a real scenario, this would trigger the Operator AI
  res.json({ status: 'received', intent })
})

// Operator -> Engine execution
app.post('/workload', (req, res) => {
  const workload = req.body
  currentWorkload = workload
  console.log('Received workload update')
  
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

let currentRhythm: any = { bpm: 120, pulse: false }

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
