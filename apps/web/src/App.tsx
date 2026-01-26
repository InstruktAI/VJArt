import React, { useEffect, useState, useRef } from 'react'
import { VJEngine, AssetIngestor, RhythmDetector } from '@vj-art/engine'
import { ASCIIRenderer } from './Renderer'

function App() {
  const [connected, setConnected] = useState(false)
  const [grid, setGrid] = useState<string[][]>([])
  const engineRef = useRef(new VJEngine(80, 40))
  const [isMicActive, setIsMicActive] = useState(false)
  const rhythmDetectorRef = useRef(new RhythmDetector())

  useEffect(() => {
    engineRef.current.registerRenderer({
      id: 'webgl-primary',
      name: 'WebGL ASCII Renderer',
      supportedGenerators: ['nca', 'flow_field', 'curl_noise'],
      maxResolution: { width: 1920, height: 1080 },
      costTier: 'med'
    })

    const ws = new WebSocket('ws://localhost:3000')

    ws.onopen = () => {
      setConnected(true)
      console.log('Connected to bridge')
    }

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.type === 'WORKLOAD') {
        engineRef.current.applyWorkload(message.data.segments[0])
        setGrid([...engineRef.current.getGrid()])
      }
    }

    ws.onclose = () => {
      setConnected(false)
      console.log('Disconnected from bridge')
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'INPUT', data: { key: e.key, type: 'keydown' } }))
      }
      engineRef.current.handleInput(e.key)
    }
    window.addEventListener('keydown', handleKeyDown)

    const interval = setInterval(() => {
      engineRef.current.update()
      setGrid([...engineRef.current.getGrid()])
    }, 100)

    return () => {
      ws.close()
      clearInterval(interval)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file || !file.type.startsWith('image/')) return

    const img = new Image()
    img.src = URL.createObjectURL(file)
    await img.decode()

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = 80
    canvas.height = 40
    ctx.drawImage(img, 0, 0, 80, 40)
    const imageData = ctx.getImageData(0, 0, 80, 40)

    const asset = AssetIngestor.processImageData(imageData.data, 80, 40, 80, 40)
    console.log('Ingested Asset:', asset)
    
    // For now, let's just log it and maybe "apply" it to a workload segment
    // or just show it for a moment.
  }

  const toggleMic = async () => {
    if (isMicActive) {
      setIsMicActive(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const audioCtx = new AudioContext()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyzer = audioCtx.createAnalyser()
      source.connect(analyzer)
      setIsMicActive(true)

      const detect = () => {
        if (!isMicActive) return
        const beat = rhythmDetectorRef.current.processAudioStream(analyzer)
        if (beat) {
          engineRef.current.handleInput('t') // Trigger tap-like behavior
        }
        requestAnimationFrame(detect)
      }
      detect()
    } catch (err) {
      console.error('Error accessing microphone:', err)
    }
  }

  return (
    <div 
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      style={{ backgroundColor: '#000', color: '#0f0', minHeight: '100vh', padding: '1rem', fontFamily: 'monospace' }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          <span style={{ marginRight: '1rem' }}>VJ ART ENGINE</span>
          <button 
            onClick={toggleMic}
            style={{ backgroundColor: isMicActive ? '#f00' : '#333', color: '#fff', border: 'none', padding: '2px 8px', cursor: 'pointer' }}
          >
            {isMicActive ? 'MIC ON' : 'MIC OFF'}
          </button>
        </div>
        <span>STATUS: {connected ? 'LIVE' : 'OFFLINE'}</span>
      </header>
      <main>
        {grid.length > 0 ? (
          <ASCIIRenderer grid={grid} />
        ) : (
          <div style={{ border: '1px solid #333', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            WAITING FOR WORKLOAD... (OR DROP IMAGE)
          </div>
        )}
      </main>
      <footer style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666' }}>
        KEYS: [+] Weight Up, [-] Weight Down, [T] Tap Rhythm, [U] Toggle UI, [C] Clear
      </footer>
    </div>
  )
}


export default App
