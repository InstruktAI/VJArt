import { State, WorkloadSegment } from './types'

export class VJEngine {
  private currentState: State | null = null
  private grid: string[][] = []
  private width: number = 80
  private height: number = 40

  constructor(width: number = 80, height: number = 40) {
    this.width = width
    this.height = height
    this.initGrid()
  }

  private initGrid() {
    this.grid = Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => ' ')
    )
  }

  public applyWorkload(workload: WorkloadSegment) {
    this.currentState = workload.state
    // This is where the magic happens: generators, coupling, etc.
    // For now, let's just do a simple NCA-like update stub
    this.update()
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
  }

  public getGrid(): string[][] {
    return this.grid
  }
}
