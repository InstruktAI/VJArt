import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'
import type { FlowSegment } from '@vj-art/engine'
import { logger } from './logger'

export interface Session {
  id: string
  createdAt: string
  segments: FlowSegment[]
}

export interface SessionSummary {
  id: string
  date: string
  createdAt: string
  segmentCount: number
  totalDuration: number
}

export class SessionManager {
  private baseDir: string
  private current: Session | null = null

  constructor(baseDir: string) {
    this.baseDir = baseDir
    mkdirSync(baseDir, { recursive: true })
  }

  /** Start a new session */
  startSession(): Session {
    const now = new Date()
    const id = `session-${now.toISOString().replace(/[:.]/g, '-')}`
    const session: Session = {
      id,
      createdAt: now.toISOString(),
      segments: [],
    }
    this.current = session
    this.saveToDisk()
    logger.info(`Session started: ${id}`)
    return session
  }

  /** Append flow segment(s) to current session */
  appendSegments(segments: FlowSegment[]): void {
    if (!this.current) {
      this.startSession()
    }
    this.current!.segments.push(...segments)
    this.saveToDisk()
    logger.info(`Appended ${segments.length} flow segments (total: ${this.current!.segments.length})`)
  }

  /** Get current session */
  getCurrentSession(): Session | null {
    return this.current
  }

  /** Resume the most recent session */
  resumeLatest(): Session | null {
    const sessions = this.listSessions()
    if (sessions.length === 0) return null

    // Sessions are sorted newest first
    const latest = sessions[0]!
    return this.loadSession(latest.id, latest.date)
  }

  /** List all sessions across all dates */
  listSessions(): SessionSummary[] {
    const summaries: SessionSummary[] = []

    if (!existsSync(this.baseDir)) return summaries

    const dateDirs = readdirSync(this.baseDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .sort()
      .reverse()

    for (const date of dateDirs) {
      const dateDir = join(this.baseDir, date)
      const files = readdirSync(dateDir)
        .filter(f => f.endsWith('.json'))
        .sort()
        .reverse()

      for (const file of files) {
        try {
          const data = JSON.parse(readFileSync(join(dateDir, file), 'utf-8')) as Session
          const totalDuration = data.segments.reduce((sum, s) => sum + s.duration, 0)
          summaries.push({
            id: data.id,
            date,
            createdAt: data.createdAt,
            segmentCount: data.segments.length,
            totalDuration,
          })
        } catch {
          // Skip corrupt files
        }
      }
    }

    return summaries
  }

  /** Load a specific session by id and date */
  loadSession(id: string, date?: string): Session | null {
    // If date provided, look directly
    if (date) {
      const filePath = join(this.baseDir, date, `${id}.json`)
      if (existsSync(filePath)) {
        const session = JSON.parse(readFileSync(filePath, 'utf-8')) as Session
        this.current = session
        logger.info(`Loaded session: ${id} (${session.segments.length} segments)`)
        return session
      }
    }

    // Otherwise search all dates
    const dateDirs = readdirSync(this.baseDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)

    for (const dir of dateDirs) {
      const filePath = join(this.baseDir, dir, `${id}.json`)
      if (existsSync(filePath)) {
        const session = JSON.parse(readFileSync(filePath, 'utf-8')) as Session
        this.current = session
        logger.info(`Loaded session: ${id} (${session.segments.length} segments)`)
        return session
      }
    }

    return null
  }

  // --- Private ---

  private saveToDisk(): void {
    if (!this.current) return

    const date = this.current.createdAt.split('T')[0]!
    const dateDir = join(this.baseDir, date)
    mkdirSync(dateDir, { recursive: true })

    const filePath = join(dateDir, `${this.current.id}.json`)
    writeFileSync(filePath, JSON.stringify(this.current, null, 2))
  }
}
