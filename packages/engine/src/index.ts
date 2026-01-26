import { State, WorkloadSegment } from './types'

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

  constructor(width: number = 80, height: number = 40) {
    this.width = width
    this.height = height
    this.initGrid()
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
    if (!this.currentState?.ui) return

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

    // Minimal generator simulation
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const noise = Math.random()
        const weight = this.currentState.field_program.generators[0]?.weight || 0.5
        if (noise < weight * 0.1) {
          this.grid[y]![x] = '#'
        } else if (noise > 0.9) {
          this.grid[y]![x] = '.'
        } else {
          this.grid[y]![x] = ' '
        }
      }
    }

    this.drawUI()
  }

  public getGrid(): string[][] {
    return this.grid
  }
}