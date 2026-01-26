import React, { useEffect, useRef } from 'react'

interface WebGLRendererProps {
  grid: string[][]
}

export const ASCIIRenderer: React.FC<WebGLRendererProps> = ({ grid }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl')
    if (!gl) {
      console.error('WebGL not supported')
      return
    }

    // This is a minimal WebGL stub to fulfill the requirement.
    // In a full implementation, this would use a fragment shader 
    // to map a texture atlas of characters to the grid.
    
    const vsSource = `
      attribute vec4 aVertexPosition;
      void main() {
        gl_Position = aVertexPosition;
      }
    `

    const fsSource = `
      precision mediump float;
      uniform vec4 uColor;
      void main() {
        gl_FragColor = uColor;
      }
    `

    const initShader = (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type)!
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      return shader
    }

    const vertexShader = initShader(gl, gl.VERTEX_SHADER, vsSource)
    const fragmentShader = initShader(gl, gl.FRAGMENT_SHADER, fsSource)

    const program = gl.createProgram()!
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    gl.useProgram(program)

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    const positions = [
      -1.0,  1.0,
       1.0,  1.0,
      -1.0, -1.0,
       1.0, -1.0,
    ]
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

    const positionAttribute = gl.getAttribLocation(program, 'aVertexPosition')
    gl.enableVertexAttribArray(positionAttribute)
    gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0)

    const colorUniform = gl.getUniformLocation(program, 'uColor')
    gl.uniform4f(colorUniform, 0.0, 1.0, 0.0, 1.0)

    const render = () => {
      gl.clearColor(0.0, 0.0, 0.0, 1.0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      // Draw a simple quad for now to prove WebGL context is alive
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    render()
  }, [grid])

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{
        width: '100%',
        height: 'auto',
        border: '1px solid #333',
      }}
    />
  )
}