import React, { useEffect, useRef } from 'react'
import { VJEngine, AssetIngestor, RhythmDetector, Sequencer, WorkloadSegment, Overlay, FlowSegment, FlowWorkload } from '@vj-art/engine'
import { ThreeRenderer } from './ThreeRenderer'
import { setLoggerWebSocket, logToServer } from './logger'
import { FlowComposer, MoodConductor, CALM, getAllMoods, OverlaySequencer, OVERLAY_PRESETS, assetToOverlayPreset } from './composer'

// Module-level singletons (no React ownership)
const composer = new FlowComposer(CALM)
const conductor = new MoodConductor(composer)
const overlaySequencer = new OverlaySequencer(OVERLAY_PRESETS)

getAllMoods().then(moods => {
  if (moods.length > 0) conductor.addMoods(moods)
}).catch(() => {})

function App() {
  const engineRef = useRef(new VJEngine(80, 40))
  const sequencerRef = useRef<Sequencer | null>(null)
  const rhythmDetectorRef = useRef(new RhythmDetector())
  const micActiveRef = useRef(false)

  // Shared buffers — renderer reads these directly via ref, no React state
  const buffersRef = useRef({
    charIndices: engineRef.current.getCharIndexBuffer(),
    intensities: engineRef.current.getIntensityBuffer(),
    colors: engineRef.current.getColorBuffer(),
    bgColor: [0, 0, 0] as [number, number, number],
    bloom: 1.35,
    scanlineOpacity: 0.12,
    dirty: true,
  })

  // Trackpad momentum
  const momentumRef = useRef({ velocity: 0, lastWheelTime: 0, isActive: false })
  const momentumFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const engine = engineRef.current

    engine.registerRenderer({
      id: 'webgl-primary',
      name: 'WebGL ASCII Renderer',
      supportedGenerators: ['nca', 'flow_field', 'curl_noise'],
      maxResolution: { width: 1920, height: 1080 },
      costTier: 'med',
    })

    const seq = new Sequencer((segment: WorkloadSegment, index: number) => {
      engine.applyWorkload(segment)
      if (segment.state.palette?.colors?.[1]) {
        const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(segment.state.palette.colors[1])
        if (m) {
          buffersRef.current.bgColor = [
            parseInt(m[1], 16) / 255,
            parseInt(m[2], 16) / 255,
            parseInt(m[3], 16) / 255,
          ]
        }
      }
      logToServer('info', `Segment ${index + 1}/${seq.getTotalSegments()}`)
    })
    sequencerRef.current = seq

    const initial = Array.from({ length: 4 }, () => composer.next())
    seq.loadSegments(initial)
    logToServer('info', `Composer: seeded ${initial.length} segments (mood: ${composer.getCurrentMood().name})`)

    // --- WebSocket ---
    const ws = new WebSocket('ws://localhost:3000')
    ws.onopen = () => {
      setLoggerWebSocket(ws)
      logToServer('info', 'Connected to bridge')
    }
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.type === 'OVERLAY') {
        if (message.data) {
          engine.setOverlay(message.data as Overlay)
        } else {
          engine.clearOverlay()
        }
      } else if (message.type === 'FLOW_APPEND') {
        const fw = message.data as FlowWorkload
        if (fw.segments?.length) seq.appendSegments(fw.segments)
      } else if (message.type === 'SESSION_START') {
        seq.loadSegments([])
      } else if (message.type === 'SESSION_LOAD') {
        const s = message.data as { id: string; segments: FlowSegment[] }
        if (s.segments) seq.loadSegments(s.segments)
      }
    }
    ws.onclose = () => logToServer('warn', 'Disconnected - running locally')

    // --- Input ---
    const handleKeyDown = (e: KeyboardEvent) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'INPUT', data: { key: e.key, type: 'keydown', shift: e.shiftKey } }))
      }
      if (e.key === 'ArrowLeft') {
        e.shiftKey ? seq.prevSegment() : seq.scrub(-0.5)
        e.preventDefault()
        return
      }
      if (e.key === 'ArrowRight') {
        e.shiftKey ? seq.nextSegment() : seq.scrub(0.5)
        e.preventDefault()
        return
      }
      if (e.key === ']') { seq.speedUp(); return }
      if (e.key === '[') { seq.speedDown(); return }
      if (e.key === 'p' || e.key === 'P') { seq.togglePause(); return }
      engine.handleInput(e.key)
    }
    window.addEventListener('keydown', handleKeyDown)

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      e.preventDefault()
      const now = Date.now()
      const dt = now - momentumRef.current.lastWheelTime
      momentumRef.current.lastWheelTime = now
      if (dt < 100) {
        if (!momentumRef.current.isActive) {
          momentumRef.current.isActive = true
          seq.setPaused(true)
        }
        seq.scrub(e.deltaX * 0.01)
        momentumRef.current.velocity = e.deltaX * 0.5
      }
      if (momentumFrameRef.current) cancelAnimationFrame(momentumFrameRef.current)
      const applyMomentum = () => {
        const elapsed = Date.now() - momentumRef.current.lastWheelTime
        if (elapsed > 100 && momentumRef.current.isActive) {
          if (Math.abs(momentumRef.current.velocity) > 0.5) {
            seq.scrub(momentumRef.current.velocity * 0.016)
            momentumRef.current.velocity *= 0.95
            momentumFrameRef.current = requestAnimationFrame(applyMomentum)
          } else {
            momentumRef.current.isActive = false
            momentumRef.current.velocity = 0
            seq.setPaused(false)
            momentumFrameRef.current = null
          }
        } else if (momentumRef.current.isActive) {
          momentumFrameRef.current = requestAnimationFrame(applyMomentum)
        }
      }
      momentumFrameRef.current = requestAnimationFrame(applyMomentum)
    }
    window.addEventListener('wheel', handleWheel, { passive: false })

    // --- Engine tick (10Hz) — writes shared buffers, zero React state ---
    let lastTime = Date.now()
    const interval = setInterval(() => {
      try {
        const now = Date.now()
        const deltaSec = (now - lastTime) / 1000
        lastTime = now

        conductor.tick(deltaSec)

        const overlayEvent = overlaySequencer.tick(deltaSec)
        if (overlayEvent?.set) engine.setOverlay(overlayEvent.set)
        else if (overlayEvent?.clear) engine.clearOverlay()

        if (seq.getRemainingSegments() < 2) {
          seq.appendSegments([composer.next()])
        }

        const resolved = seq.update()
        if (resolved) engine.applyWorkload(resolved)
        engine.update()

        // Point refs at engine's own buffers (no copy)
        const buf = buffersRef.current
        buf.charIndices = engine.getCharIndexBuffer()
        buf.intensities = engine.getIntensityBuffer()
        buf.colors = engine.getColorBuffer()

        const pp = engine.getState().postProcessing
        buf.bloom = 1.0 + (pp.glow?.intensity ?? 0.35)
        buf.scanlineOpacity = pp.scanlines?.intensity ?? 0.12
        buf.dirty = true
      } catch (err) {
        logToServer('error', `Update loop: ${err}`)
      }
    }, 100)

    return () => {
      ws.close()
      clearInterval(interval)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('wheel', handleWheel)
      if (momentumFrameRef.current) cancelAnimationFrame(momentumFrameRef.current)
    }
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file || !file.type.startsWith('image/')) return

    const img = new Image()
    img.src = URL.createObjectURL(file)
    img.decode().then(() => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      canvas.width = 80
      canvas.height = 40
      ctx.drawImage(img, 0, 0, 80, 40)
      const imageData = ctx.getImageData(0, 0, 80, 40)
      const asset = AssetIngestor.processImageData(imageData.data, 80, 40, 80, 40)
      const preset = assetToOverlayPreset(asset.glyphs, `drop-${Date.now()}`)
      overlaySequencer.addPresets([preset])
      logToServer('info', `Added dropped image as overlay preset: ${preset.id}`)
    })
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      style={{ backgroundColor: '#000', width: '100vw', height: '100vh', overflow: 'hidden' }}
    >
      <ThreeRenderer buffersRef={buffersRef} width={80} height={40} />
    </div>
  )
}

export default App
