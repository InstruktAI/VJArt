import React, { useEffect, useRef } from 'react'

interface WebGLRendererProps {
  grid: string[][]
}

export const ASCIIRenderer: React.FC<WebGLRendererProps> = ({ grid }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contextRef = useRef<{
    gl: WebGLRenderingContext
    program: WebGLProgram
    atlasTexture: WebGLTexture
    gridTexture: WebGLTexture
    positionBuffer: WebGLBuffer
  } | null>(null)

  const rows = grid.length
  const cols = grid[0]?.length || 0

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl')
    if (!gl) return

    // Create Atlas
    const atlasCanvas = document.createElement('canvas')
    atlasCanvas.width = 256
    atlasCanvas.height = 256
    const ctx = atlasCanvas.getContext('2d')!
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, 256, 256)
    ctx.fillStyle = 'white'
    ctx.font = '16px monospace'
    ctx.textBaseline = 'top'
    
    const chars = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\\\]^_`abcdefghijklmnopqrstuvwxyz{|}~"
    for (let i = 0; i < chars.length; i++) {
      const x = (i % 16) * 16
      const y = Math.floor(i / 16) * 16
      ctx.fillText(chars[i]!, x, y)
    }

    const atlasTexture = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, atlasTexture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlasCanvas)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

    // Shaders
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

      void main() {
        vec2 gridPos = floor(vTexCoord * uGridRes);
        vec2 charCoord = fract(vTexCoord * uGridRes);
        
        vec4 gridData = texture2D(uGrid, (gridPos + 0.5) / uGridRes);
        float charIdx = gridData.r * 255.0;
        
        vec2 atlasPos = vec2(mod(charIdx, 16.0), floor(charIdx / 16.0));
        vec2 finalTexCoord = (atlasPos + charCoord) / 16.0;
        
        vec4 color = texture2D(uAtlas, finalTexCoord);
        gl_FragColor = vec4(color.rgb * vec3(0.0, 1.0, 0.0), color.a);
      }
    `

    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, source)
      gl.compileShader(s)
      return s
    }

    const program = gl.createProgram()!
    gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vsSource))
    gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fsSource))
    gl.linkProgram(program)

    const positionBuffer = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW)

    const gridTexture = gl.createTexture()!

    contextRef.current = { gl, program, atlasTexture, gridTexture, positionBuffer }
  }, [])

  useEffect(() => {
    if (!contextRef.current) return
    const { gl, program, gridTexture, positionBuffer, atlasTexture } = contextRef.current

    const flatGrid = new Uint8Array(rows * cols)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const char = grid[y]?.[x] || ' '
        flatGrid[y * cols + x] = char.charCodeAt(0) - 32 // Offset to match our atlas
      }
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

    const gridLoc = gl.getUniformLocation(program, 'uGrid')
    const atlasLoc = gl.getUniformLocation(program, 'uAtlas')
    const resLoc = gl.getUniformLocation(program, 'uGridRes')

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, gridTexture)
    gl.uniform1i(gridLoc, 0)

    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, atlasTexture)
    gl.uniform1i(atlasLoc, 1)

    gl.uniform2f(resLoc, cols, rows)

    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }, [grid, rows, cols])

  return (
    <canvas
      ref={canvasRef}
      width={cols * 8}
      height={rows * 16}
      style={{ width: '100%', height: 'auto', border: '1px solid #333' }}
    />
  )
}