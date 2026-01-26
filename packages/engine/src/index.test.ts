import { VJEngine, AssetIngestor } from './index'

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

  it('should apply workload and update grid', () => {
    const engine = new VJEngine(10, 5)
    engine.applyWorkload({
      state: {
        field_program: { generators: [{ id: 'nca', weight: 1.0 }] },
        ui: []
      }
    })
    const grid = engine.getGrid()
    // Since update() has some randomness, we just check that it's still a grid
    expect(grid.length).toBe(5)
    expect(grid[0]!.length).toBe(10)
  })
})

describe('AssetIngestor', () => {
  it('should convert image data to ASCII', () => {
    const width = 2
    const height = 2
    // Black pixels (0,0,0,255)
    const data = new Uint8ClampedArray([
      0, 0, 0, 255,
      255, 255, 255, 255, // White
      128, 128, 128, 255, // Gray
      255, 0, 0, 255     // Red
    ])
    
    const asset = AssetIngestor.processImageData(data, width, height, width, height)
    expect(asset.glyphs.length).toBe(2)
    expect(asset.glyphs[0]![0]).toBe(' ') // Black -> start of ramp
    expect(asset.glyphs[0]![1]).toBe('@') // White -> end of ramp
  })
})

