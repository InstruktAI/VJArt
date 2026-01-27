// Client-side logger that sends logs to the bridge for diagnostics

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_BUFFER: Array<{ level: LogLevel; message: string; timestamp: string }> = []
const FLUSH_INTERVAL = 2000
const MAX_BUFFER = 50

let wsConnection: WebSocket | null = null

export function setLoggerWebSocket(ws: WebSocket) {
  wsConnection = ws
}

export function logToServer(level: LogLevel, message: string) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString()
  }

  // Also log to console
  const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
  consoleFn(`[${level.toUpperCase()}] ${message}`)

  LOG_BUFFER.push(entry)

  // Keep buffer bounded
  if (LOG_BUFFER.length > MAX_BUFFER) {
    LOG_BUFFER.shift()
  }

  // Send immediately for errors
  if (level === 'error' && wsConnection?.readyState === WebSocket.OPEN) {
    wsConnection.send(JSON.stringify({ type: 'LOG', data: entry }))
  }
}

// Flush logs periodically
setInterval(() => {
  if (LOG_BUFFER.length > 0 && wsConnection?.readyState === WebSocket.OPEN) {
    wsConnection.send(JSON.stringify({ type: 'LOG_BATCH', data: LOG_BUFFER.splice(0) }))
  }
}, FLUSH_INTERVAL)

// Capture unhandled errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logToServer('error', `Uncaught: ${event.message} at ${event.filename}:${event.lineno}`)
  })

  window.addEventListener('unhandledrejection', (event) => {
    logToServer('error', `Unhandled rejection: ${event.reason}`)
  })
}
