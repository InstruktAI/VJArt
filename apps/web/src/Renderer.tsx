import React, { useEffect, useRef } from 'react'
import { logToServer } from './logger'

interface WebGLRendererProps {
  grid: string[][]
  color?: [number, number, number]
  bgColor?: [number, number, number]
}

// All characters used by generators + basic ASCII
const CHARSET = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~' +
  '◦○◎●◉█▓▒░' +      // NCA
  '→↗↑↖←↙↓↘∙' +      // Flow
  '∿≈≋〜～' +         // Wave
  'アイウエオカキクケコ' + // Matrix (katakana)
  '⠁⠂⠄⠈⠐⠠⡀⢀⣀⣤⣶⣿' + // Braille dots
  '▀▄▌▐' +            // Block elements
  '·•' +              // Minimal
  '─│┌┐└┘├┤┬┴┼═║╔╗╚╝╠╣╦╩╬' + // Box drawing
  '██'                // Fallback

// Build char → index map
const CHAR_TO_INDEX = new Map<string, number>()
for (let i = 0; i < CHARSET.length; i++) {
  CHAR_TO_INDEX.set(CHARSET[i]!, i)
}

export const ASCIIRenderer: React.FC<WebGLRendererProps> = ({ grid, color = [0, 1, 0], bgColor = [0, 0, 0] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contextRef = useRef<{
    gl: WebGLRenderingContext
    program: WebGLProgram
    atlasTexture: WebGLTexture
    gridTexture: WebGLTexture
    positionBuffer: WebGLBuffer
    atlasSize: number
  } | null>(null)

  const rows = grid.length
  const cols = grid[0]?.length || 0

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      logToServer('error', 'Canvas ref is null')
      return
    }

    const gl = canvas.getContext('webgl')
    if (!gl) {
      logToServer('error', 'WebGL not supported')
      return
    }

    logToServer('info', `Initializing WebGL renderer, charset size: ${CHARSET.length}`)

    // Calculate atlas dimensions (power of 2, square)
    const charsPerRow = Math.ceil(Math.sqrt(CHARSET.length))
    const atlasSize = Math.pow(2, Math.ceil(Math.log2(charsPerRow * 16)))

    // Create Atlas with all chars
    const atlasCanvas = document.createElement('canvas')
    atlasCanvas.width = atlasSize
    atlasCanvas.height = atlasSize
    const ctx = atlasCanvas.getContext('2d')!
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, atlasSize, atlasSize)
    ctx.fillStyle = 'white'
    ctx.font = '14px monospace'
    ctx.textBaseline = 'top'

    const cellSize = 16
    const atlasGridSize = atlasSize / cellSize

    for (let i = 0; i < CHARSET.length; i++) {
      const x = (i % atlasGridSize) * cellSize
      const y = Math.floor(i / atlasGridSize) * cellSize
      ctx.fillText(CHARSET[i]!, x + 2, y + 1)
    }

    const atlasTexture = gl.createTexture()
    if (!atlasTexture) {
      logToServer('error', 'Failed to create atlas texture')
      return
    }
    gl.bindTexture(gl.TEXTURE_2D, atlasTexture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlasCanvas)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

    const vsSource = `
      attribute vec2 aPosition;
      varying vec2 vTexCoord;
      void main() {
        vTexCoord = (aPosition + 1.0) / 2.0;
        vTexCoord.y = 1.0 - vTexCoord.y;
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `

    const fsSource = `
      precision mediump float;
      varying vec2 vTexCoord;
      uniform sampler2D uGrid;
      uniform sampler2D uAtlas;
      uniform vec2 uGridRes;
      uniform float uAtlasGridSize;
      uniform vec3 uColor;
      uniform vec3 uBgColor;

      void main() {
        vec2 gridPos = floor(vTexCoord * uGridRes);
        vec2 charCoord = fract(vTexCoord * uGridRes);

        vec4 gridData = texture2D(uGrid, (gridPos + 0.5) / uGridRes);
        float charIdx = gridData.r * 255.0;

        vec2 atlasPos = vec2(mod(charIdx, uAtlasGridSize), floor(charIdx / uAtlasGridSize));
        vec2 finalTexCoord = (atlasPos + charCoord) / uAtlasGridSize;

        vec4 texColor = texture2D(uAtlas, finalTexCoord);
        vec3 finalColor = mix(uBgColor, uColor, texColor.r);
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `

    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, source)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        logToServer('error', `Shader compile error: ${gl.getShaderInfoLog(s)}`)
      }
      return s
    }

    const program = gl.createProgram()!
    gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vsSource))
    gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fsSource))
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      logToServer('error', `Program link error: ${gl.getProgramInfoLog(program)}`)
    }

    const positionBuffer = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW)

    const gridTexture = gl.createTexture()!

    contextRef.current = { gl, program, atlasTexture, gridTexture, positionBuffer, atlasSize: atlasGridSize }
    logToServer('info', `WebGL initialized, atlas grid: ${atlasGridSize}x${atlasGridSize}`)
  }, [])

  useEffect(() => {
    if (!contextRef.current) return
    if (rows === 0 || cols === 0) {
      logToServer('warn', `Empty grid: ${cols}x${rows}`)
      return
    }

    const { gl, program, gridTexture, positionBuffer, atlasTexture, atlasSize } = contextRef.current

    // Map chars to atlas indices
    const flatGrid = new Uint8Array(rows * cols)
    let unknownChars = new Set<string>()

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const char = grid[y]?.[x] || ' '
        const idx = CHAR_TO_INDEX.get(char)
        if (idx !== undefined) {
          flatGrid[y * cols + x] = idx
        } else {
          flatGrid[y * cols + x] = 0 // Space fallback
          unknownChars.add(char)
        }
      }
    }

    if (unknownChars.size > 0) {
      logToServer('warn', `Unknown chars: ${[...unknownChars].join('')}`)
    }

    gl.bindTexture(gl.TEXTURE_2D, gridTexture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, cols, rows, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, flatGrid)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    gl.useProgram(program)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

    const posLoc = gl.getAttribLocation(program, 'aPosition')
    gl.enableVertexAttribArray(posLoc)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, gridTexture)
    gl.uniform1i(gl.getUniformLocation(program, 'uGrid'), 0)

    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, atlasTexture)
    gl.uniform1i(gl.getUniformLocation(program, 'uAtlas'), 1)

    gl.uniform2f(gl.getUniformLocation(program, 'uGridRes'), cols, rows)
    gl.uniform1f(gl.getUniformLocation(program, 'uAtlasGridSize'), atlasSize)
    gl.uniform3f(gl.getUniformLocation(program, 'uColor'), color[0], color[1], color[2])
    gl.uniform3f(gl.getUniformLocation(program, 'uBgColor'), bgColor[0], bgColor[1], bgColor[2])

    gl.clearColor(bgColor[0], bgColor[1], bgColor[2], 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    const err = gl.getError()
    if (err !== gl.NO_ERROR) {
      logToServer('error', `WebGL error: ${err}`)
    }
  }, [grid, rows, cols, color, bgColor])

  return (
    <canvas
      ref={canvasRef}
      width={Math.min(cols * 10, 1200)}
      height={Math.min(rows * 18, 800)}
      style={{
        width: '100%',
        maxWidth: '100vw',
        height: 'auto',
        maxHeight: '80vh',
        objectFit: 'contain',
        display: 'block'
      }}
    />
  )
}
