import React, { useEffect, useRef } from 'react'

interface RendererProps {
  grid: string[][]
}

export const ASCIIRenderer: React.FC<RendererProps> = ({ grid }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const charWidth = 10
    const charHeight = 15
    canvas.width = grid[0]!.length * charWidth
    canvas.height = grid.length * charHeight

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.font = `${charHeight}px monospace`
    ctx.fillStyle = '#0f0'

    grid.forEach((row, y) => {
      row.forEach((char, x) => {
        if (char !== ' ') {
          ctx.fillText(char, x * charWidth, (y + 1) * charHeight)
        }
      })
    })
  }, [grid])

  return (
    <canvas
      ref={canvasRef}
      style={{
        imageRendering: 'pixelated',
        width: '100%',
        height: 'auto',
        border: '1px solid #333',
      }}
    />
  )
}
