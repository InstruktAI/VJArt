import React, { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, ChromaticAberration, Scanline } from '@react-three/postprocessing'
import * as THREE from 'three'
import { UNIFIED_CHARSET } from '@vj-art/engine'
import { createFontAtlas } from './atlas'
import { createASCIIMaterial } from './shaders'

export interface SharedBuffers {
  charIndices: Uint16Array
  intensities: Float32Array
  colors: Float32Array
  bgColor: [number, number, number]
  bloom: number
  scanlineOpacity: number
  dirty: boolean
}

export interface ThreeRendererProps {
  buffersRef: React.RefObject<SharedBuffers>
  width: number
  height: number
}

function ASCIIGrid({
  buffersRef,
  width,
  height,
}: {
  buffersRef: React.RefObject<SharedBuffers>
  width: number
  height: number
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const count = width * height

  const atlas = useMemo(() => createFontAtlas(UNIFIED_CHARSET, 64), [])
  const material = useMemo(() => createASCIIMaterial(atlas), [atlas])
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), [])

  const charAttr = useMemo(() => {
    const arr = new Float32Array(count)
    return new THREE.InstancedBufferAttribute(arr, 1)
  }, [count])

  // Position instances once
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        dummy.position.set(x - width / 2 + 0.5, (height - 1 - y) - height / 2 + 0.5, 0)
        dummy.updateMatrix()
        mesh.setMatrixAt(y * width + x, dummy.matrix)
      }
    }
    mesh.instanceMatrix.needsUpdate = true
  }, [width, height])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    mesh.geometry.setAttribute('aCharIndex', charAttr)
    // Initialize instanceColor buffer — Three.js only creates it on first setColorAt()
    mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3)
  }, [charAttr, count])

  // Hot path: direct buffer writes, no React, no method calls per cell
  useFrame(() => {
    const mesh = meshRef.current
    const buf = buffersRef.current
    if (!mesh || !buf) return

    const charArr = charAttr.array as Float32Array
    const colorArr = mesh.instanceColor?.array as Float32Array | undefined
    if (!colorArr) return

    const { charIndices, intensities, colors } = buf

    for (let i = 0; i < count; i++) {
      charArr[i] = charIndices[i] ?? 0

      const intensity = intensities[i] ?? 0
      const ci = i * 3
      colorArr[ci] = (colors[ci] ?? 0) * intensity
      colorArr[ci + 1] = (colors[ci + 1] ?? 0) * intensity
      colorArr[ci + 2] = (colors[ci + 2] ?? 0) * intensity
    }

    charAttr.needsUpdate = true
    mesh.instanceColor!.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[geometry, material, count]} />
  )
}

function DynamicBackground({ buffersRef }: { buffersRef: React.RefObject<SharedBuffers> }) {
  const { scene } = useThree()
  const bgRef = useRef(new THREE.Color(0, 0, 0))
  useEffect(() => { scene.background = bgRef.current }, [scene])
  useFrame(() => {
    const buf = buffersRef.current
    if (!buf) return
    bgRef.current.setRGB(buf.bgColor[0], buf.bgColor[1], buf.bgColor[2])
  })
  return null
}

function DynamicEffects({ buffersRef }: { buffersRef: React.RefObject<SharedBuffers> }) {
  const bloomRef = useRef<{ intensity: number }>(null!)
  const scanlineRef = useRef<{ opacity: number }>(null!)

  useFrame(() => {
    const buf = buffersRef.current
    if (!buf) return
    if (bloomRef.current) bloomRef.current.intensity = buf.bloom
    if (scanlineRef.current) scanlineRef.current.opacity = buf.scanlineOpacity
  })

  return (
    <EffectComposer enableNormalPass={false}>
      <Bloom
        ref={bloomRef}
        luminanceThreshold={0.2}
        mipmapBlur
        intensity={1.35}
        radius={0.4}
      />
      <ChromaticAberration offset={new THREE.Vector2(0.002, 0.002)} />
      <Scanline ref={scanlineRef} density={1.5} opacity={0.12} />
    </EffectComposer>
  )
}

export function ThreeRenderer({ buffersRef, width, height }: ThreeRendererProps) {
  const halfW = width / 2
  const halfH = height / 2

  return (
    <Canvas
      orthographic
      camera={{ left: -halfW, right: halfW, top: halfH, bottom: -halfH, near: 0.1, far: 10, position: [0, 0, 5] }}
      style={{ width: '100vw', height: '100vh' }}
      gl={{ antialias: false }}
    >
      <DynamicBackground buffersRef={buffersRef} />
      <ASCIIGrid buffersRef={buffersRef} width={width} height={height} />
      <DynamicEffects buffersRef={buffersRef} />
    </Canvas>
  )
}
