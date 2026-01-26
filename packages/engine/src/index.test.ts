import { VJEngine } from './index'

describe('VJEngine', () => {
  it('should initialize with a grid of the correct size', () => {
    const engine = new VJEngine(10, 5)
    const grid = engine.getGrid()
    expect(grid.length).toBe(5)
    expect(grid[0]!.length).toBe(10)
  })

  it('should register a renderer and return capabilities', () => {
    const engine = new VJEngine(80, 40)
    engine.registerRenderer({
      id: 'test-renderer',
      name: 'Test Renderer',
      supportedGenerators: ['test'],
      maxResolution: { width: 100, height: 100 },
      costTier: 'low'
    })
    const caps = engine.getCapabilities()
    expect(caps.length).toBe(1)
    expect(caps[0]!.id).toBe('test-renderer')
  })
})
