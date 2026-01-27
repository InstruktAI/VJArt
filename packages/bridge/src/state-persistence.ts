// Persist sequencer state across hot reloads
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const STATE_FILE = join(tmpdir(), 'vj-art-state.json')

interface PersistedState {
  workloadKey: string | null  // 'demo' or 'default' or 'custom'
  segmentIndex: number
  segmentStartTime: number
  timestamp: number
}

export function saveState(state: PersistedState): void {
  writeFileSync(STATE_FILE, JSON.stringify(state), 'utf-8')
}

export function loadState(): PersistedState | null {
  if (!existsSync(STATE_FILE)) return null
  try {
    const data = JSON.parse(readFileSync(STATE_FILE, 'utf-8')) as PersistedState
    // Only restore if state is less than 30 seconds old (hot reload window)
    if (Date.now() - data.timestamp < 30000) {
      return data
    }
    return null
  } catch {
    return null
  }
}

export function clearState(): void {
  if (existsSync(STATE_FILE)) {
    writeFileSync(STATE_FILE, '', 'utf-8')
  }
}
