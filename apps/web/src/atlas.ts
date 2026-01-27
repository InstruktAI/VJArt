import * as THREE from 'three'

export interface FontAtlas {
  texture: THREE.CanvasTexture
  charsPerRow: number
  totalChars: number
}

/**
 * Render all chars in `charset` into a square-grid canvas texture.
 * Each cell is `cellSize × cellSize` pixels. Returns a THREE.CanvasTexture
 * plus layout metadata for the shader.
 */
export function createFontAtlas(
  charset: string,
  cellSize: number = 64,
  font: string = 'bold 48px "Courier New", monospace',
): FontAtlas {
  const totalChars = charset.length
  const charsPerRow = Math.ceil(Math.sqrt(totalChars))
  const rows = Math.ceil(totalChars / charsPerRow)
  const canvasSize = charsPerRow * cellSize

  const canvas = document.createElement('canvas')
  canvas.width = canvasSize
  canvas.height = rows * cellSize

  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.font = font
  ctx.fillStyle = 'white'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let i = 0; i < totalChars; i++) {
    const col = i % charsPerRow
    const row = Math.floor(i / charsPerRow)
    const cx = col * cellSize + cellSize / 2
    const cy = row * cellSize + cellSize / 2
    ctx.fillText(charset[i]!, cx, cy)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.NearestFilter
  texture.needsUpdate = true

  return { texture, charsPerRow, totalChars }
}
