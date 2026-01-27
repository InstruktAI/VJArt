// Bridge-side logger that outputs to terminal AND broadcasts to connected clients

type LogLevel = 'debug' | 'info' | 'warn' | 'error'
type BroadcastFn = (payload: string) => void

let broadcastFn: BroadcastFn | null = null

export function setLoggerBroadcast(fn: BroadcastFn) {
  broadcastFn = fn
}

export function log(level: LogLevel, message: string) {
  const timestamp = new Date().toISOString()
  const entry = { level, message, timestamp, source: 'bridge' }

  // Log to terminal
  const prefix = `[${level.toUpperCase()}]`
  if (level === 'error') {
    console.error(prefix, message)
  } else if (level === 'warn') {
    console.warn(prefix, message)
  } else {
    console.log(prefix, message)
  }

  // Broadcast to clients
  if (broadcastFn) {
    broadcastFn(JSON.stringify({ type: 'LOG', data: entry }))
  }
}

export const logger = {
  debug: (msg: string) => log('debug', msg),
  info: (msg: string) => log('info', msg),
  warn: (msg: string) => log('warn', msg),
  error: (msg: string) => log('error', msg)
}
