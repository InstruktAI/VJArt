import { State, WorkloadSegment } from './types'
import { InputDispatcher } from './input'
import { RhythmDetector } from './rhythm'
export * from './ingestion'
export * from './rhythm'
export * from './input'

export interface RendererCapabilities {
  id: string
  name: string
  supportedGenerators: string[]
  maxResolution: { width: number; height: number }
  costTier: 'low' | 'med' | 'high'
}

export class VJEngine {
  private currentState: State | null = null
  private grid: string[][] = []
  private width: number = 80
  private height: number = 40
  private registeredRenderers: Map<string, RendererCapabilities> = new Map()
  private inputDispatcher: InputDispatcher = new InputDispatcher()
  private rhythmDetector: RhythmDetector = new RhythmDetector()
  private genWeight: number = 0.5
  private showUI: boolean = true

  constructor(width: number = 80, height: number = 40) {
    this.width = width
    this.height = height
    this.initGrid()
  }

  public handleInput(key: string) {
    const intent = this.inputDispatcher.dispatch(key)
    if (!intent) return

    switch (intent) {
      case 'GEN_WEIGHT_INC':
        this.genWeight = Math.min(1.0, this.genWeight + 0.05)
        break
      case 'GEN_WEIGHT_DEC':
        this.genWeight = Math.max(0.0, this.genWeight - 0.05)
        break
      case 'UI_TOGGLE':
        this.showUI = !this.showUI
        break
      case 'RHYTHM_TAP':
        this.rhythmDetector.tap()
        break
      case 'CLEAR':
        this.initGrid()
        break
    }
  }

  public registerRenderer(capabilities: RendererCapabilities) {
    this.registeredRenderers.set(capabilities.id, capabilities)
    console.log(`Renderer registered: ${capabilities.name} (${capabilities.id})`)
  }

  public getCapabilities(): RendererCapabilities[] {
    return Array.from(this.registeredRenderers.values())
  }

  private initGrid() {
    this.grid = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => ' ')
    )
  }

  public applyWorkload(workload: WorkloadSegment) {
    this.currentState = workload.state
    if (this.currentState.field_program.resolution) {
      this.width = this.currentState.field_program.resolution.width
      this.height = this.currentState.field_program.resolution.height
      this.initGrid()
    }
    this.update()
  }

  private drawUI() {
    if (!this.currentState?.ui || !this.showUI) return

    this.currentState.ui.forEach(sprite => {
      const { rect } = sprite.region
      const startX = Math.floor(rect[0] * this.width)
      const startY = Math.floor(rect[1] * this.height)
      
      sprite.render.glyph_rows.forEach((row, dy) => {
        for (let dx = 0; dx < row.length; dx++) {
          const x = startX + dx
          const y = startY + dy
          if (x < this.width && y < this.height) {
            this.grid[y]![x] = row[dx]!
          }
        }
      })
    })
  }

  public update() {
    if (!this.currentState) return

    const tempo = this.rhythmDetector.getTempo()
    const pulseScale = (Math.sin(Date.now() / 1000 * (tempo / 60) * Math.PI * 2) + 1) / 2

    // Improved generator simulation (pseudo-NCA/Flow-field)
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const noise = Math.random()
        const effectiveWeight = this.genWeight * (0.8 + 0.4 * pulseScale)
        
        if (noise < effectiveWeight * 0.1) {
          const chars = '@%#*+=-:. '
          const charIdx = Math.floor(Math.abs(Math.sin((x + y) * 0.1 + Date.now() * 0.001)) * chars.length)
          this.grid[y]![x] = chars[charIdx]!
        } else if (noise > 0.98) {
          this.grid[y]![x] = '.'
        }
      }
    }

    this.drawUI()
  }

  public getGrid(): string[][] {
    return this.grid
  }
}