import React, { useEffect, useState } from 'react'

function App() {
  const [workload, setWorkload] = useState<any>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000')

    ws.onopen = () => {
      setConnected(true)
      console.log('Connected to bridge')
    }

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.type === 'WORKLOAD') {
        console.log('Received workload:', message.data)
        setWorkload(message.data)
      }
    }

    ws.onclose = () => {
      setConnected(false)
      console.log('Disconnected from bridge')
    }

    return () => ws.close()
  }, [])

  return (
    <div style={{ backgroundColor: '#1a1a1a', color: '#eee', minHeight: '100vh', padding: '2rem', fontFamily: 'monospace' }}>
      <h1>VJ Art Engine</h1>
      <p>Status: {connected ? 'Connected' : 'Disconnected'}</p>
      {workload && (
        <pre style={{ backgroundColor: '#000', padding: '1rem', overflow: 'auto' }}>
          {JSON.stringify(workload, null, 2)}
        </pre>
      )}
    </div>
  )
}

export default App