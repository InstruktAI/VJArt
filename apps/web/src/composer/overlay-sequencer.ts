import type { Overlay } from '@vj-art/engine'
import type { OverlayPreset } from './overlays'
import { presetToOverlay } from './overlays'

export interface OverlayEvent {
  set?: Overlay
  clear?: boolean
}

export class OverlaySequencer {
  private presets: OverlayPreset[]
  private elapsed: number = 0
  private nextOverlayAt: number
  private currentPreset: OverlayPreset | null = null
  private currentEndAt: number = 0
  private blendModes: Array<'over' | 'blend' | 'screen' | 'add'> = ['over', 'blend', 'screen', 'add']
  private blendIndex: number = 0

  constructor(presets: OverlayPreset[]) {
    this.presets = [...presets]
    this.nextOverlayAt = this.randomInterval()
  }

  tick(deltaSec: number): OverlayEvent | null {
    this.elapsed += deltaSec

    // Currently showing an overlay — check if it should end
    if (this.currentPreset) {
      if (this.elapsed >= this.currentEndAt) {
        this.currentPreset = null
        this.nextOverlayAt = this.elapsed + this.randomInterval()
        return { clear: true }
      }
      return null
    }

    // Waiting for next overlay
    if (this.elapsed >= this.nextOverlayAt) {
      // 30% chance of skipping (silence between overlays)
      if (Math.random() < 0.3) {
        this.nextOverlayAt = this.elapsed + this.randomInterval()
        return null
      }

      return this.activateRandom()
    }

    return null
  }

  addPresets(presets: OverlayPreset[]): void {
    this.presets.push(...presets)
  }

  private activateRandom(): OverlayEvent | null {
    if (this.presets.length === 0) return null

    const preset = this.presets[Math.floor(Math.random() * this.presets.length)]!
    this.currentPreset = preset

    const duration = preset.duration[0] + Math.random() * (preset.duration[1] - preset.duration[0])
    this.currentEndAt = this.elapsed + duration

    // Cycle blend mode
    const overlay = presetToOverlay(preset)
    overlay.blend = {
      ...overlay.blend,
      mode: this.blendModes[this.blendIndex % this.blendModes.length],
    }
    this.blendIndex++

    return { set: overlay }
  }

  private randomInterval(): number {
    return 15 + Math.random() * 45 // 15–60 seconds
  }
}
