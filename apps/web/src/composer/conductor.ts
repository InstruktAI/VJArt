import type { MoodProfile } from './types'
import { FlowComposer } from './composer'
import { BUILT_IN_MOODS } from './moods'

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export class MoodConductor {
  private composer: FlowComposer
  private allMoods: MoodProfile[]
  private phraseDuration: number
  private elapsed: number = 0

  constructor(composer: FlowComposer, extraMoods: MoodProfile[] = []) {
    this.composer = composer
    this.allMoods = [...BUILT_IN_MOODS, ...extraMoods]
    this.phraseDuration = rand(15, 60)
  }

  addMoods(moods: MoodProfile[]): void {
    for (const m of moods) {
      if (!this.allMoods.find(e => e.id === m.id)) {
        this.allMoods.push(m)
      }
    }
  }

  removeMood(id: string): void {
    this.allMoods = this.allMoods.filter(m => m.id !== id)
  }

  tick(deltaSec: number): void {
    this.elapsed += deltaSec
    if (this.elapsed < this.phraseDuration) return

    this.elapsed = 0
    this.phraseDuration = rand(15, 60)

    if (this.allMoods.length < 2) return

    const current = this.composer.getCurrentMood()
    const candidates = this.allMoods.filter(m => m.id !== current.id)
    if (candidates.length === 0) return

    const next = candidates[Math.floor(Math.random() * candidates.length)]!
    const transitionSegments = Math.floor(rand(3, 8))

    this.composer.setMood(next, transitionSegments)
  }

  getComposer(): FlowComposer {
    return this.composer
  }

  getAllMoods(): MoodProfile[] {
    return this.allMoods
  }
}
